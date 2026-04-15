from pydantic import BaseModel
from datetime import date
from typing import Optional, Literal

class CategoryCreate(BaseModel):
    type: Literal["income", "expense"]
    name: str

class CategoryOut(CategoryCreate):
    id: str
