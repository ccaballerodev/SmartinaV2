import os
import json

from flask import Flask, request, Response, jsonify, stream_with_context
from flask_cors import CORS
import httpx
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "http://localhost:5173"
        }
    }
)

N8N_WEBHOOK_URL = os.getenv(
    "N8N_WEBHOOK_URL",
    "http://localhost:5678/n8n_main_webhook"
)

N8N_UPLOAD_WEBHOOK = os.getenv(
    "N8N_UPLOAD_WEBHOOK",
    "http://localhost:5678/webhook/upload-document"
)

N8N_DOCUMENTS_WEBHOOK = os.getenv(
    "N8N_DOCUMENTS_WEBHOOK",
    "http://localhost:5678/webhook/listar-documentos"
)

N8N_DELETE_DOCUMENT_WEBHOOK = os.getenv(
    "N8N_DELETE_DOCUMENT_WEBHOOK",
    "http://localhost:5678/webhook/delete-document"
)

@app.route("/api/chat", methods=["POST"])
def chat():

    data = request.get_json()

    if not data:
        return jsonify({"error": "Body inválido"}), 400

    user_message = data.get("chatInput", "").strip()

    session_id = data.get("sessionId", "").strip()

    if not user_message:
        return jsonify({"error": "El mensaje no puede estar vacío"}), 400


    if not session_id:
        return jsonify({"error": "Session ID requerido"}), 400

    payload = {
        "chatInput": user_message,
        "sessionId": session_id,   
    }

    def generate():

        try:

            with httpx.stream(
                "POST",
                N8N_WEBHOOK_URL,
                json=payload,
                timeout=None,
                headers={
                    "Accept": "application/json"
                }
            ) as response:

                response.raise_for_status()

                for line in response.iter_lines():

                    if not line:
                        continue

                    yield line + "\n"

        except Exception as e:

            error = {
                "type": "error",
                "message": str(e)
            }

            yield json.dumps(error) + "\n"

    return Response(
        stream_with_context(generate()),
        content_type="application/x-ndjson"
    )

@app.route("/api/upload", methods=["POST"])
def upload():

    if "file" not in request.files:
        return jsonify({"error": "No se recibió ningún archivo"}), 400

    archivo = request.files["file"]

    if archivo.filename == "":
        return jsonify({"error": "Archivo inválido"}), 400

    # Obtener tamaño del archivo
    archivo.stream.seek(0, os.SEEK_END)
    file_size = archivo.stream.tell()
    archivo.stream.seek(0)

    files = {
        "file": (
            archivo.filename,
            archivo.stream,
            archivo.mimetype
        )
    }

    data = {
        "original_name": archivo.filename,
        "mime_type": archivo.mimetype,
        "file_size": str(file_size)
    }

    response = httpx.post(
        N8N_UPLOAD_WEBHOOK,
        files=files,
        data=data,
        timeout=None
    )

    print("========== RESPUESTA N8N ==========")
    print("Status:", response.status_code)
    print("Headers:", response.headers)
    print("Body:")
    print(response.text)
    print("===================================")

    return Response(
        response.content,
        status=response.status_code,
        content_type=response.headers.get(
            "Content-Type",
            "application/json"
        )
    )

@app.route("/api/documents/<int:document_id>", methods=["DELETE"])
def delete_document(document_id):

    response = httpx.request(
        "DELETE",
        N8N_DELETE_DOCUMENT_WEBHOOK,
        json={
            "document_id": document_id
        },
        timeout=None
    )

    return Response(
        response.content,
        status=response.status_code,
        content_type="application/json"
    )

@app.route("/api/documents", methods=["GET"])
def documents():

    response = httpx.get(
        N8N_DOCUMENTS_WEBHOOK,
        timeout=None
    )

    return Response(
        response.content,
        status=response.status_code,
        content_type="application/json"
    )

if __name__ == "__main__":
    app.run(
        debug=True,
        threaded=True,
        port=5000
    )