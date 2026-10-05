from pathlib import Path

from flask import Blueprint, jsonify, request
from requests.exceptions import HTTPError, RequestException

from services.docx_extractor import extract_text_from_docx
from services.pdf_extractor import extract_text_from_pdf
from services.rag_service import answer_question, create_document
from services.summarizer import summarize_text
from utils.validators import get_file_extension


document_bp = Blueprint("document", __name__)

UPLOAD_FOLDER = Path(__file__).resolve().parent.parent / "uploads"


@document_bp.route("/api/documents/ask", methods=["POST"])
def ask_document_question():
    data = request.get_json(silent=True) or {}
    document_id = data.get("document_id")
    question = data.get("question", "").strip()

    if not document_id or not question:
        return jsonify({
            "status": "error",
            "message": "document_id and question are required"
        }), 400

    try:
        result = answer_question(document_id, question)
        return jsonify({
            "status": "success",
            "document_id": document_id,
            "question": question,
            **result
        }), 200
    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 404
    except (RequestException, RuntimeError) as error:
        print(f"Question service error: {error}")
        return jsonify({
            "status": "error",
            "message": "The question service is unavailable. Check the configured AI provider and try again."
        }), 502
    except Exception as error:
        print(f"Question processing error: {error}")
        return jsonify({
            "status": "error",
            "message": "Unable to process the question right now."
        }), 500


@document_bp.route("/api/documents/upload", methods=["POST"])
def upload_document():
    if "file" not in request.files:
        return jsonify({
            "status": "error",
            "message": "No file provided"
        }), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({
            "status": "error",
            "message": "No file selected"
        }), 400

    filename = Path(file.filename).name
    extension = get_file_extension(filename)

    if extension not in {"pdf", "docx"}:
        return jsonify({
            "status": "error",
            "message": "Unsupported file type. Please upload a PDF or DOCX file."
        }), 400

    summary_length = request.form.get("summary_length", "medium")

    if summary_length not in {"short", "medium", "long"}:
        return jsonify({
            "status": "error",
            "message": "Invalid summary length. Choose short, medium, or long."
        }), 400

    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_FOLDER / filename

    try:
        file.save(file_path)

        pages = None

        if extension == "pdf":
            pages = extract_text_from_pdf(file_path)
            text = "\n\n".join(page["text"] for page in pages)
        else:
            text = extract_text_from_docx(file_path)

        if not text.strip():
            return jsonify({
                "status": "error",
                "message": f"No text could be extracted from the {extension.upper()}."
            }), 400

        document_id, chunk_count = create_document(
            text=text,
            pages=pages
        )

        summary = summarize_text(text, summary_length)
        question = request.form.get("question", "").strip()
        sources = []
        answer = None

        if question:
            rag_response = answer_question(document_id, question)
            answer = rag_response["answer"]
            sources = rag_response["sources"]

        response = {
            "status": "success",
            "message": f"{extension.upper()} processed and summarized successfully",
            "filename": filename,
            "file_type": extension,
            "summary_length": summary_length,
            "summary": summary,
            "chunk_count": chunk_count,
            "sources": sources,
            "document_id": document_id
        }

        if pages is not None:
            response["pages"] = len(pages)

        if answer is not None:
            response["answer"] = answer

        return jsonify(response), 200

    except HTTPError as error:
        if error.response is not None:
            if error.response.status_code == 429:
                return jsonify({
                    "status": "error",
                    "message": "The AI service is temporarily rate-limited. Please try again in a few minutes."
                }), 429

            if error.response.status_code >= 500:
                return jsonify({
                    "status": "error",
                    "message": "The AI service is temporarily unavailable. Please try again later."
                }), 502

        return jsonify({
            "status": "error",
            "message": "The AI service could not process your request. Please try again later."
        }), 502

    except Exception as error:
        print(f"Document processing error: {error}")
        return jsonify({
            "status": "error",
            "message": "Unable to process the document right now. Please try again later."
        }), 500

    finally:
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception as cleanup_error:
            print(f"File cleanup error: {cleanup_error}")
