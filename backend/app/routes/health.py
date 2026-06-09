from fastapi import APIRouter, Depends
from app.core.firebase import get_db

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    return {"status": "ok", "service": "FinanceFlow API"}

@router.get("/firestore-test")
def firestore_test(db=Depends(get_db)):
    db.collection("test_connection").add({
        "message": "FinanceFlow conectado"
    })
    return {"ok": True}
