from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Category

class CategoryCreate(BaseModel): 
    """CategoryCreate"""
    name: str



router = APIRouter()

def get_db():
    """Returns session of the Database"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Get all Categories"""
    return db.query(Category).all() 


@router.post("/categories")
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new Category"""
    # Prüfen ob Kategorie bereits existiert
    existing = db.query(Category).filter(Category.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kategorie existiert bereits")
    
    category = Category(**data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}")
def delete_budgetgoal(category_id: int, db: Session = Depends(get_db)):
    """Delete Category by id"""
    #1. Transaktion in Db suchen 
    category = db.query(Category).filter(Category.id ==category_id).first()

    #2. Falls nicht gefunden -> 404
    if not category: 
        raise HTTPException(status_code=404, detail="Category not found")
    
    #3. Löschne und speichern 
    db.delete(category)
    db.commit() 

    return {"message": "deleted"}