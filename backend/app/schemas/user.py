from enum import Enum

from pydantic import BaseModel, field_validator


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class CurrentUser(BaseModel):
    uid: str
    email: str
    name: str | None = None
    role: UserRole


class UserListItem(BaseModel):
    uid: str
    name: str | None = None
    email: str | None = None
    role: UserRole
    createdAt: str | None = None


class UserUpdateBody(BaseModel):
    name: str
    role: UserRole

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Nome é obrigatório.")
        return cleaned


class UserDetailsSummary(BaseModel):
    transactionsCount: int
    accountsCount: int
    categoriesCount: int
    goalsCount: int
    budgetsCount: int


class UserTransactionItem(BaseModel):
    id: str
    type: str
    amount: float
    category: str | None = None
    createdAt: str | None = None


class UserAccountItem(BaseModel):
    id: str
    name: str
    type: str | None = None
    initialBalance: float = 0


class UserGoalItem(BaseModel):
    id: str
    name: str
    targetAmount: float
    currentAmount: float
    deadline: str | None = None


class UserCategoryItem(BaseModel):
    id: str
    name: str
    type: str | None = None


class UserBudgetItem(BaseModel):
    id: str
    category: str
    monthlyLimit: float


class UserDetailsResponse(BaseModel):
    user: UserListItem
    summary: UserDetailsSummary
    transactions: list[UserTransactionItem]
    accounts: list[UserAccountItem]
    goals: list[UserGoalItem]
    categories: list[UserCategoryItem]
    budgets: list[UserBudgetItem]
