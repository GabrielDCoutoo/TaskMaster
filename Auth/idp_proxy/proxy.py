import os
import requests
from flask import Flask, request, redirect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Get variables from .env file
IDP_BASE_URL = os.getenv("IDP_BASE_URL")
IDP_REDIRECT_URI = os.getenv("IDP_REDIRECT_URI")
APP_REDIRECT_URI = os.getenv("APP_REDIRECT_URI")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

@app.route("/")
def home():
    return "IDP Proxy is running!"

@app.route("/auth")
def auth():
    """ Redirects user to WSO2 login """
    auth_url = f"{IDP_BASE_URL}/authorize?response_type=code&client_id={CLIENT_ID}&redirect_uri={IDP_REDIRECT_URI}&scope=openid"
    return redirect(auth_url)

@app.route("/callback")
def callback():
    """ Handles OAuth2 callback and forwards token to the real application """
    code = request.args.get("code")
    if not code:
        return "Authorization failed", 400

    # Exchange code for token
    token_url = f"{IDP_BASE_URL}/token"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": IDP_REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    
    response = requests.post(token_url, data=data, headers=headers)
    
    if response.status_code != 200:
        return "Failed to obtain access token", 400

    token_data = response.json()

    # Forward the token to the real app
    forward_response = requests.post(APP_REDIRECT_URI, json=token_data)
    
    return f"Login successful! Token forwarded to {APP_REDIRECT_URI}"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
