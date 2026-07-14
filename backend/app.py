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
    "http://localhost:5678/pones-tu-webhook-aqui"
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


if __name__ == "__main__":
    app.run(
        debug=True,
        threaded=True,
        port=5000
    )