import os
import json
from auth_utils import hash_password

def seed_database():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "database.json")
    
    users = {
        "users/user_neeyathi": {
            "uid": "user_neeyathi",
            "email": "neeyathi@root.io",
            "displayName": "Neeyathi",
            "passwordHash": hash_password("password123"),
            "bio": "Catching sunsets and crafting vibes 🌅✨",
            "photoURL": "/static/posts/neeyathi.jpg",
            "followersCount": 128,
            "followingCount": 45,
            "createdAt": "2026-11-20T10:00:00.000000Z"
        },
        "users/user_harihar": {
            "uid": "user_harihar",
            "email": "harihar@root.io",
            "displayName": "Harihar",
            "passwordHash": hash_password("password123"),
            "bio": "Court champion 🏸 Always ready for a match.",
            "photoURL": "/static/posts/harihar.jpg",
            "followersCount": 94,
            "followingCount": 38,
            "createdAt": "2026-11-20T11:00:00.000000Z"
        },
        "users/user_prahan": {
            "uid": "user_prahan",
            "email": "prahan@root.io",
            "displayName": "Prahan",
            "passwordHash": hash_password("password123"),
            "bio": "Post-shower selfie specialist 🤳 Fresh & fabulous.",
            "photoURL": "/static/posts/prahan.jpg",
            "followersCount": 156,
            "followingCount": 62,
            "createdAt": "2026-11-20T12:00:00.000000Z"
        },
        "users/user_saket": {
            "uid": "user_saket",
            "email": "saket@root.io",
            "displayName": "Saket",
            "passwordHash": hash_password("password123"),
            "bio": "Bundled up, tunes on, seeking 4-leaf luck 🍀🎧",
            "photoURL": "/static/posts/saket.jpg",
            "followersCount": 112,
            "followingCount": 50,
            "createdAt": "2026-11-20T13:00:00.000000Z"
        },
        "users/user_ruthwick": {
            "uid": "user_ruthwick",
            "email": "ruthwick@root.io",
            "displayName": "Ruthwick",
            "passwordHash": hash_password("password123"),
            "bio": "Suited, booted, and strictly about business 🤵💼",
            "photoURL": "/static/posts/ruthwick.jpg",
            "followersCount": 204,
            "followingCount": 71,
            "createdAt": "2026-11-20T14:00:00.000000Z"
        }
    }

    posts = {
        "posts/post_neeyathi": {
            "imageUrl": "/static/posts/neeyathi.jpg",
            "caption": "Golden hour in my favorite world. Nothing beats this sunset view 🌅🐱",
            "authorId": "user_neeyathi",
            "authorName": "Neeyathi",
            "authorPhotoURL": "/static/posts/neeyathi.jpg",
            "createdAt": "2026-11-22T19:30:00.000000Z",
            "likesCount": 89,
            "commentsCount": 4
        },
        "posts/post_harihar": {
            "imageUrl": "/static/posts/harihar.jpg",
            "caption": "Match point! Who's stepping onto the court next? 🏸😼",
            "authorId": "user_harihar",
            "authorName": "Harihar",
            "authorPhotoURL": "/static/posts/harihar.jpg",
            "createdAt": "2026-11-22T18:45:00.000000Z",
            "likesCount": 67,
            "commentsCount": 3
        },
        "posts/post_prahan": {
            "imageUrl": "/static/posts/prahan.jpg",
            "caption": "Felt cute, might delete later. Fresh towel fit 🧖‍♂️📱",
            "authorId": "user_prahan",
            "authorName": "Prahan",
            "authorPhotoURL": "/static/posts/prahan.jpg",
            "createdAt": "2026-11-22T17:15:00.000000Z",
            "likesCount": 142,
            "commentsCount": 5
        },
        "posts/post_saket": {
            "imageUrl": "/static/posts/saket.jpg",
            "caption": "Found some good luck today. Sending positive vibes your way 🍀🎧❄️",
            "authorId": "user_saket",
            "authorName": "Saket",
            "authorPhotoURL": "/static/posts/saket.jpg",
            "createdAt": "2026-11-22T15:20:00.000000Z",
            "likesCount": 115,
            "commentsCount": 3
        },
        "posts/post_ruthwick": {
            "imageUrl": "/static/posts/ruthwick.jpg",
            "caption": "Dressed for the occasion. The board meeting can now commence 🤵🐱",
            "authorId": "user_ruthwick",
            "authorName": "Ruthwick",
            "authorPhotoURL": "/static/posts/ruthwick.jpg",
            "createdAt": "2026-11-22T13:00:00.000000Z",
            "likesCount": 178,
            "commentsCount": 6
        }
    }

    comments = {
        "posts/post_neeyathi/comments/c1": {
            "id": "c1",
            "text": "The sunset lighting is unreal! 🌅",
            "authorId": "user_harihar",
            "authorName": "Harihar",
            "createdAt": "2026-11-22T19:35:00.000000Z"
        },
        "posts/post_neeyathi/comments/c2": {
            "id": "c2",
            "text": "The 4-leaf clover brought good fortune today! 🍀",
            "authorId": "user_saket",
            "authorName": "Saket",
            "createdAt": "2026-11-22T19:40:00.000000Z"
        },
        "posts/post_harihar/comments/c3": {
            "id": "c3",
            "text": "Good luck returning my smash! 🏸⚡",
            "authorId": "user_prahan",
            "authorName": "Prahan",
            "createdAt": "2026-11-22T18:50:00.000000Z"
        },
        "posts/post_ruthwick/comments/c4": {
            "id": "c4",
            "text": "Looking sharp as ever, Mr. President 🤵🔥",
            "authorId": "user_neeyathi",
            "authorName": "Neeyathi",
            "createdAt": "2026-11-22T13:15:00.000000Z"
        },
        "posts/post_prahan/comments/c5": {
            "id": "c5",
            "text": "Iconic mirror selfie 🤳😂",
            "authorId": "user_ruthwick",
            "authorName": "Ruthwick",
            "createdAt": "2026-11-22T17:25:00.000000Z"
        }
    }

    social = {
        "followers/user_neeyathi/userFollowers/user_harihar": { "since": "2026-11-21T10:00:00Z" },
        "following/user_harihar/userFollowing/user_neeyathi": { "since": "2026-11-21T10:00:00Z" },
        "followers/user_ruthwick/userFollowers/user_neeyathi": { "since": "2026-11-21T11:00:00Z" },
        "following/user_neeyathi/userFollowing/user_ruthwick": { "since": "2026-11-21T11:00:00Z" },
        "followers/user_prahan/userFollowers/user_saket": { "since": "2026-11-21T12:00:00Z" },
        "following/user_saket/userFollowing/user_prahan": { "since": "2026-11-21T12:00:00Z" }
    }

    db_data = {**users, **posts, **comments, **social}
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(db_data, f, indent=2)

    print(f"✅ database.json seeded with {len(users)} users ({', '.join(u['displayName'] for u in users.values())}) and {len(posts)} posts.")

if __name__ == "__main__":
    seed_database()
