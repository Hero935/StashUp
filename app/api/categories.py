from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.models import User
from app.schemas.schemas import CategoryCreate, CategoryModel
from app.crud.crud import get_categories, create_user_category, update_user_category, delete_user_category
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/categories", response_model=Dict[str, List[str]])
def read_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    讀取類別，包含使用者自訂和系統預設類別。
    """
    return get_categories(db, current_user.id)

@router.post("/categories", response_model=CategoryModel)
def create_category(category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    建立新類別。
    """
    db_category = create_user_category(db=db, category=category, user_id=current_user.id)
    if db_category is None:
        raise HTTPException(status_code=400, detail="Category already exists for this user")
    return db_category

@router.put("/categories/{category_id}", response_model=CategoryModel)
def update_category(category_id: int, category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    更新類別名稱。
    """
    db_category = update_user_category(db=db, category_id=category_id, category=category, user_id=current_user.id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found or you don't have permission to edit it, or a category with this name/type already exists.")
    return db_category

@router.delete("/categories/{category_type}/{category_name}", response_model=CategoryModel)
def delete_category(category_type: str, category_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    刪除類別。
    """
    db_category = delete_user_category(db=db, category_type=category_type, category_name=category_name, user_id=current_user.id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found or you don't have permission to delete it")
    return db_category