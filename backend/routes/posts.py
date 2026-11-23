from flask import Blueprint, request, jsonify, g
from services.posts import PostService
from middleware import login_required
from auth_utils import decode_jwt_token

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/', methods=['GET'])
def get_feed():
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
        try:
            decoded_token = decode_jwt_token(token)
            user_id = decoded_token['uid']
        except Exception:
            pass # ignore invalid token for reading public feed

    try:
        limit = int(request.args.get('limit', 10))
        if limit <= 0 or limit > 100:
            limit = 10
    except ValueError:
        limit = 10

    last_doc_id = request.args.get('lastDocId', None)

    posts, next_last_doc_id = PostService.get_feed(user_id=user_id, limit=limit, last_doc_id=last_doc_id)
    return jsonify({'posts': posts, 'lastDocId': next_last_doc_id})

@posts_bp.route('/', methods=['POST'])
@login_required
def create_post():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    caption = request.form.get('caption', '')
    
    try:
        image_url = PostService.upload_image(file)
    except Exception as e:
        print(f"Upload failed: {e}")
        return jsonify({'error': f'Image upload failed: {e}'}), 500

    data = {
        'imageUrl': image_url,
        'caption': caption,
        'authorId': g.uid,
        'authorName': g.user.get('name', 'Unknown'),
        'authorPhotoURL': g.user.get('picture', '')
    }
    
    result = PostService.create_post(data)
    return jsonify(result), 201

@posts_bp.route('/user/<uid>/', methods=['GET'])
def get_user_posts(uid):
    try:
        limit = int(request.args.get('limit', 12))
        if limit <= 0 or limit > 100:
            limit = 12
    except ValueError:
        limit = 12

    last_doc_id = request.args.get('lastDocId', None)

    posts, next_last_doc_id = PostService.get_user_posts(uid, limit=limit, last_doc_id=last_doc_id)
    return jsonify({'posts': posts, 'lastDocId': next_last_doc_id})

@posts_bp.route('/<post_id>/', methods=['DELETE'])
@login_required
def delete_post(post_id):
    try:
        success = PostService.delete_post(post_id, g.uid)
        if success:
            return '', 204
        return jsonify({'error': 'Post not found'}), 404
    except PermissionError:
        return jsonify({'error': 'Unauthorized'}), 403

@posts_bp.route('/<post_id>/comments/', methods=['GET'])
def get_comments(post_id):
    comments = PostService.get_comments(post_id)
    return jsonify(comments)

@posts_bp.route('/<post_id>/comments/', methods=['POST'])
@login_required
def create_comment(post_id):
    data = request.json or {}
    data['authorId'] = g.uid
    data['authorName'] = g.user.get('name', 'Unknown')
    data['authorPhotoURL'] = g.user.get('picture', '')
    
    result = PostService.create_comment(post_id, data)
    return jsonify(result), 201

@posts_bp.route('/<post_id>/like/', methods=['POST'])
@login_required
def like_post(post_id):
    success = PostService.like_post(post_id, g.uid)
    if success:
        return jsonify({'status': 'liked'})
    return jsonify({'status': 'already liked'}), 400

@posts_bp.route('/<post_id>/like/', methods=['DELETE'])
@login_required
def unlike_post(post_id):
    success = PostService.unlike_post(post_id, g.uid)
    if success:
        return jsonify({'status': 'unliked'})
    return jsonify({'status': 'not liked'}), 400
