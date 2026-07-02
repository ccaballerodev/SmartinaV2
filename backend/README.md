Comando de prueba para n8n
Invoke-RestMethod -Uri http://127.0.0.1:5000/api/chat -Method Post -ContentType "application/json" -Body '{"chatInput":"Hola, esto es una prueba"}'