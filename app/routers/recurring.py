from pydantic import BaseModel
from datetime import date 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
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

@router.get("/recurring/upcoming")
def get_upcoming_recurring(db: Session = Depends(get_db)):
    """Get all recurring transactions, annotated with whether they fall due
    within the relevant window for their interval (so the frontend can group/filter)."""
    today = date.today()
    all_recurring = db.query(RecurringTransaction)\
                      .order_by(RecurringTransaction.interval, RecurringTransaction.next_due)\
                      .all()

    from calendar import monthrange
    month_start = today.replace(day=1)
    month_end = today.replace(day=monthrange(today.year, today.month)[1])

    result = []
    for r in all_recurring:
        nd = r.next_due
        if r.interval == "weekly":
            # due within current week (Mon–Sun)
            week_start = today - __import__("datetime").timedelta(days=today.weekday())
            week_end = week_start + __import__("datetime").timedelta(days=6)
            in_window = week_start <= nd <= week_end
        elif r.interval == "monthly":
            in_window = nd.year == today.year and nd.month == today.month
        elif r.interval == "quarterly":
            # same calendar quarter
            def quarter(d): return (d.month - 1) // 3
            in_window = nd.year == today.year and quarter(nd) == quarter(today)
        elif r.interval == "yearly":
            in_window = nd.year == today.year
        else:
            in_window = nd.year == today.year and nd.month == today.month

        result.append({
            "id": r.id,
            "amount": r.amount,
            "type": r.type,
            "category": r.category,
            "description": r.description,
            "interval": r.interval,
            "next_due": str(r.next_due),
            "in_window": in_window
        })

    return result


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