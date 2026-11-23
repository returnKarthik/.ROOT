from db import get_db

class UserService:
    collection_name = 'users'

    @staticmethod
    def create_user(uid, data):
        db = get_db()
        if not db: return None
        user_ref = db.collection(UserService.collection_name).document(uid)
        user_ref.set(data, merge=True)
        return user_ref.get().to_dict()

    @staticmethod
    def get_user(uid):
        db = get_db()
        if not db: return None
        user_ref = db.collection(UserService.collection_name).document(uid)
        doc = user_ref.get()
        if doc.exists:
            data = doc.to_dict()
            data.pop('passwordHash', None) # Never leak password hash
            return data
        return None

    @staticmethod
    def update_user(uid, data):
        db = get_db()
        if not db: return None
        user_ref = db.collection(UserService.collection_name).document(uid)
        user_ref.update(data)
        updated = user_ref.get().to_dict()
        if updated:
            updated.pop('passwordHash', None)
        return updated

    @staticmethod
    def search_users(query_text):
        db = get_db()
        if not db: return []
        users_ref = db.collection(UserService.collection_name)
        end_text = query_text + '\uf8ff'
        
        results = users_ref.where('displayName', '>=', query_text)\
                           .where('displayName', '<=', end_text)\
                           .stream()
                           
        out = []
        for doc in results:
            d = doc.to_dict()
            d.pop('passwordHash', None)
            out.append({**d, 'uid': doc.id})
        return out
