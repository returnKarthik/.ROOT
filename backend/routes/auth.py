import uuid
from flask import Blueprint, request, jsonify, g
from db import get_db, SERVER_TIMESTAMP
from auth_utils import hash_password, verify_password, generate_jwt_token
from middleware import login_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    display_name = data.get('displayName', '').strip()

    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    if not display_name:
        display_name = email.split('@')[0]

    db = get_db()
    
    # Check if user already exists with this email
    existing_users = db.collection('users').where('email', '==', email).stream()
    for _ in existing_users:
        return jsonify({'error': 'An account with this email already exists'}), 400

    uid = f"user_{uuid.uuid4().hex[:12]}"
    password_hash = hash_password(password)

    user_data = {
        'uid': uid,
        'email': email,
        'displayName': display_name,
        'passwordHash': password_hash,
        'bio': '',
        'photoURL': None,
        'followersCount': 0,
        'followingCount': 0,
        'createdAt': SERVER_TIMESTAMP
    }

    db.collection('users').document(uid).set(user_data)

    token = generate_jwt_token(uid=uid, email=email, display_name=display_name)

    safe_user = {
        'uid': uid,
        'email': email,
        'displayName': display_name,
        'bio': '',
        'photoURL': None,
        'followersCount': 0,
        'followingCount': 0
    }

    return jsonify({
        'token': token,
        'user': safe_user
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db = get_db()
    docs = db.collection('users').where('email', '==', email).stream()
    matched_doc = None
    for doc in docs:
        matched_doc = doc
        break

    if not matched_doc:
        return jsonify({'error': 'Invalid email or password'}), 401

    user_dict = matched_doc.to_dict()
    stored_hash = user_dict.get('passwordHash')

    if not stored_hash or not verify_password(stored_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    uid = matched_doc.id
    display_name = user_dict.get('displayName', email.split('@')[0])
    token = generate_jwt_token(uid=uid, email=email, display_name=display_name)

    safe_user = {
        'uid': uid,
        'email': user_dict.get('email', email),
        'displayName': display_name,
        'bio': user_dict.get('bio', ''),
        'photoURL': user_dict.get('photoURL'),
        'followersCount': user_dict.get('followersCount', 0),
        'followingCount': user_dict.get('followingCount', 0)
    }

    return jsonify({
        'token': token,
        'user': safe_user
    }), 200

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    db = get_db()
    doc = db.collection('users').document(g.uid).get()
    if not doc.exists:
        return jsonify({'error': 'User not found'}), 404
    
    user_dict = doc.to_dict()
    safe_user = {
        'uid': g.uid,
        'email': user_dict.get('email', ''),
        'displayName': user_dict.get('displayName', ''),
        'bio': user_dict.get('bio', ''),
        'photoURL': user_dict.get('photoURL'),
        'followersCount': user_dict.get('followersCount', 0),
        'followingCount': user_dict.get('followingCount', 0)
    }
    return jsonify(safe_user), 200
