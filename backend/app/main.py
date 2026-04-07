from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.core.cors import setup_cors
from app.routes.health import router as health_router
from app.routes.transactions import router as transactions_router
from app.routes.auth import router as auth_router

app = FastAPI(title="FinanceFlow API")

setup_cors(app)

app.include_router(health_router)
app.include_router(transactions_router)
app.include_router(auth_router)


@app.get("/")
def home():
    return {"message": "FinanceFlow API está rodando 🚀"}

