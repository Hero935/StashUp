import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.schemas.schemas import UserCreate, UserBase, Token
from app.crud.crud import get_user_by_username, create_user
from app.core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
import datetime

router = APIRouter()

@router.post("/register", response_model=UserBase)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    註冊新使用者。
    """
    logging.info(f"嘗試註冊使用者: {user.username}")
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        logging.warning(f"使用者名稱 {user.username} 已存在。")
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = create_user(db=db, user=user)
    logging.info(f"使用者 {user.username} 註冊成功，ID: {db_user.id}")
    return db_user

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    使用者登入並獲取 JWT Token。
    """
    user = get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
