from flask import Blueprint, jsonify, g
from services.notifications import NotificationService
from middleware import login_required

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@login_required
def get_notifications():
    # In a real app, we might mark them as read here or via a separate endpoint
    notes = NotificationService.get_notifications(g.uid)
    return jsonify(notes)
