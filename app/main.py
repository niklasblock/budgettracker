from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app import models 
from app.routers import transactions

app = FastAPI() 
app.include_router(transactions.router)

#Frontend-Dateien ausliefern 
app.mount("/static", StaticFiles(directory="frontend"), name="static") 

@app.get("/")
def root(): 
    """"""
    return {"message": "hello"}

@app.get("/health")
def health(): 
    """"""
    return {"status": "ok"}

@app.on_event("startup")
def startup(): 
    """"""
    Base.metadata.create_all(bind=engine)