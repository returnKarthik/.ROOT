from flask import Blueprint, request, jsonify, g
from services.chat import ChatService
from middleware import login_required

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/', methods=['POST'])
@login_required
def create_chat():
    data = request.json
    target_uid = data.get('targetUid')
    if not target_uid:
        return jsonify({'error': 'Target UID required'}), 400
        
    chat = ChatService.create_chat([g.uid, target_uid])
    return jsonify(chat), 201

@chat_bp.route('/', methods=['GET'])
@login_required
def get_chats():
    chats = ChatService.get_user_chats(g.uid)
    return jsonify(chats)

@chat_bp.route('/<chat_id>/messages/', methods=['GET'])
@login_required
def get_messages(chat_id):
    msgs = ChatService.get_messages(chat_id)
    return jsonify(msgs)

@chat_bp.route('/<chat_id>/messages/', methods=['POST'])
@login_required
def send_message(chat_id):
    data = request.json
    text = data.get('text')
    image_url = data.get('imageUrl') # Optional if we support image uploads here later
    
    if not text and not image_url:
        return jsonify({'error': 'Message content required'}), 400
        
    msg = ChatService.send_message(chat_id, g.uid, text, image_url)
    return jsonify(msg), 201

@chat_bp.route('/<chat_id>/read/', methods=['POST'])
@login_required
def mark_read(chat_id):
    # This triggers the deletion of read messages
    count = ChatService.mark_messages_read(chat_id, g.uid)
    return jsonify({'deleted': count})

@chat_bp.route('/<chat_id>/messages/<message_id>/', methods=['DELETE'])
@login_required
def delete_message(chat_id, message_id):
    try:
        ChatService.delete_message(chat_id, message_id, g.uid)
        return jsonify({'status': 'deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 403

@chat_bp.route('/<chat_id>/', methods=['DELETE'])
@login_required
def delete_chat(chat_id):
    ChatService.delete_chat(chat_id, g.uid)
    return jsonify({'status': 'deleted'})
