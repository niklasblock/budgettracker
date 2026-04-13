from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Date
from app.database import Base
from datetime import datetime


class Transaction(Base):
    """TAbel for all transactions"""
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    date: Mapped[datetime] = mapped_column(Date)


class BudgetGoal(Base):
    """Table for the Budget Goals"""
    __tablename__ = "budget_goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String)
    limit: Mapped[float] = mapped_column(Float)