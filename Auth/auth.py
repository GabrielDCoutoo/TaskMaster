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
    'client_id': 'agh44RajMJcYvCIq3lSMrutfPJ0a',
    'client_secret': 'tMd7PPpzIR2JaY4u_dWEhr9kW9Ya',
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
    """ Handles the OAuth callback manually since WSO2 redirects only to http://localhost:5000 """
    code = request.args.get('code')
    if code:
        return handle_oauth_callback(code)
    
    if 'user' in session:
        return jsonify(session['user'])

    return redirect(url_for('login'))


def handle_oauth_callback(code):
    """ Manually handles OAuth response when WSO2 redirects to http://localhost:5000 """
    client_id = app.config['OAUTH_CREDENTIALS']['client_id']
    client_secret = app.config['OAUTH_CREDENTIALS']['client_secret']
    token_url = app.config['OAUTH_CREDENTIALS']['token_url']
    
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': "http://localhost:5000",  # Must match allowed redirect URIs
    }
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
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
        user = User(name=user_info.get("name"), email=user_info.get("email"), total_points=0)
        db.add(user)
        db.commit()

    session['user'] = user_info
    db.close()

    return jsonify({'message': 'Login successful!', 'access_token': access_token})


@app.route('/login')
def login():
    redirect_uri = "http://localhost:5000"  # This must match an allowed URI in WSO2
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

    redirect_uri = "http://localhost:5000"  # Must match WSO2 allowed redirect URIs
    token_url = app.config['OAUTH_CREDENTIALS']['token_url']

    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': app.config['OAUTH_CREDENTIALS']['client_id'],
        'client_secret': app.config['OAUTH_CREDENTIALS']['client_secret'],
    }

    headers = {'Content-Type': 'application/x-www-form-urlencoded'}

    print("🔄 Sending token request to WSO2...")
    response = requests.post(token_url, data=data, headers=headers)

    print(f"🔄 Token response status code: {response.status_code}")
    print(f"🔄 Token response body: {response.text}")

    if response.status_code != 200:
        print("❌ ERROR: Failed to obtain access token")
        return jsonify({'error': 'Failed to obtain access token'}), 400

    token_data = response.json()
    access_token = token_data.get('access_token')

    if not access_token:
        print("❌ ERROR: No access token received")
        return jsonify({'error': 'No access token received'}), 400

    print(f"✅ Access token received: {access_token}")

    # Fetch user info
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info = requests.get(app.config['OAUTH_CREDENTIALS']['userinfo_endpoint'], headers=headers).json()

    print(f"✅ User Info: {user_info}")

    session['user'] = user_info

    return jsonify({'message': 'Login successful!', 'access_token': access_token})

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
    app.run(host="0.0.0.0",port="5000", debug=True)

