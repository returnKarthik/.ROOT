import os
import sys
import json
import io

# Add backend directory to path
sys.path.append(os.path.dirname(__file__))

from app import app
from db import save_db, load_db

def run_api_validation():
    print("🚀 Starting .ROOT Backend JWT REST API Validation Tests")
    print("=" * 60)
    
    # Backup existing database before test run
    backup_db = load_db()
    save_db({})
    
    client = app.test_client()
    passed_tests = 0
    failed_tests = 0

    def assert_status(response, expected_status, test_name):
        nonlocal passed_tests, failed_tests
        if response.status_code == expected_status:
            print(f"✅ PASSED: {test_name} (Status {response.status_code})")
            passed_tests += 1
            return True
        else:
            print(f"❌ FAILED: {test_name} - Expected {expected_status}, got {response.status_code}")
            print(f"   Response body: {response.data.decode('utf-8', errors='ignore')}")
            failed_tests += 1
            return False

    # Test 1: Public Feed Read (Empty DB)
    res = client.get('/api/posts/')
    if assert_status(res, 200, "GET /api/posts/ (Public Feed)"):
        data = json.loads(res.data)
        assert "posts" in data, "Response should contain posts key"
        assert "lastDocId" in data, "Response should contain lastDocId key"
        assert len(data["posts"]) == 0, "Initial posts should be empty"

    # Test 2: User Registration (Alice)
    res = client.post('/api/auth/register', json={
        "displayName": "Alice",
        "email": "alice@test.com",
        "password": "password123"
    })
    token_1 = None
    uid_1 = None
    if assert_status(res, 201, "POST /api/auth/register (Alice Registration)"):
        data = json.loads(res.data)
        assert "token" in data, "Must return JWT token"
        assert "user" in data, "Must return user profile"
        token_1 = data["token"]
        uid_1 = data["user"]["uid"]

    # Test 3: User Registration (Bob)
    res = client.post('/api/auth/register', json={
        "displayName": "Bob",
        "email": "bob@test.com",
        "password": "password456"
    })
    token_2 = None
    uid_2 = None
    if assert_status(res, 201, "POST /api/auth/register (Bob Registration)"):
        data = json.loads(res.data)
        token_2 = data["token"]
        uid_2 = data["user"]["uid"]

    # Test 4: Duplicate Email Registration (Expected 400)
    res = client.post('/api/auth/register', json={
        "displayName": "Alice Duplicate",
        "email": "alice@test.com",
        "password": "password123"
    })
    assert_status(res, 400, "POST /api/auth/register with duplicate email (Expected 400)")

    # Test 5: Login with Wrong Password (Expected 401)
    res = client.post('/api/auth/login', json={
        "email": "alice@test.com",
        "password": "wrongpassword"
    })
    assert_status(res, 401, "POST /api/auth/login with wrong password (Expected 401)")

    # Test 6: Login with Correct Password (Expected 200)
    res = client.post('/api/auth/login', json={
        "email": "alice@test.com",
        "password": "password123"
    })
    if assert_status(res, 200, "POST /api/auth/login with valid credentials (Expected 200)"):
        data = json.loads(res.data)
        assert "token" in data, "Must return valid JWT"
        token_1 = data["token"] # Refresh Alice's token

    headers_1 = {"Authorization": f"Bearer {token_1}"}
    headers_2 = {"Authorization": f"Bearer {token_2}"}

    # Test 7: Verify /api/auth/me with JWT token
    res = client.get('/api/auth/me', headers=headers_1)
    if assert_status(res, 200, "GET /api/auth/me (Alice profile via JWT)"):
        data = json.loads(res.data)
        assert data["email"] == "alice@test.com"

    # Test 8: Unauthorized post creation without JWT token (Expected 401)
    res = client.post('/api/posts/', data={
        "caption": "Unauthorized Post"
    })
    assert_status(res, 401, "POST /api/posts/ without Auth Token (Expected 401)")

    # Test 9: Create Posts for Alice
    for i in range(5):
        img_data = (io.BytesIO(b"fake image data"), f"alice_post_{i}.png")
        res = client.post('/api/posts/', headers=headers_1, data={
            "image": img_data,
            "caption": f"Alice Post {i}"
        })
        assert_status(res, 201, f"POST /api/posts/ Alice Post {i}")

    # Test 10: Feed Pagination (Limit = 2)
    res = client.get('/api/posts/?limit=2')
    if assert_status(res, 200, "GET /api/posts/?limit=2"):
        data = json.loads(res.data)
        assert len(data["posts"]) == 2, "Should return exactly 2 posts"
        assert data["lastDocId"] is not None, "Should have pagination cursor"
        
        last_doc_id = data["lastDocId"]
        
        # Test 11: Feed Pagination Page 2
        res2 = client.get(f'/api/posts/?limit=2&lastDocId={last_doc_id}')
        if assert_status(res2, 200, "GET /api/posts/?limit=2&lastDocId=... (Page 2)"):
            data2 = json.loads(res2.data)
            assert len(data2["posts"]) == 2, "Page 2 should return 2 posts"
            assert data2["posts"][0]["id"] != data["posts"][0]["id"], "Should be distinct posts"

    # Test 12: Create Post for Bob
    img_data = (io.BytesIO(b"fake image data"), "bob_post_1.png")
    res = client.post('/api/posts/', headers=headers_2, data={
        "image": img_data,
        "caption": "Bob Post 1"
    })
    assert_status(res, 201, "POST /api/posts/ Bob Post 1")

    # Test 13: Follow Workflow (Bob follows Alice)
    res = client.post('/api/social/follow/', headers=headers_2, json={
        "targetId": uid_1
    })
    assert_status(res, 200, "POST /api/social/follow/ (Bob follows Alice)")

    # Test 14: Personalized Feed (Bob is logged in)
    res = client.get('/api/posts/', headers=headers_2)
    if assert_status(res, 200, "GET /api/posts/ (Bob's Personalized Feed)"):
        data = json.loads(res.data)
        authors = [p["authorName"] for p in data["posts"]]
        assert "Alice" in authors, "Bob's personalized feed should contain Alice's posts"
        assert "Bob" in authors, "Bob's personalized feed should contain his own posts"

    # Test 15: Error Handling: Missing targetId in follow
    res = client.post('/api/social/follow/', headers=headers_2, json={})
    assert_status(res, 400, "POST /api/social/follow/ with missing targetId (Expected 400)")

    # Restore original seeded database
    if backup_db:
        save_db(backup_db)

    print("=" * 60)
    print(f"📊 Validation Summary: Passed {passed_tests}, Failed {failed_tests}")
    
    if failed_tests > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_api_validation()
