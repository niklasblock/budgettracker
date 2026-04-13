import yaml
from pathlib import Path 
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


def get_db_path() -> Path: 
    """Read database path form config.yaml
    
        Returns: 
            Path
    """

    #config.yaml einlesen
    with open("config.yaml") as f: 
        config = yaml.safe_load(f) 

    # expanduser() löst ~ zum echten Home-Pfad auf 
    return Path(config["database"]["path"]).expanduser()

def get_engine() -> Engine:
    """Create engine with path from config.yaml
    
        Returns: 
            Engine 
    """
    db_path = get_db_path()
    # db_path.parent ist der Ordner — den erstellen falls er nicht existiert
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return create_engine(f"sqlite:///{db_path}")


class Base(DeclarativeBase):
    """"""
    pass 


engine = get_engine()
SessionLocal = sessionmaker(bind=engine)