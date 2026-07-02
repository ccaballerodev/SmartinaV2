import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/tu-endpoint-aqui")

@app.route('/api/chat', methods=['POST'])
def chat_bridge():
    try:
        data = request.json
        user_message = data.get("chatInput", "")
        
        if not user_message:
            return jsonify({"error": "El mensaje no puede estar vacío"}), 400

        payload = {"chatInput": user_message}
        response = requests.post(N8N_WEBHOOK_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            n8n_data = response.json()
            bot_reply = n8n_data.get("output") or n8n_data.get("response") or "Sin respuesta legible de n8n."
            return jsonify({"reply": bot_reply})
        else:
            return jsonify({"error": f"Error en el servidor de n8n: {response.status_code}"}), 500

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"No se pudo conectar con n8n: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)