from db import get_db, SERVER_TIMESTAMP, ArrayRemove, Query

class ChatService:
    collection_name = 'chats'

    @staticmethod
    def create_chat(user_ids):
        db = get_db()
        user_ids.sort()
        
        existing_query = db.collection(ChatService.collection_name)\
            .where('userIds', '==', user_ids)\
            .limit(1).stream()
            
        for doc in existing_query:
            return {**doc.to_dict(), 'id': doc.id}

        data = {
            'userIds': user_ids,
            'createdAt': SERVER_TIMESTAMP,
            'lastMessage': None,
            'lastMessageTime': None
        }
        update_time, ref = db.collection(ChatService.collection_name).add(data)
        
        return {**data, 'id': ref.id, 'createdAt': update_time.isoformat() if hasattr(update_time, 'isoformat') else str(update_time)}

    @staticmethod
    def get_user_chats(uid):
        db = get_db()
        chats_ref = db.collection(ChatService.collection_name)\
            .where('userIds', 'array_contains', uid)\
            .order_by('lastMessageTime', direction=Query.DESCENDING)
            
        docs = chats_ref.stream()
        chats = []
        for doc in docs:
            chat_data = doc.to_dict()
            if chat_data.get('lastMessageTime'):
                 other_uid = next((id for id in chat_data['userIds'] if id != uid), None)
                 if other_uid:
                     user_doc = db.collection('users').document(other_uid).get()
                     if user_doc.exists:
                         chat_data['otherUser'] = user_doc.to_dict()
            chats.append({**chat_data, 'id': doc.id})
            
        return chats

    @staticmethod
    def get_messages(chat_id):
        db = get_db()
        if not db: return []
        messages_ref = db.collection(ChatService.collection_name).document(chat_id).collection('messages')\
            .order_by('createdAt', direction=Query.ASCENDING)
        docs = messages_ref.stream()
        
        messages = []
        for doc in docs:
            m_data = doc.to_dict()
            if m_data.get('createdAt') and not isinstance(m_data['createdAt'], str):
                try:
                    m_data['createdAt'] = m_data['createdAt'].isoformat()
                except Exception:
                    pass
            messages.append({**m_data, 'id': doc.id})
        return messages

    @staticmethod
    def send_message(chat_id, sender_id, text, image_url=None):
        db = get_db()
        chat_ref = db.collection(ChatService.collection_name).document(chat_id)
        
        message_data = {
            'senderId': sender_id,
            'text': text,
            'imageUrl': image_url,
            'createdAt': SERVER_TIMESTAMP,
            'read': False,
            'expiresAt': None
        }
        
        msg_ref = chat_ref.collection('messages').add(message_data)[1]
        
        chat_ref.update({
            'lastMessage': 'Sent a photo' if image_url else text,
            'lastMessageTime': SERVER_TIMESTAMP
        })
        
        response_data = message_data.copy()
        import datetime
        response_data['createdAt'] = datetime.datetime.now().isoformat()
        response_data['id'] = msg_ref.id
        
        return response_data

    @staticmethod
    def mark_messages_read(chat_id, user_id):
        # Ephemeral logic: delete messages sent by other user upon read
        db = get_db()
        messages_ref = db.collection(ChatService.collection_name).document(chat_id).collection('messages')
        
        query = messages_ref.where('read', '==', False).where('senderId', '!=', user_id)
        docs = query.stream()
        
        batch = db.batch()
        count = 0
        for doc in docs:
            batch.delete(doc.reference if hasattr(doc, 'reference') else messages_ref.document(doc.id))
            count += 1
            
        if count > 0:
            batch.commit()
            
        return count

    @staticmethod
    def delete_message(chat_id, message_id, user_id):
        db = get_db()
        msg_ref = db.collection(ChatService.collection_name).document(chat_id).collection('messages').document(message_id)
        msg = msg_ref.get()
        
        if not msg.exists:
            return False
            
        if msg.to_dict().get('senderId') != user_id:
            raise Exception("Unauthorized")
            
        msg_ref.delete()
        return True

    @staticmethod
    def delete_chat(chat_id, user_id):
        db = get_db()
        chat_ref = db.collection(ChatService.collection_name).document(chat_id)
        chat_ref.update({
            'userIds': ArrayRemove([user_id])
        })
        return True
