from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from firebase_admin import auth as firebase_auth
from app.core.firebase import get_db
from datetime import datetime, timezone
from firebase_admin import auth
from firebase_admin import exceptions

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterBody(BaseModel):
    name: str
    email: EmailStr
    password: str

@router.post("/register")
def register(body: RegisterBody, db = Depends(get_db)):
    try:
        user = firebase_auth.create_user(
            email=body.email,
            password=body.password,
            display_name=body.name,
        )

        # opcional: salvar perfil no Firestore
        db.collection("users").document(user.uid).set({
            "name": body.name,
            "email": body.email,
            "createdAt" : datetime.now(timezone.utc).isoformat()
        })

        return {"uid": user.uid}
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="E-mail já registrado.")
    
    except Exception as e:
        if "PASSWORD_TOO_SHORT" in str(e) or "at least 6 characters" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Senha inválida. Deve conter no mínimo 6 caracteres."
            )
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))