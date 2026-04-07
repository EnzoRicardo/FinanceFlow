from pydantic import BaseModel
from datetime import date
from typing import Optional, Literal

class TransactionCreate(BaseModel):
    type: Literal["income", "expense"]
    amount: float
    date: date
    category: str
    description: Optional[str] = None

class TransactionOut(TransactionCreate):
    id: str
