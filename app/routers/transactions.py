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

class TransactionUpdate(BaseModel):
    amount: float
    type: str
    category: str
    description: str | None = None
    date: date
    status: str


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

@router.get("/transactions/summary")
def get_transaction_summary(db: Session = Depends(get_db)):
    """Return summary of all transactions"""
    income = db.query(func.sum(Transaction.amount))\
            .filter(Transaction.type == "income")\
            .filter(Transaction.status == "paid")\
            .scalar() or 0.0
    
    expenses = db.query(func.sum(Transaction.amount))\
                 .filter(Transaction.type == "expense")\
                 .filter(Transaction.status == "paid")\
                 .scalar() or 0.0
    
    return {
        "income": income,
        "expenses": expenses,
        "balance": income - expenses
    }

@router.get("/transactions/yearly")
def get_transactions_yearly(db: Session = Depends(get_db)):
    """Returns income and expenses per month"""
    from sqlalchemy import extract, case
    
    results = db.query(
        extract("year", Transaction.date).label("year"),
        extract("month", Transaction.date).label("month"),
        func.sum(case((Transaction.type == "income", Transaction.amount), else_=0)).label("income"),
        func.sum(case((Transaction.type == "expense", Transaction.amount), else_=0)).label("expenses")
    ).filter(Transaction.status == "paid")\
        .group_by("year", "month").order_by("year", "month").all()

    return [
        {
            "month": f"{int(r.year)}-{int(r.month):02d}",
            "income": r.income,
            "expenses": r.expenses
        }
        for r in results
    ]

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


@router.patch("/transactions/{transaction_id}/status")
def update_status(transaction_id: int, db: Session = Depends(get_db)):
    """Toggle transaction status between planned and paid"""
    transaction = db.query(Transaction)\
                    .filter(Transaction.id == transaction_id)\
                    .first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.status = "paid" if transaction.status == "planned" else "planned"
    db.commit()
    db.refresh(transaction)
    
    return transaction

@router.put("/transactions/{transaction_id}")
def update_transaction(transaction_id: int, data: TransactionUpdate, db: Session = Depends(get_db)):
    """Update an existing transaction"""
    transaction = db.query(Transaction)\
                    .filter(Transaction.id == transaction_id)\
                    .first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    for key, value in data.model_dump().items():
        setattr(transaction, key, value)
    
    db.commit()
    db.refresh(transaction)
    return transaction