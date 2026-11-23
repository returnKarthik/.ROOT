import os
from db import get_db, get_bucket, SERVER_TIMESTAMP, Increment, ArrayRemove, Query

JWT_SECRET = os.getenv("JWT_SECRET", "grietgo-super-secret-jwt-key-2026")
