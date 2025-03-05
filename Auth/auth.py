from flask import Flask, request, jsonify, redirect, session, url_for
from authlib.integrations.flask_client import OAuth
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)

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

# Modelo de utilizador
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(100), nullable=False)
    nfc_uid = db.Column(db.String(20), unique=True, nullable=True)  # UID do cartão NFC

def create_database():
    db.create_all()

@app.route('/')
def home():
    if 'user' in session:
        return jsonify(session['user'])
    return redirect(url_for('login'))

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'], method='sha256')
    new_user = User(username=data['username'], password_hash=hashed_password, nfc_uid=data.get('nfc_uid'))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/login')
def login():
    return ua_oauth.authorize_redirect(url_for('callback', _external=True))

@app.route('/callback')
def callback():
    token = ua_oauth.authorize_access_token()
    user_info = ua_oauth.get(app.config['OAUTH_CREDENTIALS']['userinfo_endpoint']).json()
    user = User.query.filter_by(username=user_info.get("email")).first()
    if not user:
        user = User(username=user_info.get("email"))
        db.session.add(user)
        db.session.commit()
    session['user'] = user_info
    return jsonify({'message': 'Login bem-sucedido!', 'token': token})

@app.route('/multi-auth', methods=['POST'])
def multi_auth():
    data = request.get_json()
    nfc_uid = data.get("nfc_uid")
    token = data.get("token")
    
    # Validação via NFC
    user_nfc = User.query.filter_by(nfc_uid=nfc_uid).first()
    
    # Validação via OAuth
    try:
        token_data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_oauth = User.query.filter_by(username=token_data['username']).first()
    except:
        user_oauth = None
    
    if user_nfc and user_oauth and user_nfc.username == user_oauth.username:
        return jsonify({'message': f'Autenticação combinada bem-sucedida para {user_nfc.username}'}), 200
    return jsonify({'message': 'Autenticação falhou!'}), 401

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
    with app.app_context():
        create_database()
    app.run(debug=True)
