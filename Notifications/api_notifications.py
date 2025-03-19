from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import requests
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.auth.transport.requests import Request
from google.oauth2 import service_account

FIREBASE_CREDENTIALS = "firebase-adminsdk.json"
EMAIL_SMTP = "smtp.gmail.com"  # 🔹 Servidor SMTP do teu serviço de email
EMAIL_PORT = 587
EMAIL_USER = "notifications.email2025@gmail.com"  # 🔹 Email remetente
EMAIL_PASSWORD = "uepq nybn zvji cvpb"  # 🔹 Senha do email (deve ser gerada como app password)

app = FastAPI()

# 🔹 Simulação de Base de Dados para armazenar API Keys
api_keys_db = {}

# 🔹 Função para obter token JWT do Firebase
def obter_token_firebase():
    credentials = service_account.Credentials.from_service_account_file(
        FIREBASE_CREDENTIALS, scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    credentials.refresh(Request())
    return credentials.token

# 🔹 **Função para gerar uma nova API Key**
def gerar_api_key():
    return secrets.token_hex(32)  # 🔥 Gera uma chave segura de 64 caracteres

# 🔹 **Modelo para resposta da API Key**
class APIKeyResponse(BaseModel):
    api_key: str

# 🔹 **Endpoint para gerar uma API Key dinâmica**
@app.post("/generate_api_key", response_model=APIKeyResponse)
def generate_api_key():
    new_api_key = gerar_api_key()
    api_keys_db[new_api_key] = True  # Guarda na "base de dados"
    return {"api_key": new_api_key}

# 🔹 **Função para validar a API Key**
def validar_api_key(api_key: str):
    if api_key not in api_keys_db:
        raise HTTPException(status_code=401, detail="API Key inválida!")

# 🔹 **Modelo para envio de notificações Firebase**
class NotificationRequest(BaseModel):
    user_token: str
    title: str
    message: str

# 🔹 **Modelo para envio de emails**
class EmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str

# 🔹 **Endpoint para envio de notificações Firebase (Push)**
@app.post("/send_notification")
def send_firebase_notification(notification: NotificationRequest, api_key: str = Depends(validar_api_key)):
    headers = {
        "Authorization": f"Bearer {obter_token_firebase()}",
        "Content-Type": "application/json"
    }
    data = {
        "message": {
            "token": notification.user_token,
            "notification": {
                "title": notification.title,
                "body": notification.message
            }
        }
    }

    response = requests.post("https://fcm.googleapis.com/v1/projects/notificacoes-egs2025/messages:send", json=data, headers=headers)

    if response.status_code == 200:
        return {"message": "Notificação Firebase enviada com sucesso"}
    else:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar notificação: {response.text}")

# 🔥 **Novo Endpoint: Enviar Email**
@app.post("/send_email")
def send_email(email_request: EmailRequest, api_key: str = Depends(validar_api_key)):
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_USER
        msg["To"] = email_request.to_email
        msg["Subject"] = email_request.subject
        msg.attach(MIMEText(email_request.body, "plain"))

        # Conectar ao servidor SMTP e enviar email
        server = smtplib.SMTP(EMAIL_SMTP, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_USER, email_request.to_email, msg.as_string())
        server.quit()

        return {"message": f"Email enviado para {email_request.to_email} com sucesso!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar email: {str(e)}")
