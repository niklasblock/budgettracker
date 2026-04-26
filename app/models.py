from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Date
from app.database import Base
from datetime import datetime, date 


class Transaction(Base):
    """TAbel for all transactions"""
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    date: Mapped[datetime] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String, default="paid")


class BudgetGoal(Base):
    """Table for the Budget Goals"""
    __tablename__ = "budget_goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String)
    limit: Mapped[float] = mapped_column(Float)
    goal_type: Mapped[str] = mapped_column(String, default="limit")  # "limit" oder "target"


class Category(Base):
    """Table for categories"""
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)


class RecurringTransaction(Base):
    """Table for recurring transactions"""
    __tablename__ = "recurring_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    interval: Mapped[str] = mapped_column(String)  # "monthly"
    next_due: Mapped[date] = mapped_column(Date)