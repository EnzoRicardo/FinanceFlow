from fastapi import APIRouter
from app.schemas.transaction import TransactionCreate

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("")
def list_transactions():
    return []

@router.post("")
def create_transaction(payload: TransactionCreate):
    return {
        "ok": True,
        "received": payload
    }
