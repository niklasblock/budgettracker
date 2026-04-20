from pydantic import BaseModel
from datetime import date 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import SessionLocal
from app.models import Transaction

class TransactionCreate(BaseModel): 
    amount: float 
    type: str 
    category: str 
    description: str | None = None 
    date: date 




router = APIRouter()

def get_db():
    """Returns session of the Database"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/transactions")
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    """Create a new transaction"""
    # 1. Neues Datenbank-Objekt aus den eingehenden Daten erstellen
    transaction = Transaction(**data.model_dump())
    
    # 2. Zur Datenbank hinzufügen
    db.add(transaction)
    
    # 3. Speichern
    db.commit()
    
    # 4. Objekt aktualisieren (damit die ID gesetzt ist)
    db.refresh(transaction)
    
    # 5. Zurückgeben
    return transaction

@router.get("/transactions")
def get_transaction(month: str | None = None, db: Session = Depends(get_db)):
    """Get all transaction"""
    if month: 
        year, mon = month.split("-")
        return db.query(Transaction)\
                    .filter(extract("year", Transaction.date) == int(year))\
                    .filter(extract("month", Transaction.date) == int(mon))\
                    .all()
    else: 
        return db.query(Transaction).all() 



@router.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    #1. Transaktion in Db suchen 
    transaction = db.query(Transaction).filter(Transaction.id ==transaction_id).first()

    #2. Falls nicht gefunden -> 404
    if not transaction: 
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    #3. Löschne und speichern 
    db.delete(transaction)
    db.commit() 

    return {"message": "deleted"}


@router.get("/transactions/summary")
def get_transaction_summary(db: Session = Depends(get_db)):
    """Return summary of all transactions"""
    income = db.query(func.sum(Transaction.amount))\
               .filter(Transaction.type == "income")\
               .scalar() or 0.0
    
    expenses = db.query(func.sum(Transaction.amount))\
                 .filter(Transaction.type == "expense")\
                 .scalar() or 0.0
    
    return {
        "income": income,
        "expenses": expenses,
        "balance": income - expenses
    }