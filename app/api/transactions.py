from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Response
from sqlalchemy.orm import Session
import io

from app.models.database import get_db
from app.models.models import User
from app.schemas.schemas import TransactionCreate, TransactionModel
from app.crud.crud import (
    get_transactions, create_user_transaction, update_user_transaction, 
    delete_user_transaction, import_transactions_from_csv, export_transactions_to_csv
)
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/transactions", response_model=List[TransactionModel])
def read_transactions(skip: int = 0, limit: int = 100, query: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    讀取交易紀錄，支援分頁和關鍵字查詢。
    """
    transactions = get_transactions(db, user_id=current_user.id, skip=skip, limit=limit, query=query)
    return transactions

@router.post("/transactions", response_model=TransactionModel)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    建立新的交易紀錄。
    """
    return create_user_transaction(db=db, transaction=transaction, user_id=current_user.id)

@router.put("/transactions/{transaction_id}", response_model=TransactionModel)
def update_transaction(transaction_id: int, transaction: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    更新交易紀錄。
    """
    db_transaction = update_user_transaction(db=db, transaction_id=transaction_id, transaction=transaction, user_id=current_user.id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found or you don't have permission to edit it")
    return db_transaction

@router.delete("/transactions/{transaction_id}", response_model=TransactionModel)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    刪除交易紀錄。
    """
    db_transaction = delete_user_transaction(db=db, transaction_id=transaction_id, user_id=current_user.id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found or you don't have permission to delete it")
    return db_transaction

@router.post("/transactions/import")
async def import_transactions(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    從 CSV 檔案匯入交易紀錄。
    """
    content = await file.read()
    imported_count = import_transactions_from_csv(db, content, current_user.id)
    return {"message": f"Successfully imported {imported_count} transactions."}

@router.get("/transactions/export")
def export_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    匯出所有交易紀錄為 CSV 檔案。
    """
    csv_content = export_transactions_to_csv(db, current_user.id)
    response = Response(content=csv_content, media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=transactions.csv"
    return response