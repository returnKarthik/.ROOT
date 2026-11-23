import time
from db import get_db, get_bucket, SERVER_TIMESTAMP, Increment, Query
from services.notifications import NotificationService

class PostService:
    collection_name = 'posts'

    @staticmethod
    def create_post(data):
        db = get_db()
        if not db: raise Exception("Database unavailable")
        
        # Denormalize author data
        author_id = data.get('authorId')
        if author_id:
            user_ref = db.collection('users').document(author_id)
            user_doc = user_ref.get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                data['authorName'] = user_data.get('displayName', 'Unknown User')
                data['authorPhotoURL'] = user_data.get('photoURL', None)
            else:
                data['authorName'] = 'Unknown User'
        
        data['createdAt'] = SERVER_TIMESTAMP
        data['likesCount'] = 0
        data['commentsCount'] = 0
        
        update_time, post_ref = db.collection(PostService.collection_name).add(data)
        
        response_data = data.copy()
        response_data['id'] = post_ref.id
        response_data['createdAt'] = update_time.isoformat() if hasattr(update_time, 'isoformat') else str(update_time)
        
        return response_data

    @staticmethod
    def upload_image(file):
        bucket = get_bucket()
        blob = bucket.blob(f"posts/{int(time.time())}_{file.filename}")
        blob.upload_from_file(file, content_type=file.content_type)
        blob.make_public()
        return blob.public_url

    @staticmethod
    def get_feed(user_id=None, limit=10, last_doc_id=None):
        db = get_db()
        if not db: return [], None
        
        following_uids = []
        if user_id:
            try:
                following_ref = db.collection('following').document(user_id).collection('userFollowing')
                following_docs = following_ref.stream()
                following_uids = [doc.id for doc in following_docs]
            except Exception as e:
                print(f"Error fetching following list: {e}")
                
        posts_ref = db.collection(PostService.collection_name)
        
        if following_uids:
            feed_uids = following_uids + [user_id]
            feed_uids = feed_uids[:30]
            posts_ref = posts_ref.where('authorId', 'in', feed_uids)
            
        posts_ref = posts_ref.order_by('createdAt', direction=Query.DESCENDING)
        
        if last_doc_id:
            last_doc = db.collection(PostService.collection_name).document(last_doc_id).get()
            if last_doc.exists:
                posts_ref = posts_ref.start_after(last_doc)
                
        posts_ref = posts_ref.limit(limit)
        docs = list(posts_ref.stream())
        
        posts = []
        for doc in docs:
            p_data = doc.to_dict()
            if p_data.get('createdAt') and not isinstance(p_data['createdAt'], str):
                try:
                    p_data['createdAt'] = p_data['createdAt'].isoformat()
                except Exception:
                    pass
            posts.append({**p_data, 'id': doc.id})
            
        next_last_doc_id = docs[-1].id if docs else None
        return posts, next_last_doc_id

    @staticmethod
    def get_user_posts(user_id, limit=12, last_doc_id=None):
        db = get_db()
        if not db: return [], None
        posts_ref = db.collection(PostService.collection_name)\
            .where('authorId', '==', user_id)\
            .order_by('createdAt', direction=Query.DESCENDING)
            
        if last_doc_id:
            last_doc = db.collection(PostService.collection_name).document(last_doc_id).get()
            if last_doc.exists:
                posts_ref = posts_ref.start_after(last_doc)
                
        posts_ref = posts_ref.limit(limit)
        docs = list(posts_ref.stream())
        
        posts = []
        for doc in docs:
            p_data = doc.to_dict()
            if p_data.get('createdAt') and not isinstance(p_data['createdAt'], str):
                try:
                    p_data['createdAt'] = p_data['createdAt'].isoformat()
                except Exception:
                    pass
            posts.append({**p_data, 'id': doc.id})
            
        next_last_doc_id = docs[-1].id if docs else None
        return posts, next_last_doc_id

    @staticmethod
    def delete_post(post_id, user_id):
        db = get_db()
        if not db: return False
        post_ref = db.collection(PostService.collection_name).document(post_id)
        doc = post_ref.get()
        if not doc.exists:
            return False
        
        post_data = doc.to_dict()
        if post_data.get('authorId') != user_id:
            raise PermissionError("Unauthorized")
            
        post_ref.delete()
        return True

    @staticmethod
    def create_comment(post_id, data):
        db = get_db()
        if not db: raise Exception("Database unavailable")
        data['createdAt'] = SERVER_TIMESTAMP
        comments_ref = db.collection(PostService.collection_name).document(post_id).collection('comments')
        update_time, comment_ref = comments_ref.add(data)
        
        post_ref = db.collection(PostService.collection_name).document(post_id)
        post_ref.update({'commentsCount': Increment(1)})
        
        # Notify Post Author
        post_doc = post_ref.get()
        if post_doc.exists:
            author_id = post_doc.to_dict().get('authorId')
            NotificationService.create_notification(
                recipient_id=author_id,
                sender_id=data.get('authorId'),
                type='comment',
                entity_id=post_id,
                text=data.get('text')
            )
        
        response_data = data.copy()
        response_data['id'] = comment_ref.id
        if update_time:
            if hasattr(update_time, 'isoformat'):
                response_data['createdAt'] = update_time.isoformat()
            else:
                response_data['createdAt'] = str(update_time)
        else:
            response_data['createdAt'] = None
            
        return response_data
    
    @staticmethod
    def get_comments(post_id):
        db = get_db()
        if not db: return []
        comments_ref = db.collection(PostService.collection_name).document(post_id).collection('comments')\
            .order_by('createdAt', direction=Query.ASCENDING)
        docs = comments_ref.stream()
        return [{**doc.to_dict(), 'id': doc.id} for doc in docs]

    @staticmethod
    def like_post(post_id, user_id):
        db = get_db()
        if not db: return False
        post_ref = db.collection(PostService.collection_name).document(post_id)
        like_ref = post_ref.collection('likes').document(user_id)
        
        doc = like_ref.get()
        if doc.exists:
            return False 
            
        like_ref.set({'likedAt': SERVER_TIMESTAMP})
        post_ref.update({'likesCount': Increment(1)})

        # Notify Post Author
        post_doc = post_ref.get()
        if post_doc.exists:
            author_id = post_doc.to_dict().get('authorId')
            NotificationService.create_notification(
                recipient_id=author_id,
                sender_id=user_id,
                type='like',
                entity_id=post_id
            )
            
        return True

    @staticmethod
    def unlike_post(post_id, user_id):
        db = get_db()
        if not db: return False
        post_ref = db.collection(PostService.collection_name).document(post_id)
        like_ref = post_ref.collection('likes').document(user_id)
        
        doc = like_ref.get()
        if not doc.exists:
            return False
            
        like_ref.delete()
        post_ref.update({'likesCount': Increment(-1)})
        return True
