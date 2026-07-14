from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base, get_config_path
from app import models 
import sys 
import yaml
from pathlib import Path 
from app.routers import transactions, budget_goals, categories, recurring
from datetime import date
from dateutil.relativedelta import relativedelta
from app.models import RecurringTransaction, Transaction
from app.database import SessionLocal
from pydantic import BaseModel

app = FastAPI() 
app.include_router(transactions.router)
app.include_router(budget_goals.router)
app.include_router(categories.router)
app.include_router(recurring.router)

#Frontend-Dateien ausliefern 
def get_frontend_path() -> str:
    """Get frontend directory path for PyInstaller and development"""
    if getattr(sys, 'frozen', False):
        return str(Path(sys._MEIPASS) / "frontend")
    else:
        return "frontend"

app.mount("/static", StaticFiles(directory=get_frontend_path()), name="static") 

@app.get("/")
def root(): 
    return {"message": "hello"}

@app.get("/health")
def health(): 
    return {"status": "ok"}

class SettingsUpdate(BaseModel):
    db_path: str

@app.get("/settings")
def get_settings():
    """Return current settings"""
    with open(get_config_path()) as f:
        config = yaml.safe_load(f)
    return {"db_path": config["database"]["path"]}

@app.put("/settings")
def update_settings(data: SettingsUpdate):
    """Update settings and write to config.yaml"""
    config_path = get_config_path()
    with open(config_path) as f:
        config = yaml.safe_load(f)
    config["database"]["path"] = data.db_path
    with open(config_path, "w") as f:
        yaml.dump(config, f)
    return {"db_path": data.db_path, "message": "Gespeichert. Bitte App neu starten."}

@app.on_event("startup")
def startup():
    """Create tables and process recurring transactions"""
    Base.metadata.create_all(bind=engine)
    process_recurring_transactions()

def process_recurring_transactions():
    """Check for due recurring transactions and create them"""
    db = SessionLocal()
    try:
        today = date.today()
        due = db.query(RecurringTransaction)\
                .filter(RecurringTransaction.next_due <= today)\
                .all()
        
        for r in due:
            # Neue Transaktion erstellen
            transaction = Transaction(
                amount=r.amount,
                type=r.type,
                category=r.category,
                description=r.description,
                date=r.next_due,
                status="planned"
            )
            db.add(transaction)
            
            # next_due um einen Monat verschieben
            r.next_due = r.next_due + relativedelta(months=1)
        
        db.commit()
    finally:
        db.close()