import os

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from .auth import authenticate_user, create_access_token, get_current_user
from .hr_data import get_hr_data
from . import settings as settings_router
from . import review as review_router
from . import employees as employees_router
from . import payroll as payroll_router
from . import upload as upload_router
from . import payslip as payslip_router

app = FastAPI(title="HR Analytics API")

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins.split(",")] if allowed_origins != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settings_router.router)
app.include_router(review_router.router)
app.include_router(employees_router.router)
app.include_router(payroll_router.router)
app.include_router(upload_router.router)
app.include_router(payslip_router.router)


class UserOut(BaseModel):
    username: str
    full_name: str | None = None
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login", response_model=LoginResponse)
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
        )
    token = create_access_token({"sub": user["username"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"username": user["username"], "full_name": user["full_name"], "role": user["role"]},
    }


@app.get("/auth/me", response_model=UserOut)
def me(current_user: dict = Depends(get_current_user)):
    return {"username": current_user["username"], "full_name": current_user["full_name"], "role": current_user["role"]}


@app.get("/api/hr-data")
def hr_data(current_user: dict = Depends(get_current_user)):
    return get_hr_data()
