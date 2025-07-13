from sqlalchemy import Column, Integer, String, Float, Date, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship
from app.models.database import Base

class Transaction(Base):
    """
    SQLAlchemy model for transactions.
    """
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
    """
    SQLAlchemy model for categories.
    """
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Allow NULL for system categories
    name = Column(String, index=True)
    type = Column(String, index=True) # "income" or "expense"
    __table_args__ = (UniqueConstraint('user_id', 'name', 'type', name='_user_name_type_uc'),)

    owner = relationship("User", back_populates="categories")

class User(Base):
    """
    SQLAlchemy model for users.
    """
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    transactions = relationship("Transaction", back_populates="owner")
    categories = relationship("Category", back_populates="owner")