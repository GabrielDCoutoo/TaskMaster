FROM python:3.11-slim

WORKDIR /app

# Copiar requirements primeiro para aproveitar cache de camadas
COPY requirements.txt .

# Atualizar e instalar dependências, evitando problemas de DNS
RUN apt-get update --allow-releaseinfo-change && \
    apt-get install -y curl && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copiar restante código
COPY . .

# Permissões para o entrypoint
RUN chmod +x nfc_system_final/nfc_backend/entrypoint.sh

CMD ["python3"]

