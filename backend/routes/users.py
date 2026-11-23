from flask import Blueprint, request, jsonify, g
from services.users import UserService
from middleware import login_required

users_bp = Blueprint('users', __name__)

@users_bp.route('/me/', methods=['GET', 'POST'])
@login_required
def me():
    uid = g.uid
    if request.method == 'GET':
        user = UserService.get_user(uid)
        return jsonify(user) if user else jsonify({})
    
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        if 'image' in request.files:
            from services.posts import PostService # Reusing logic, ideally move to common
            try:
                # We can reuse the upload logic or duplicate. Reusing static method is fine.
                file = request.files['image']
                image_url = PostService.upload_image(file)
                data['photoURL'] = image_url
            except Exception as e:
                return jsonify({'error': str(e)}), 500
    else:
        data = request.json

    updated_user = UserService.create_user(uid, data)
    return jsonify(updated_user)

@users_bp.route('/<uid>/', methods=['GET'])
def get_user(uid):
    user = UserService.get_user(uid)
    if user:
        return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

@users_bp.route('/search/', methods=['GET'])
def search_users():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    users = UserService.search_users(query)
    return jsonify(users)
