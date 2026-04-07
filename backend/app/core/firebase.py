import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
import os

_db = None

def get_db():
    global _db
    if _db is not None:
        return _db

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    if not cred_path:
        raise RuntimeError("FIREBASE_CREDENTIALS_PATH não definido")

    full_path = Path(cred_path).resolve()

    if not full_path.exists():
        raise RuntimeError(f"Arquivo não encontrado: {full_path}")

    if not firebase_admin._apps:
        cred = credentials.Certificate(str(full_path))
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db
