from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Transaction
from app.models import BudgetGoal

class BudgetGoalCreate(BaseModel): 
    """BudgetGoalCreate"""
    category: str
    limit: float 

router = APIRouter()

def get_db():
    """Returns session of the Database"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/budget_goal")
def create_budget_goal(data: BudgetGoalCreate, db: Session = Depends(get_db)):
    """Create a new BudgetGoal"""
    # 1. Neues Datenbank-Objekt aus den eingehenden Daten erstellen
    budget_goal = BudgetGoal(**data.model_dump())
    
    # 2. Zur Datenbank hinzufügen
    db.add(budget_goal)
    
    # 3. Speichern
    db.commit()
    
    # 4. Objekt aktualisieren (damit die ID gesetzt ist)
    db.refresh(budget_goal)
    
    # 5. Zurückgeben
    return budget_goal

@router.get("/budget_goal")
def get_budget_goal(db: Session = Depends(get_db)):
    """Get all BudgetGoal"""
    return db.query(BudgetGoal).all() 

@router.delete("/budget_goal/{budget_goal_id}")
def delete_budgetgoal(budget_goal_id: int, db: Session = Depends(get_db)):
    """Delete BudgetGoal by id"""
    #1. Transaktion in Db suchen 
    budget_goal = db.query(BudgetGoal).filter(BudgetGoal.id ==budget_goal_id).first()

    #2. Falls nicht gefunden -> 404
    if not budget_goal: 
        raise HTTPException(status_code=404, detail="BudgetGoal not found")
    
    #3. Löschne und speichern 
    db.delete(budget_goal)
    db.commit() 

    return {"message": "deleted"}