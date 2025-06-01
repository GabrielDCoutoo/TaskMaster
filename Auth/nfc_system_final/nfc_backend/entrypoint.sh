#!/bin/bash

# Esperar o ngrok arrancar
echo "⏳ A aguardar que o ngrok arranque..."
sleep 5

# Obter o URL público do ngrok
NGROK_URL=$(curl -s http://ngrok:4040/api/tunnels | grep -o 'https://[^\"]*' | head -n 1)

# Exportar a variável de ambiente dinamicamente
export REDIRECT_URI="$NGROK_URL"

echo "🔗 REDIRECT_URI definido como: $REDIRECT_URI"

# Iniciar a aplicação Flask
exec python3 auth.py
exec python3 testNFC.py
