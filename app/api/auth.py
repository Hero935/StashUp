import logging
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from app.models.database import get_db
from app.models.models import User, Transaction, Category
from app.schemas.schemas import UserCreate, UserBase, Token, UserDataExport, UserDataImport, TransactionModel, CategoryModel
from app.crud.crud import get_user_by_username, create_user, create_user_transaction, create_user_category
from app.core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.dependencies import get_current_user
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

@router.delete("/delete-account")
def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    刪除當前使用者的帳號及所有相關資料。
    """
    try:
        user_id = current_user.id
        
        # 刪除使用者的所有交易紀錄
        db.query(Transaction).filter(Transaction.user_id == user_id).delete()
        
        # 刪除使用者的所有自訂分類
        db.query(Category).filter(Category.user_id == user_id).delete()
        
        # 刪除使用者帳號
        db.delete(current_user)
        db.commit()
        
        logging.info(f"使用者 {current_user.username} 的帳號及所有相關資料已成功刪除")
        return {"message": "帳號及所有相關資料已成功刪除"}
        
    except Exception as e:
        db.rollback()
        logging.error(f"刪除使用者帳號時發生錯誤: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="刪除帳號時發生錯誤，請稍後再試"
        )

@router.get("/export-data", response_model=UserDataExport)
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    匯出當前使用者的所有資料（交易紀錄和自訂分類）。
    """
    try:
        user_id = current_user.id
        
        # 獲取使用者的所有交易紀錄
        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        
        # 獲取使用者的所有自訂分類
        custom_categories = db.query(Category).filter(Category.user_id == user_id).all()
        
        # 格式化資料
        user_data = UserDataExport(
            username=current_user.username,
            transactions=[TransactionModel.model_validate(t) for t in transactions],
            custom_categories=[CategoryModel.model_validate(c) for c in custom_categories]
        )
        
        logging.info(f"使用者 {current_user.username} 的資料已成功匯出")
        return user_data
        
    except Exception as e:
        logging.error(f"匯出使用者資料時發生錯誤: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="匯出資料時發生錯誤，請稍後再試"
        )

@router.post("/import-data")
def import_user_data(
    user_data: UserDataImport,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    匯入使用者資料（交易紀錄和自訂分類）。
    """
    try:
        user_id = current_user.id
        imported_count = {"transactions": 0, "categories": 0}
        
        # 匯入自訂分類
        for category_data in user_data.custom_categories:
            existing_category = db.query(Category).filter(
                Category.user_id == user_id,
                Category.name == category_data.name,
                Category.type == category_data.type
            ).first()
            
            if not existing_category:
                new_category = Category(
                    name=category_data.name,
                    type=category_data.type,
                    user_id=user_id
                )
                db.add(new_category)
                imported_count["categories"] += 1
        
        # 匯入交易紀錄
        for transaction_data in user_data.transactions:
            new_transaction = Transaction(
                type=transaction_data.type,
                description=transaction_data.description,
                amount=transaction_data.amount,
                category=transaction_data.category,
                date=transaction_data.date,
                user_id=user_id
            )
            db.add(new_transaction)
            imported_count["transactions"] += 1
        
        db.commit()
        
        logging.info(f"使用者 {current_user.username} 成功匯入資料: {imported_count}")
        return {
            "message": "資料匯入成功",
            "imported_transactions": imported_count["transactions"],
            "imported_categories": imported_count["categories"]
        }
        
    except Exception as e:
        db.rollback()
        logging.error(f"匯入使用者資料時發生錯誤: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"匯入資料時發生錯誤: {str(e)}"
        )
