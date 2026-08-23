from pathlib import Path

from flask import Blueprint, request, jsonify
from requests.exceptions import HTTPError

from utils.validators import is_allowed_file, get_file_extension
from services.pdf_extractor import extract_text_from_pdf
from services.docx_extractor import extract_text_from_docx
from services.summarizer import summarize_text


document_bp = Blueprint("document", __name__)

UPLOAD_FOLDER = Path(__file__).resolve().parent.parent / "uploads"


@document_bp.route("/api/documents/upload", methods=["POST"])
def upload_document():

    # Check file
    if "file" not in request.files:
        return jsonify({
            "status": "error",
            "message": "No file provided"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "status": "error",
            "message": "No file selected"
        }), 400

    # Only PDF and DOCX are supported on deployment
    filename = Path(file.filename).name
    extension = get_file_extension(filename)

    if extension not in {"pdf", "docx"}:
        return jsonify({
            "status": "error",
            "message": "Unsupported file type. Please upload a PDF or DOCX file."
        }), 400

    # Summary length
    summary_length = request.form.get("summary_length", "medium")

    allowed_lengths = {"short", "medium", "long"}

    if summary_length not in allowed_lengths:
        return jsonify({
            "status": "error",
            "message": "Invalid summary length. Choose short, medium, or long."
        }), 400

    # Create upload directory
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    file_path = UPLOAD_FOLDER / filename

    try:
        # Save uploaded file
        file.save(file_path)

        # =========================================================
        # PDF
        # =========================================================
        if extension == "pdf":

            pages = extract_text_from_pdf(file_path)

            text = "\n\n".join(
                page["text"] for page in pages
            )

            if not text.strip():
                return jsonify({
                    "status": "error",
                    "message": "No text could be extracted from the PDF."
                }), 400

            # Generate summary
            summary = summarize_text(
                text,
                summary_length
            )

            return jsonify({
                "status": "success",
                "message": "PDF processed and summarized successfully",
                "filename": filename,
                "file_type": extension,
                "pages": len(pages),
                "summary_length": summary_length,
                "summary": summary
            }), 200

        # =========================================================
        # DOCX
        # =========================================================
        if extension == "docx":

            text = extract_text_from_docx(file_path)

            if not text.strip():
                return jsonify({
                    "status": "error",
                    "message": "No text could be extracted from the DOCX."
                }), 400

            # Generate summary
            summary = summarize_text(
                text,
                summary_length
            )

            return jsonify({
                "status": "success",
                "message": "DOCX processed and summarized successfully",
                "filename": filename,
                "file_type": extension,
                "summary_length": summary_length,
                "summary": summary
            }), 200

        # Should never reach here
        return jsonify({
            "status": "error",
            "message": "Unable to process this file type."
        }), 400

    # =============================================================
    # Gemini / AI rate limit
    # =============================================================
    except HTTPError as e:

        if e.response is not None:

            if e.response.status_code == 429:
                return jsonify({
                    "status": "error",
                    "message": (
                        "The AI service is temporarily rate-limited. "
                        "Please try again in a few minutes."
                    )
                }), 429

            if e.response.status_code >= 500:
                return jsonify({
                    "status": "error",
                    "message": (
                        "The AI service is temporarily unavailable. The AI service has temporarily reached its usage limit.Please try again later."
                    )
                }), 502

        return jsonify({
            "status": "error",
            "message": "The AI service could not process your request. API may be down or rate-limited. Please try again later."
        }), 502

    # =============================================================
    # Any unexpected processing error
    # =============================================================
    except Exception as e:

        print(f"Document processing error: {e}")

        return jsonify({
            "status": "error",
            "message": (
                "Unable to process the document right now. "
                "The AI service has temporarily reached its usage limit.Please try again later."
            )
        }), 500

    finally:

        # Remove uploaded file after processing
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception as cleanup_error:
            print(f"File cleanup error: {cleanup_error}")