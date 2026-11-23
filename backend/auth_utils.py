import os
import datetime
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

JWT_SECRET = os.getenv("JWT_SECRET", "grietgo-super-secret-jwt-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_password(password_hash: str, password: str) -> bool:
    return check_password_hash(password_hash, password)

def generate_jwt_token(uid: str, email: str, display_name: str = "") -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "uid": uid,
        "email": email,
        "name": display_name,
        "iat": now,
        "exp": now + datetime.timedelta(days=JWT_EXPIRATION_DAYS)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {e}")
