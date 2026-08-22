from flask import Flask, jsonify
from flask_cors import CORS

from routes.document_routes import document_bp


app = Flask(__name__)

CORS(app)

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

app.register_blueprint(document_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "success",
        "message": "Document Summary Assistant backend is running"
    })


if __name__ == "__main__":
    app.run(debug=True)