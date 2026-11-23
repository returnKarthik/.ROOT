import os
import json
import time
import uuid
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), "database.json")

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_db(db):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving database: {e}")

class Increment:
    def __init__(self, value):
        self.value = value

class ArrayRemove:
    def __init__(self, elements):
        self.elements = elements

class SERVER_TIMESTAMP_CLASS:
    pass

SERVER_TIMESTAMP = SERVER_TIMESTAMP_CLASS()

def resolve_val(val, current_val):
    val_type_str = str(type(val))
    if isinstance(val, Increment):
        if current_val is None:
            return val.value
        return (current_val or 0) + val.value
    if isinstance(val, ArrayRemove):
        if not isinstance(current_val, list):
            return []
        return [x for x in current_val if x not in val.elements]
    if isinstance(val, SERVER_TIMESTAMP_CLASS) or "Sentinel" in val_type_str or "transforms" in val_type_str or "REQUEST_TIME" in str(val):
        return datetime.utcnow().isoformat() + "Z"
    return val

class Query:
    ASCENDING = "ASCENDING"
    DESCENDING = "DESCENDING"

class DocumentSnapshot:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return self._data.copy() if self._data else None

class DocumentReference:
    def __init__(self, path):
        self.path = path
        self.id = path.split("/")[-1]

    def get(self):
        db = load_db()
        data = db.get(self.path)
        return DocumentSnapshot(self.id, data)

    def set(self, data, merge=False):
        db = load_db()
        existing = db.get(self.path, {})
        new_data = {}
        if merge and existing:
            new_data.update(existing)
        
        for k, v in data.items():
            new_data[k] = resolve_val(v, existing.get(k))

        db[self.path] = new_data
        save_db(db)
        return datetime.utcnow(), self

    def update(self, data):
        db = load_db()
        existing = db.get(self.path)
        if existing is None:
            raise Exception(f"Document {self.path} does not exist for update")
        
        for k, v in data.items():
            existing[k] = resolve_val(v, existing.get(k))

        db[self.path] = existing
        save_db(db)
        return datetime.utcnow()

    def delete(self):
        db = load_db()
        if self.path in db:
            del db[self.path]
            for k in list(db.keys()):
                if k.startswith(self.path + "/"):
                    del db[k]
            save_db(db)
        return datetime.utcnow()

    def collection(self, collection_name):
        return CollectionReference(self.path + "/" + collection_name)

class CollectionQuery:
    def __init__(self, collection_path, filters=None, order_by_field=None, order_direction="ASCENDING", limit_val=None, start_after_doc=None):
        self.collection_path = collection_path
        self.filters = filters or []
        self.order_by_field = order_by_field
        self.order_direction = order_direction
        self.limit_val = limit_val
        self.start_after_doc = start_after_doc

    def where(self, field, op, val):
        new_filters = self.filters + [(field, op, val)]
        return CollectionQuery(self.collection_path, new_filters, self.order_by_field, self.order_direction, self.limit_val, self.start_after_doc)

    def order_by(self, field, direction="ASCENDING"):
        dir_str = "DESCENDING" if "DESC" in str(direction).upper() else "ASCENDING"
        return CollectionQuery(self.collection_path, self.filters, field, dir_str, self.limit_val, self.start_after_doc)

    def limit(self, limit_val):
        return CollectionQuery(self.collection_path, self.filters, self.order_by_field, self.order_direction, limit_val, self.start_after_doc)

    def start_after(self, doc_snapshot):
        return CollectionQuery(self.collection_path, self.filters, self.order_by_field, self.order_direction, self.limit_val, doc_snapshot)

    def stream(self):
        db = load_db()
        results = []
        prefix = self.collection_path + "/"
        prefix_len = len(prefix)
        
        for path, data in db.items():
            if path.startswith(prefix):
                subpath = path[prefix_len:]
                if "/" not in subpath:
                    results.append((path.split("/")[-1], data, path))

        # Apply filters
        filtered_results = []
        for doc_id, data, path in results:
            match = True
            for field, op, val in self.filters:
                item_val = data.get(field)
                if op == "==":
                    if item_val != val: match = False
                elif op == ">=":
                    if item_val is None or item_val < val: match = False
                elif op == "<=":
                    if item_val is None or item_val > val: match = False
                elif op == "array_contains":
                    if not isinstance(item_val, list) or val not in item_val: match = False
                elif op == "in":
                    if item_val not in val: match = False
            if match:
                filtered_results.append((doc_id, data, path))

        # Apply Order By
        if self.order_by_field:
            def sort_key(item):
                val = item[1].get(self.order_by_field)
                return (val is not None, val)
            
            reverse = (self.order_direction == "DESCENDING")
            filtered_results.sort(key=sort_key, reverse=reverse)

        # Apply Start After cursor
        if self.start_after_doc:
            cursor_id = self.start_after_doc.id
            found_idx = -1
            for idx, (doc_id, data, path) in enumerate(filtered_results):
                if doc_id == cursor_id:
                    found_idx = idx
                    break
            if found_idx != -1:
                filtered_results = filtered_results[found_idx + 1:]

        # Apply Limit
        if self.limit_val:
            filtered_results = filtered_results[:self.limit_val]

        return [DocumentSnapshot(doc_id, data) for doc_id, data, path in filtered_results]

class CollectionReference(CollectionQuery):
    def __init__(self, collection_path):
        super().__init__(collection_path)

    def document(self, doc_id=None):
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return DocumentReference(self.collection_path + "/" + doc_id)

    def add(self, data):
        doc_id = str(uuid.uuid4())
        doc_ref = self.document(doc_id)
        update_time, _ = doc_ref.set(data)
        return update_time, doc_ref

class Batch:
    def __init__(self):
        self.operations = []

    def set(self, doc_ref, data, merge=False):
        self.operations.append(("set", doc_ref, data, merge))

    def update(self, doc_ref, data):
        self.operations.append(("update", doc_ref, data, None))

    def delete(self, doc_ref):
        self.operations.append(("delete", doc_ref, None, None))

    def commit(self):
        db = load_db()
        for op_type, doc_ref, data, merge in self.operations:
            existing = db.get(doc_ref.path, {})
            if op_type == "set":
                new_data = {}
                if merge and existing:
                    new_data.update(existing)
                for k, v in data.items():
                    new_data[k] = resolve_val(v, existing.get(k))
                db[doc_ref.path] = new_data
            elif op_type == "update":
                existing = db.get(doc_ref.path)
                if existing is None:
                    raise Exception(f"Document {doc_ref.path} does not exist for batch update")
                for k, v in data.items():
                    existing[k] = resolve_val(v, existing.get(k))
                db[doc_ref.path] = existing
            elif op_type == "delete":
                if doc_ref.path in db:
                    del db[doc_ref.path]
                for k in list(db.keys()):
                    if k.startswith(doc_ref.path + "/"):
                        del db[k]
        save_db(db)
        return datetime.utcnow()

class DatabaseClient:
    def collection(self, collection_path):
        return CollectionReference(collection_path)

    def batch(self):
        return Batch()

_client = None

def get_db():
    global _client
    if _client is None:
        _client = DatabaseClient()
    return _client

class StorageBlob:
    def __init__(self, filename):
        self.filename = filename
        self.public_url = f"/static/{filename}"

    def upload_from_file(self, file_obj, content_type=None):
        static_dir = os.path.join(os.path.dirname(__file__), "static")
        out_path = os.path.join(static_dir, self.filename)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "wb") as f:
            f.write(file_obj.read())

    def make_public(self):
        pass

class StorageBucket:
    name = "local-storage"
    def blob(self, blob_name):
        return StorageBlob(blob_name)

def get_bucket():
    return StorageBucket()
