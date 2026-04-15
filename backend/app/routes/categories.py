from fastapi import APIRouter
from app.schemas.categories import CategoryCreate

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("")
def list_categories():
    return []

@router.post("")
def create_category(payload: CategoryCreate):
    return {
        "ok": True,
        "received": payload
    }
