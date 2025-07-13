import datetime
import io
import csv
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.models import User, Transaction, Category
from app.schemas.schemas import UserCreate, TransactionCreate, CategoryCreate, TransactionImport
from app.core.security import get_password_hash

# --- User CRUD Operations ---
def get_user_by_username(db: Session, username: str):
    """
    Retrieve a user by username.
    """
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    """
    Create a new user.
    """
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Transaction CRUD Operations ---
def get_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 100, query: Optional[str] = None):
    """
    Retrieve transactions for a specific user, with optional pagination and query.
    """
    transactions_query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if query:
        transactions_query = transactions_query.filter(
            (Transaction.description.contains(query)) |
            (Transaction.category.contains(query))
        )
    return transactions_query.offset(skip).limit(limit).all()

def create_user_transaction(db: Session, transaction: TransactionCreate, user_id: int):
    """
    Create a new transaction for a specific user.
    """
    db_transaction = Transaction(**transaction.model_dump(), user_id=user_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def update_user_transaction(db: Session, transaction_id: int, transaction: TransactionCreate, user_id: int):
    """
    Update an existing transaction for a specific user.
    """
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user_id).first()
    if db_transaction is None:
        return None
    for key, value in transaction.model_dump().items():
        setattr(db_transaction, key, value)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def delete_user_transaction(db: Session, transaction_id: int, user_id: int):
    """
    Delete a transaction for a specific user.
    """
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user_id).first()
    if db_transaction is None:
        return None
    db.delete(db_transaction)
    db.commit()
    return db_transaction

def import_transactions_from_csv(db: Session, file_content: bytes, user_id: int):
    """
    Import transactions from a CSV file for a specific user.
    """
    try:
        decoded_content = file_content.decode('utf-8')
        csv_reader = csv.reader(io.StringIO(decoded_content))
        next(csv_reader) # Skip header row

        transactions_to_add = []
        for row in csv_reader:
            if len(row) != 5:
                raise HTTPException(status_code=400, detail=f"Invalid row format: {row}. Expected 5 columns.")
            try:
                transaction_data = {
                    "type": row[0],
                    "description": row[1],
                    "amount": float(row[2]),
                    "category": row[3],
                    "date": datetime.datetime.strptime(row[4], "%Y-%m-%d").date(),
                    "user_id": user_id
                }
                transactions_to_add.append(Transaction(**transaction_data))
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Data conversion error in row {row}: {e}")

        db.add_all(transactions_to_add)
        db.commit()
        return len(transactions_to_add)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import transactions: {e}")

def export_transactions_to_csv(db: Session, user_id: int):
    """
    Export all transactions for a specific user to a CSV string.
    """
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    
    output = io.StringIO()
    csv_writer = csv.writer(output)
    
    # Write header
    csv_writer.writerow(["type", "description", "amount", "category", "date"])
    
    # Write data
    for trans in transactions:
        csv_writer.writerow([trans.type, trans.description, trans.amount, trans.category, trans.date.strftime("%Y-%m-%d")])
    
    return output.getvalue()

# --- Category CRUD Operations ---
def get_categories(db: Session, user_id: int):
    """
    Retrieve categories for a specific user, including system-wide categories.
    """
    categories_db = db.query(Category).filter(
        (Category.user_id == user_id) | (Category.user_id == None)
    ).all()
    result = {"income": [], "expense": []}
    for cat in categories_db:
        if cat.type in result:
            result[cat.type].append(cat.name)
    return result

def create_user_category(db: Session, category: CategoryCreate, user_id: int):
    """
    Create a new category for a specific user.
    """
    existing_cat = db.query(Category).filter(
        Category.user_id == user_id,
        Category.name == category.name,
        Category.type == category.type
    ).first()
    if existing_cat:
        return None # Category already exists
        
    db_category = Category(**category.model_dump(), user_id=user_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_user_category(db: Session, category_id: int, category: CategoryCreate, user_id: int):
    """
    Update an existing category for a specific user.
    """
    db_category = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if db_category is None:
        return None
    
    existing_cat = db.query(Category).filter(
        Category.user_id == user_id,
        Category.name == category.name,
        Category.type == category.type,
        Category.id != category_id
    ).first()
    if existing_cat:
        return None # Category with new name/type already exists for this user

    if db_category.name != category.name or db_category.type != category.type:
        db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.category == db_category.name,
            Transaction.type == db_category.type
        ).update({
            Transaction.category: category.name,
            Transaction.type: category.type
        })

    for key, value in category.model_dump().items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_user_category(db: Session, category_type: str, category_name: str, user_id: int):
    """
    Delete a category for a specific user.
    """
    db_category = db.query(Category).filter(
        Category.user_id == user_id,
        Category.name == category_name,
        Category.type == category_type
    ).first()
    if db_category is None:
        return None
    
    db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.category == category_name,
        Transaction.type == category_type
    ).update({"category": "其他"})

    db.delete(db_category)
    db.commit()
    return db_category

def seed_default_categories(db: Session):
    """
    Seed default system-wide categories if none exist.
    """
    if db.query(Category).count() == 0:
        default_categories = {
            "expense": ['餐飲', '交通', '購物', '娛樂', '居家', '醫療', '其他'],
            "income": ['薪資', '獎金', '投資', '副業', '其他']
        }
        for cat_type, cat_list in default_categories.items():
            for cat_name in cat_list:
                db.add(Category(name=cat_name, type=cat_type, user_id=None))
        db.commit()