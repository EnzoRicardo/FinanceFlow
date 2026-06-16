from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth as firebase_auth

from app.core.auth import require_admin, resolve_user_role
from app.core.firebase import get_db
from app.schemas.user import (
    CurrentUser,
    UserAccountItem,
    UserBudgetItem,
    UserCategoryItem,
    UserDetailsResponse,
    UserDetailsSummary,
    UserGoalItem,
    UserListItem,
    UserRole,
    UserTransactionItem,
    UserUpdateBody,
)

router = APIRouter(prefix="/users", tags=["users"])


def _serialize_date(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if hasattr(value, "timestamp"):
        return datetime.fromtimestamp(value.timestamp()).isoformat()
    return str(value)


def _build_user_list_item(doc_id: str, data: dict) -> UserListItem:
    email = data.get("email", "")
    role = resolve_user_role(email, data.get("role"))

    return UserListItem(
        uid=doc_id,
        name=data.get("name"),
        email=email or None,
        role=role,
        createdAt=data.get("createdAt"),
    )


def _get_user_doc(db, uid: str):
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return doc_ref, doc


def _query_user_collection(db, collection_name: str, uid: str) -> list:
    query = db.collection(collection_name).where("userId", "==", uid)
    return list(query.stream())


def _build_user_details(db, uid: str) -> UserDetailsResponse:
    _, doc = _get_user_doc(db, uid)
    user_data = doc.to_dict() or {}
    user = _build_user_list_item(uid, user_data)

    transaction_docs = _query_user_collection(db, "transactions", uid)
    account_docs = _query_user_collection(db, "accounts", uid)
    category_docs = _query_user_collection(db, "categories", uid)
    goal_docs = _query_user_collection(db, "goals", uid)
    budget_docs = _query_user_collection(db, "budgets", uid)

    transactions = []
    for item in transaction_docs:
        data = item.to_dict() or {}
        transactions.append(
            UserTransactionItem(
                id=item.id,
                type="income" if data.get("type") == "income" else "expense",
                amount=float(data.get("amount") or 0),
                category=data.get("category"),
                createdAt=_serialize_date(data.get("createdAt")),
            )
        )
    transactions.sort(key=lambda entry: entry.createdAt or "", reverse=True)

    accounts = []
    for item in account_docs:
        data = item.to_dict() or {}
        accounts.append(
            UserAccountItem(
                id=item.id,
                name=str(data.get("name") or "").strip() or "Sem nome",
                type=data.get("type"),
                initialBalance=float(data.get("initialBalance") or 0),
            )
        )
    accounts.sort(key=lambda entry: entry.name.lower())

    categories = []
    for item in category_docs:
        data = item.to_dict() or {}
        categories.append(
            UserCategoryItem(
                id=item.id,
                name=str(data.get("name") or "").strip() or "Sem nome",
                type=data.get("type"),
            )
        )
    categories.sort(key=lambda entry: entry.name.lower())

    goals = []
    for item in goal_docs:
        data = item.to_dict() or {}
        goals.append(
            UserGoalItem(
                id=item.id,
                name=str(data.get("name") or "").strip() or "Sem nome",
                targetAmount=float(data.get("targetAmount") or 0),
                currentAmount=float(data.get("currentAmount") or 0),
                deadline=_serialize_date(data.get("deadline")),
            )
        )
    goals.sort(key=lambda entry: entry.name.lower())

    budgets = []
    for item in budget_docs:
        data = item.to_dict() or {}
        budgets.append(
            UserBudgetItem(
                id=item.id,
                category=str(data.get("category") or "").strip() or "Sem categoria",
                monthlyLimit=float(data.get("monthlyLimit") or 0),
            )
        )
    budgets.sort(key=lambda entry: entry.category.lower())

    return UserDetailsResponse(
        user=user,
        summary=UserDetailsSummary(
            transactionsCount=len(transaction_docs),
            accountsCount=len(account_docs),
            categoriesCount=len(category_docs),
            goalsCount=len(goal_docs),
            budgetsCount=len(budget_docs),
        ),
        transactions=transactions,
        accounts=accounts,
        goals=goals,
        categories=categories,
        budgets=budgets,
    )


@router.get("", response_model=list[UserListItem])
def list_users(
    _: CurrentUser = Depends(require_admin),
    db=Depends(get_db),
):
    users = [
        _build_user_list_item(doc.id, doc.to_dict() or {})
        for doc in db.collection("users").stream()
    ]

    users.sort(key=lambda user: user.createdAt or "", reverse=True)
    return users


@router.get("/{uid}/details", response_model=UserDetailsResponse)
def get_user_details(
    uid: str,
    _: CurrentUser = Depends(require_admin),
    db=Depends(get_db),
):
    return _build_user_details(db, uid)


@router.patch("/{uid}", response_model=UserListItem)
def update_user(
    uid: str,
    body: UserUpdateBody,
    admin: CurrentUser = Depends(require_admin),
    db=Depends(get_db),
):
    if admin.uid == uid and body.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Você não pode remover seu próprio perfil de administrador.",
        )

    doc_ref, doc = _get_user_doc(db, uid)
    data = doc.to_dict() or {}

    doc_ref.update({
        "name": body.name,
        "role": body.role.value,
    })

    try:
        firebase_auth.update_user(uid, display_name=body.name)
    except firebase_auth.UserNotFoundError:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    updated_data = {**data, "name": body.name, "role": body.role.value}
    return _build_user_list_item(uid, updated_data)


@router.delete("/{uid}")
def delete_user(
    uid: str,
    admin: CurrentUser = Depends(require_admin),
    db=Depends(get_db),
):
    if admin.uid == uid:
        raise HTTPException(
            status_code=400,
            detail="Você não pode excluir sua própria conta.",
        )

    doc_ref, _ = _get_user_doc(db, uid)
    doc_ref.delete()

    try:
        firebase_auth.delete_user(uid)
    except firebase_auth.UserNotFoundError:
        pass

    return {"ok": True}
