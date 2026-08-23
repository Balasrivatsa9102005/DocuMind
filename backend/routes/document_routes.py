from pathlib import Path

from flask import Blueprint, request, jsonify

from utils.validators import is_allowed_file, get_file_extension
from services.pdf_extractor import extract_text_from_pdf
from services.ocr_service import extract_text_from_image
from services.docx_extractor import extract_text_from_docx
from services.summarizer import summarize_text


document_bp = Blueprint("document", __name__)
UPLOAD_FOLDER = Path(__file__).resolve().parent.parent / "uploads"


@document_bp.route("/api/documents/upload", methods=["POST"])
def upload_document():

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

    if not is_allowed_file(file.filename):
        return jsonify({
            "status": "error",
            "message": "Unsupported file type. Allowed formats: PDF, DOCX, PNG, JPG, JPEG"
        }), 400

    summary_length = request.form.get("summary_length", "medium")

    allowed_lengths = {"short", "medium", "long"}

    if summary_length not in allowed_lengths:
        return jsonify({
            "status": "error",
            "message": "Invalid summary length. Choose short, medium, or long."
        }), 400

    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    filename = Path(file.filename).name
    file_path = UPLOAD_FOLDER / filename

    file.save(file_path)

    extension = get_file_extension(filename)

    # PDF
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

        summary = summarize_text(text, summary_length)

        return jsonify({
            "status": "success",
            "message": "PDF processed and summarized successfully",
            "filename": filename,
            "file_type": extension,
            "pages": len(pages),
            "summary_length": summary_length,
            "summary": summary
        }), 200

    # DOCX
    if extension == "docx":

        text = extract_text_from_docx(file_path)

        if not text.strip():
            return jsonify({
                "status": "error",
                "message": "No text could be extracted from the DOCX."
            }), 400

        summary = summarize_text(text, summary_length)

        return jsonify({
            "status": "success",
            "message": "DOCX processed and summarized successfully",
            "filename": filename,
            "file_type": extension,
            "summary_length": summary_length,
            "summary": summary
        }), 200

    # IMAGE
    if extension in {"png", "jpg", "jpeg"}:

        text = extract_text_from_image(file_path)

        if not text.strip():
            return jsonify({
                "status": "error",
                "message": "No text could be extracted from the image."
            }), 400

        summary = summarize_text(text, summary_length)

        return jsonify({
            "status": "success",
            "message": "Image processed and summarized successfully",
            "filename": filename,
            "file_type": extension,
            "summary_length": summary_length,
            "summary": summary
        }), 200

    return jsonify({
        "status": "error",
        "message": "Unable to process this file type"
    }), 400