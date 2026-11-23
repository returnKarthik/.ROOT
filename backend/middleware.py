from functools import wraps
from flask import request, jsonify, g
from auth_utils import decode_jwt_token

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized', 'message': 'Missing or invalid token format'}), 401

        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = decode_jwt_token(token)
            g.user = {
                'uid': payload['uid'],
                'email': payload.get('email', ''),
                'name': payload.get('name', 'Unknown'),
                'picture': payload.get('picture', '')
            }
            g.uid = payload['uid']
        except Exception as e:
            return jsonify({'error': 'Unauthorized', 'message': str(e)}), 401

        return f(*args, **kwargs)
    return decorated_function
