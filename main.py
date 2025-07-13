import os
import logging
from typing import List, Dict, Optional
from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, status
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, UniqueConstraint, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
import datetime
import csv
import io
from passlib.context import CryptContext
from jose import JWTError, jwt

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Database Setup ---
DATABASE_URL = "sqlite:///./stashup.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Models ---
class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, index=True) # "income" or "expense"
    description = Column(String)
    amount = Column(Float)
    category = Column(String, index=True)
    date = Column(Date)

    owner = relationship("User", back_populates="transactions")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Allow NULL for system categories
    name = Column(String, index=True)
    type = Column(String, index=True) # "income" or "expense"
    __table_args__ = (UniqueConstraint('user_id', 'name', 'type', name='_user_name_type_uc'),)

    owner = relationship("User", back_populates="categories")

# --- SQLAlchemy Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    transactions = relationship("Transaction", back_populates="owner")
    categories = relationship("Category", back_populates="owner")

    transactions = relationship("Transaction", back_populates="owner")
    categories = relationship("Category", back_populates="owner")

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

class TransactionImport(BaseModel):
    type: str
    description: str
    amount: float
    category: str
    date: str # For import, date might come as a string

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass

class CategoryModel(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

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

# --- Security Setup ---
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key") # Should be loaded from .env in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependency ---
# Keep get_db as a top-level function for other dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Manually get db session inside the dependency
    # db = SessionLocal() # This line is no longer needed as get_db is a dependency
    try:
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    finally:
        # db.close() # This line is no longer needed as get_db handles closing
        pass

# --- API Endpoints ---

# --- User Authentication Endpoints ---
@app.post("/register", response_model=UserBase)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    註冊新使用者。
    """
    logging.info(f"嘗試註冊使用者: {user.username}")
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        logging.warning(f"使用者名稱 {user.username} 已存在。")
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logging.info(f"使用者 {user.username} 註冊成功，ID: {db_user.id}")
    return db_user

@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    使用者登入並獲取 JWT Token。
    """
    user = db.query(User).filter(User.username == form_data.username).first()
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

# Transactions
@app.get("/api/transactions", response_model=List[TransactionModel])
def read_transactions(skip: int = 0, limit: int = 100, query: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    讀取交易紀錄，支援分頁和關鍵字查詢。
    """
    transactions_query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if query:
        transactions_query = transactions_query.filter(
            (Transaction.description.contains(query)) |
            (Transaction.category.contains(query))
        )
    transactions = transactions_query.offset(skip).limit(limit).all()
    return transactions

@app.post("/api/transactions", response_model=TransactionModel)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = Transaction(**transaction.model_dump(), user_id=current_user.id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.put("/api/transactions/{transaction_id}", response_model=TransactionModel)
def update_transaction(transaction_id: int, transaction: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found or you don't have permission to edit it")
    for key, value in transaction.model_dump().items():
        setattr(db_transaction, key, value)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.delete("/api/transactions/{transaction_id}", response_model=TransactionModel)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_transaction = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found or you don't have permission to delete it")
    db.delete(db_transaction)
    db.commit()
    return db_transaction

@app.post("/api/transactions/import")
async def import_transactions(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    從 CSV 檔案匯入交易紀錄。
    """
    try:
        content = await file.read()
        decoded_content = content.decode('utf-8')
        csv_reader = csv.reader(io.StringIO(decoded_content))
        header = next(csv_reader) # Skip header row

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
                    "user_id": current_user.id # Assign user_id
                }
                transactions_to_add.append(Transaction(**transaction_data))
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Data conversion error in row {row}: {e}")

        db.add_all(transactions_to_add)
        db.commit()
        return {"message": f"Successfully imported {len(transactions_to_add)} transactions."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import transactions: {e}")

@app.get("/api/transactions/export")
def export_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    匯出所有交易紀錄為 CSV 檔案。
    """
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    output = io.StringIO()
    csv_writer = csv.writer(output)
    
    # Write header
    csv_writer.writerow(["type", "description", "amount", "category", "date"])
    
    # Write data
    for trans in transactions:
        csv_writer.writerow([trans.type, trans.description, trans.amount, trans.category, trans.date.strftime("%Y-%m-%d")])
    
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=transactions.csv"
    return response

# Categories
@app.get("/api/categories", response_model=Dict[str, List[str]])
def read_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Fetch user-specific categories and system-wide categories (user_id is NULL)
    categories_db = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.user_id == None)
    ).all()
    result = {"income": [], "expense": []}
    for cat in categories_db:
        if cat.type in result:
            result[cat.type].append(cat.name)
    return result

@app.post("/api/categories", response_model=CategoryModel)
def create_category(category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if category already exists for this user
    existing_cat = db.query(Category).filter(
        Category.user_id == current_user.id,
        Category.name == category.name,
        Category.type == category.type
    ).first()
    if existing_cat:
        raise HTTPException(status_code=400, detail="Category already exists for this user")
        
    db_category = Category(**category.model_dump(), user_id=current_user.id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.put("/api/categories/{category_id}", response_model=CategoryModel)
def update_category(category_id: int, category: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    更新類別名稱。
    """
    db_category = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user.id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found or you don't have permission to edit it")
    
    # Check if new name/type combination already exists for this user
    existing_cat = db.query(Category).filter(
        Category.user_id == current_user.id, # Filter by user_id
        Category.name == category.name,
        Category.type == category.type,
        Category.id != category_id
    ).first()
    if existing_cat:
        raise HTTPException(status_code=400, detail="Category with this name and type already exists for this user")

    # Update transactions that use the old category name if the name changes
    if db_category.name != category.name or db_category.type != category.type:
        db.query(Transaction).filter(
            Transaction.user_id == current_user.id, # Filter by user_id
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

@app.delete("/api/categories/{category_type}/{category_name}", response_model=CategoryModel)
def delete_category(category_type: str, category_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_category = db.query(Category).filter(
        Category.user_id == current_user.id, # Filter by user_id
        Category.name == category_name,
        Category.type == category_type
    ).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found or you don't have permission to delete it")
    
    # Optional: Update transactions using this category
    db.query(Transaction).filter(
        Transaction.user_id == current_user.id, # Filter by user_id
        Transaction.category == category_name,
        Transaction.type == category_type
    ).update({"category": "其他"})

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
    logging.info("接收到根路徑請求 '/'")
    return FileResponse('static/index.html')

# --- Initial Data Seeding ---
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Only seed if there are absolutely no categories in the database
        if db.query(Category).count() == 0:
            default_categories = {
                "expense": ['餐飲', '交通', '購物', '娛樂', '居家', '醫療', '其他'],
                "income": ['薪資', '獎金', '投資', '副業', '其他']
            }
            for cat_type, cat_list in default_categories.items():
                for cat_name in cat_list:
                    # Insert categories without a user_id (system-wide categories)
                    db.add(Category(name=cat_name, type=cat_type, user_id=None)) # Explicitly set user_id to None
            db.commit()
    finally:
        db.close()
