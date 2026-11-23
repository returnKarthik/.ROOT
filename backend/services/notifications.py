from db import get_db, SERVER_TIMESTAMP, Query

class NotificationService:
    collection_name = 'notifications'

    @staticmethod
    def create_notification(recipient_id, sender_id, type, entity_id, text=None):
        if recipient_id == sender_id:
            return None # Don't notify for own actions

        db = get_db()
        
        if type in ['like', 'follow']:
            existing = db.collection(NotificationService.collection_name)\
                .where('recipientId', '==', recipient_id)\
                .where('senderId', '==', sender_id)\
                .where('type', '==', type)\
                .where('entityId', '==', entity_id)\
                .limit(1).stream()
            for _ in existing:
                return None # Already notified

        sender_ref = db.collection('users').document(sender_id)
        sender_doc = sender_ref.get()
        sender_name = "Unknown"
        sender_photo = None
        
        if sender_doc.exists:
            data = sender_doc.to_dict()
            sender_name = data.get('displayName', 'Unknown')
            sender_photo = data.get('photoURL')

        notification_data = {
            'recipientId': recipient_id,
            'senderId': sender_id,
            'senderName': sender_name,
            'senderPhotoURL': sender_photo,
            'type': type,
            'entityId': entity_id,
            'text': text,
            'createdAt': SERVER_TIMESTAMP,
            'read': False
        }
        
        db.collection(NotificationService.collection_name).add(notification_data)
        return True

    @staticmethod
    def get_notifications(user_id, limit=20):
        db = get_db()
        notes_ref = db.collection(NotificationService.collection_name)\
            .where('recipientId', '==', user_id)\
            .order_by('createdAt', direction=Query.DESCENDING)\
            .limit(limit)
            
        docs = notes_ref.stream()
        return [{**doc.to_dict(), 'id': doc.id} for doc in docs]
