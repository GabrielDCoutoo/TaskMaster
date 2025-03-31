from flask import Flask, request, jsonify, redirect, session, url_for
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import sys
import os

# Add PointSystemAPI to sys.path to import database and models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../PointSystemAPI')))

import datetime
import requests
import base64
from sqlalchemy.orm import Session
from database import SessionLocal  # Ensure this is correctly imported
from models import User  # Import the correct User model

# Define database connection
URL_DATABASE = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/PointSystemEGS")

app = Flask(__name__)
app.secret_key = os.urandom(24)

# OAuth Configuration (WSO2)
app.config['OAUTH_CREDENTIALS'] = {
    'client_id': 'u8vpP8lcTQLURxk8itbLvY4pySoa',
    'client_secret': 'REeS1LgzdyZfPmaIXloiNor3cMwa',
    'authorize_url': 'https://wso2-gw.ua.pt/authorize', 
    'token_url': 'https://wso2-gw.ua.pt/token',
    'userinfo_endpoint': 'https://wso2-gw.ua.pt/userinfo'
}


oauth = OAuth(app)
ua_oauth = oauth.register(
    name='ua',
    client_id=app.config['OAUTH_CREDENTIALS']['client_id'],
    client_secret= app.config['OAUTH_CREDENTIALS']['client_secret'],
    authorize_url=app.config['OAUTH_CREDENTIALS']['authorize_url'],
    token_url=app.config['OAUTH_CREDENTIALS']['token_url'],
    client_kwargs={'scope': 'openid email profile'},
)

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.route('/')
def home():
    code = request.args.get('code')
    state = request.args.get('state')
    session_state = request.args.get('session_state')

    if code:
        print("🔑 CÓDIGO DE AUTORIZAÇÃO RECEBIDO DO WSO2:")
        print(f"👉 code = {code}")
        print(f"🔐 state = {state}")
        print(f"🧾 session_state = {session_state}")
        return handle_oauth_callback(code)

    if 'user' in session:
        return jsonify(session['user'])

    return redirect(url_for('login'))


def handle_oauth_callback(code):
    client_id = app.config['OAUTH_CREDENTIALS']['client_id']
    client_secret = app.config['OAUTH_CREDENTIALS']['client_secret']
    token_url = app.config['OAUTH_CREDENTIALS']['token_url']
    
    # Gerar o header Basic Auth corretamente
    auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': "http://localhost:5000",  # Must match allowed redirect URIs
    }

    headers = {
        'Authorization': 'Basic dTh2cFA4bGNUUUxVUnhrOGl0Ykx2WTRweVNvYTpSRWVTMUxnemR5WmZQbWFJWGxvaU5vcjNjTXdh',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    response = requests.post(token_url, data=data, headers=headers)

    if response.status_code != 200:
        return "Authorization failed", 400

    token_data = response.json()
    access_token = token_data.get('access_token')

    headers = {'Authorization': f'Bearer {access_token}'}
    user_info = requests.get(app.config['OAUTH_CREDENTIALS']['userinfo_endpoint'], headers=headers).json()

    db = SessionLocal()
    user = db.query(User).filter_by(email=user_info.get("email")).first()

    if not user:
        nome_utilizador = user_info.get("name") or user_info.get("given_name") or "Sem Nome"
        print("📝 Nome recebido:", nome_utilizador)

        user = User(
            name=nome_utilizador,
            email=user_info.get("email"),
            total_points=0
        )
        db.add(user)
        db.commit()


    session['user'] = user_info
    db.close()

    return jsonify({'message': 'Login successful!', 'access_token': access_token})


@app.route('/login')
def login():
    redirect_uri = "http://localhost:5000"  # Must match allowed URI in WSO2
    return ua_oauth.authorize_redirect(redirect_uri)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    state = request.args.get('state')

    if not code:
        print("❌ ERROR: No authorization code received")
        return jsonify({'error': 'Authorization code missing'}), 400

    print(f"✅ Authorization code received: {code}")
    print(f"✅ State: {state}")

    return handle_oauth_callback(code)

@app.route('/protected', methods=['GET'])
def protected():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 403
    try:
        data = jwt.decode(token, app.secret_key, algorithms=['HS256'])
        return jsonify({'message': f'Welcome {data["username"]}!'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token expired!'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token!'}), 403

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
