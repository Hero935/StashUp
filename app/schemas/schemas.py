from typing import Optional, List, Dict
import datetime
from pydantic import BaseModel

# Pydantic Schemas
class TransactionBase(BaseModel):
    """
    Base schema for a transaction.
    """
    type: str
    description: str
    amount: float
    category: str
    date: datetime.date

class TransactionCreate(TransactionBase):
    """
    Schema for creating a new transaction.
    """
    pass

class TransactionModel(TransactionBase):
    """
    Schema for a transaction returned from the API.
    """
    id: int

    class Config:
        from_attributes = True

class TransactionImport(BaseModel):
    """
    Schema for importing transactions from a file.
    """
    type: str
    description: str
    amount: float
    category: str
    date: str # For import, date might come as a string

class CategoryBase(BaseModel):
    """
    Base schema for a category.
    """
    name: str
    type: str

class CategoryCreate(CategoryBase):
    """
    Schema for creating a new category.
    """
    pass

class CategoryModel(CategoryBase):
    """
    Schema for a category returned from the API.
    """
    id: int

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    """
    Base schema for a user.
    """
    username: str

class UserCreate(UserBase):
    """
    Schema for creating a new user.
    """
    password: str

class UserInDB(UserBase):
    """
    Schema for a user stored in the database.
    """
    hashed_password: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    """
    Schema for JWT token.
    """
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """
    Schema for JWT token data.
    """
    username: Optional[str] = None

# Export/Import Schemas
class UserDataExport(BaseModel):
    """
    Schema for exporting user data including transactions and categories.
    """
    username: str
    transactions: List[TransactionModel]
    custom_categories: List[CategoryModel]

class UserDataImport(BaseModel):
    """
    Schema for importing user data.
    """
    transactions: List[TransactionCreate]
    custom_categories: List[CategoryCreate]