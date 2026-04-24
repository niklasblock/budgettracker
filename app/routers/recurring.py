from pydantic import BaseModel
from datetime import date 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import RecurringTransaction


class RecurringCreate(BaseModel):
    amount: float
    type: str
    category: str
    description: str | None = None
    interval: str  # "monthly"
    next_due: date


router = APIRouter() 


def get_db(): 
    """Returns session of the Database"""
    db = SessionLocal()
    try: 
        yield db
    finally: 
        db.close() 

@router.post("/recurring")
def create_recurring(data: RecurringCreate, db: Session = Depends(get_db)):
    """Create a new Recurring Transaction"""
    recurring_transaction = RecurringTransaction(**data.model_dump())

    db.add(recurring_transaction)

    db.commit()

    db.refresh(recurring_transaction)

    return recurring_transaction

@router.get("/recurring")
def get_recurring(db: Session = Depends(get_db)): 
    """Get all Recurring Transactions"""
    return db.query(RecurringTransaction).all()

@router.delete("/recurring/{recurring_id}")
def delete_recurring(recurring_id: int, db: Session = Depends(get_db)): 
    """Delelte Recurring by id """
    recurring_transaction = db.query(RecurringTransaction)\
                            .filter(RecurringTransaction.id == recurring_id)\
                            .first()
    
    if not recurring_transaction: 
        raise HTTPException(status_code=404, detail="Recurring Transaction not found")
    
    db.delete(recurring_transaction) 
    db.commit()

    return {"message": "deleted"}