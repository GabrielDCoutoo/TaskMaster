from flask import Flask, request, jsonify, redirect, session, url_for
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os

from sqlalchemy.orm import Session
from database import SessionLocal
from models import User  # Importar a classe correta da BD

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Configuração OAuth
app.config['OAUTH_CREDENTIALS'] = {
    'client_id': '5ed751bc77b47c006634d1798f36286d3d8dcda107',
    'client_secret': '',  # Quando for aprovado
    'authorize_url': 'http://api.web.ua.pt/pt/services/universidade_de_aveiro/oauth/authorize',
    'token_url': 'http://api.web.ua.pt/pt/services/universidade_de_aveiro/oauth/token',
    'userinfo_endpoint': 'http://api.web.ua.pt/pt/services/universidade_de_aveiro/oauth/userinfo'
}

oauth = OAuth(app)
ua_oauth = oauth.register(
    name='ua',
    client_id=app.config['OAUTH_CREDENTIALS']['client_id'],
    client_secret=app.config['OAUTH_CREDENTIALS']['client_secret'],
    authorize_url=app.config['OAUTH_CREDENTIALS']['authorize_url'],
    token_url=app.config['OAUTH_CREDENTIALS']['token_url'],
    client_kwargs={'scope': 'profile email'},
)

# Dependência para obter sessão da Base de Dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.route('/')
def home():
    if 'user' in session:
        return jsonify(session['user'])
    return redirect(url_for('login'))

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    db: Session = next(get_db())  # Obter sessão da BD

    hashed_password = generate_password_hash(data['password'], method='sha256')
    new_user = User(
        name=data['name'], 
        email=data['email'], 
        total_points=0  # Campo existente na BD
    )
    db.add(new_user)
    db.commit()
    db.close()

    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/login')
def login():
    return ua_oauth.authorize_redirect(url_for('callback', _external=True))

@app.route('/callback')
def callback():
    token = ua_oauth.authorize_access_token()
    user_info = ua_oauth.get(app.config['OAUTH_CREDENTIALS']['userinfo_endpoint']).json()
    
    db: Session = next(get_db())  # Obter sessão da BD
    user = db.query(User).filter_by(email=user_info.get("email")).first()
    
    if not user:
        user = User(name=user_info.get("name"), email=user_info.get("email"), total_points=0)
        db.add(user)
        db.commit()
    
    session['user'] = user_info
    db.close()
    
    return jsonify({'message': 'Login bem-sucedido!', 'token': token})

@app.route('/protected', methods=['GET'])
def protected():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 403
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return jsonify({'message': f'Welcome {data["username"]}!'}), 200
    except:
        return jsonify({'message': 'Invalid token!'}), 403

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
