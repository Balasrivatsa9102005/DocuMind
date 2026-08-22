from pathlib import Path

from flask import Blueprint, request, jsonify

from utils.validators import is_allowed_file, get_file_extension
from services.pdf_extractor import extract_text_from_pdf
from services.ocr_service import extract_text_from_image


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
            "message": "Unsupported file type. Allowed formats: PDF, PNG, JPG, JPEG"
        }), 400

    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    filename = Path(file.filename).name
    file_path = UPLOAD_FOLDER / filename

    file.save(file_path)

    extension = get_file_extension(filename)

    # PDF text extraction
    if extension == "pdf":
        pages = extract_text_from_pdf(file_path)

        return jsonify({
            "status": "success",
            "message": "PDF uploaded and text extracted successfully",
            "filename": filename,
            "file_type": extension,
            "pages": len(pages),
            "content": pages
        }), 200

    # Image OCR
    if extension in {"png", "jpg", "jpeg"}:
        text = extract_text_from_image(file_path)

        return jsonify({
            "status": "success",
            "message": "Image uploaded and text extracted successfully",
            "filename": filename,
            "file_type": extension,
            "content": text
        }), 200

    return jsonify({
        "status": "error",
        "message": "Unable to process this file type"
    }), 400