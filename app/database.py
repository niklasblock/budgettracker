import yaml
import sys 
from pathlib import Path 
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


def get_config_path() -> Path:
    """Get config.yaml path - works both in development and PyInstaller bundle"""
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS) / "config.yaml"
    else:
        return Path(__file__).parent.parent / "config.yaml"


def get_db_path() -> Path:
    """Read database path from config.yaml"""
    with open(get_config_path()) as f:
        config = yaml.safe_load(f)
    return Path(config["database"]["path"]).expanduser()


def get_engine() -> Engine:
    """Create engine with path from config.yaml
    
    Returns:
        Engine
    """
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return create_engine(f"sqlite:///{db_path}")


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


engine = get_engine()
SessionLocal = sessionmaker(bind=engine)