import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
from routes.auth import auth_bp
from routes.users import users_bp
from routes.posts import posts_bp
from routes.social import social_bp
from routes.chat import chat_bp
from routes.notifications import notifications_bp

app = Flask(__name__, static_folder='static', static_url_path='/static')

CORS(app, resources={r"/*": {
    "origins": "*",
    "allow_headers": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(posts_bp, url_prefix='/api/posts')
app.register_blueprint(social_bp, url_prefix='/api/social')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

@app.route('/')
def home():
    return jsonify({"status": "healthy", "service": ".ROOT Backend", "auth": "JWT"})

if __name__ == '__main__':
    port = int(os.getenv("PORT", 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
