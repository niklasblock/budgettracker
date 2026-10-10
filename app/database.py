import os
import shutil
import yaml
import sys 
from pathlib import Path 
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


USER_CONFIG_DIR = Path.home() / ".budgettracker"
USER_CONFIG_PATH = USER_CONFIG_DIR / "config.yaml"


def get_default_config_path() -> Path:
    """Default config shipped with the code / app bundle (read-only template)"""
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS) / "config.yaml"
    return Path(__file__).parent.parent / "config.yaml"


def get_config_path() -> Path:
    """Path of the user config (~/.budgettracker/config.yaml).

    Lives outside the app bundle so settings survive rebuilds.
    On first start it is created from the default config.
    """
    if not USER_CONFIG_PATH.exists():
        USER_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(get_default_config_path(), USER_CONFIG_PATH)
    return USER_CONFIG_PATH


def get_db_path() -> Path:
    """Database path. BUDGETTRACKER_DB overrides the config (handy for testing)."""
    override = os.environ.get("BUDGETTRACKER_DB")
    if override:
        return Path(override).expanduser()
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