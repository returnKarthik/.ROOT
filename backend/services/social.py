from db import get_db, SERVER_TIMESTAMP, Increment

class SocialService:
    @staticmethod
    def follow_user(follower_id, target_id):
        db = get_db()
        if not db: raise Exception("Database unavailable")
        
        # Using batch for atomicity
        batch = db.batch()
        
        target_follower_ref = db.collection('followers').document(target_id).collection('userFollowers').document(follower_id)
        follower_following_ref = db.collection('following').document(follower_id).collection('userFollowing').document(target_id)
        
        batch.set(target_follower_ref, {'since': SERVER_TIMESTAMP})
        batch.set(follower_following_ref, {'since': SERVER_TIMESTAMP})
        
        user_target_ref = db.collection('users').document(target_id)
        user_follower_ref = db.collection('users').document(follower_id)
        
        batch.update(user_target_ref, {'followersCount': Increment(1)})
        batch.update(user_follower_ref, {'followingCount': Increment(1)})
        
        batch.commit()
        
        # Notify Target User
        from services.notifications import NotificationService
        NotificationService.create_notification(
            recipient_id=target_id,
            sender_id=follower_id,
            type='follow',
            entity_id=follower_id
        )
        
        return True

    @staticmethod
    def unfollow_user(follower_id, target_id):
        db = get_db()
        if not db: raise Exception("Database unavailable")
        batch = db.batch()
        
        target_follower_ref = db.collection('followers').document(target_id).collection('userFollowers').document(follower_id)
        follower_following_ref = db.collection('following').document(follower_id).collection('userFollowing').document(target_id)
        
        batch.delete(target_follower_ref)
        batch.delete(follower_following_ref)
        
        user_target_ref = db.collection('users').document(target_id)
        user_follower_ref = db.collection('users').document(follower_id)
        
        batch.update(user_target_ref, {'followersCount': Increment(-1)})
        batch.update(user_follower_ref, {'followingCount': Increment(-1)})
        
        batch.commit()
        return True

    @staticmethod
    def get_followers(user_id):
        db = get_db()
        if not db: return []
        docs = db.collection('followers').document(user_id).collection('userFollowers').stream()
        return [doc.to_dict() for doc in docs]

    @staticmethod
    def get_following(user_id):
        db = get_db()
        if not db: return []
        docs = db.collection('following').document(user_id).collection('userFollowing').stream()
        return [{**doc.to_dict(), 'id': doc.id} for doc in docs]
