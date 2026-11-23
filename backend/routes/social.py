from flask import Blueprint, request, jsonify, g
from services.social import SocialService
from middleware import login_required

social_bp = Blueprint('social', __name__)

@social_bp.route('/follow/', methods=['POST'])
@login_required
def follow():
    target_id = request.json.get('targetId')
    if not target_id:
        return jsonify({'error': 'Missing targetId'}), 400
    try:
        SocialService.follow_user(g.uid, target_id)
        return jsonify({'status': 'followed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/unfollow/', methods=['POST'])
@login_required
def unfollow():
    target_id = request.json.get('targetId')
    if not target_id:
        return jsonify({'error': 'Missing targetId'}), 400
    try:
        SocialService.unfollow_user(g.uid, target_id)
        return jsonify({'status': 'unfollowed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/followers/<uid>/', methods=['GET'])
def get_followers(uid):
    followers = SocialService.get_followers(uid)
    return jsonify(followers)

@social_bp.route('/following/<uid>/', methods=['GET'])
def get_following(uid):
    following = SocialService.get_following(uid)
    return jsonify(following)
