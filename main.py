import os
from typing import List, Dict
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import datetime

# --- Database Setup ---
DATABASE_URL = "sqlite:///./stashup.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Models ---
class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True) # "income" or "expense"
    description = Column(String)
    amount = Column(Float)
    category = Column(String, index=True)
    date = Column(Date)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String, index=True) # "income" or "expense"
    __table_args__ = (UniqueConstraint('name', 'type', name='_name_type_uc'),)

Base.metadata.create_all(bind=engine)

# --- Pydantic Schemas ---
class TransactionBase(BaseModel):
    type: str
    description: str
    amount: float
    category: str
    date: datetime.date

class TransactionCreate(TransactionBase):
    pass

class TransactionModel(TransactionBase):
    id: int

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass

class CategoryModel(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# --- FastAPI App ---
app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API Endpoints ---

# Transactions
@app.get("/api/transactions", response_model=List[TransactionModel])
def read_transactions(skip: int = 0, limit: int = 100, query: str = None, db: Session = Depends(get_db)):
    """
    讀取交易紀錄，支援分頁和關鍵字查詢。
    """
    transactions_query = db.query(Transaction)
    if query:
        transactions_query = transactions_query.filter(
            Transaction.description.contains(query) |
            Transaction.category.contains(query)
        )
    transactions = transactions_query.offset(skip).limit(limit).all()
    return transactions

@app.post("/api/transactions", response_model=TransactionModel)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.put("/api/transactions/{transaction_id}", response_model=TransactionModel)
def update_transaction(transaction_id: int, transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for key, value in transaction.model_dump().items():
        setattr(db_transaction, key, value)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.delete("/api/transactions/{transaction_id}", response_model=TransactionModel)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_transaction)
    db.commit()
    return db_transaction

# Categories
@app.get("/api/categories", response_model=Dict[str, List[str]])
def read_categories(db: Session = Depends(get_db)):
    categories_db = db.query(Category).all()
    result = {"income": [], "expense": []}
    for cat in categories_db:
        if cat.type in result:
            result[cat.type].append(cat.name)
    return result

@app.post("/api/categories", response_model=CategoryModel)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    # Check if category already exists
    existing_cat = db.query(Category).filter(Category.name == category.name, Category.type == category.type).first()
    if existing_cat:
        raise HTTPException(status_code=400, detail="Category already exists")
        
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.delete("/api/categories/{category_type}/{category_name}", response_model=CategoryModel)
def delete_category(category_type: str, category_name: str, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.name == category_name, Category.type == category_type).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Optional: Update transactions using this category
    db.query(Transaction).filter(Transaction.category == category_name, Transaction.type == category_type).update({"category": "其他"})

    db.delete(db_category)
    db.commit()
    return db_category

# --- Static Files and Root ---
# Ensure the static directory exists
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

# --- Initial Data Seeding ---
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    # Check if categories are already seeded
    if db.query(Category).count() == 0:
        default_categories = {
            "expense": ['餐飲', '交通', '購物', '娛樂', '居家', '醫療', '其他'],
            "income": ['薪資', '獎金', '投資', '副業', '其他']
        }
        for cat_type, cat_list in default_categories.items():
            for cat_name in cat_list:
                # 檢查類別是否已存在，避免重複插入
                existing_category = db.query(Category).filter_by(name=cat_name, type=cat_type).first()
                if not existing_category:
                    db.add(Category(name=cat_name, type=cat_type))
        db.commit()
    db.close()
