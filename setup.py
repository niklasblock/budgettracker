from setuptools import setup

APP = ["start.py"]
DATA_FILES = [
    ("frontend", ["frontend/index.html", "frontend/style.css", "frontend/app.js"]),
    ("", ["config.yaml"]),
]
OPTIONS = {
    "packages": ["app", "webview", "uvicorn", "fastapi", "sqlalchemy"],
    "includes": ["app.main", "app.models", "app.database", "app.routers.transactions", 
                 "app.routers.budget_goals", "app.routers.categories", "app.routers.recurring"],
}

setup(
    app=APP,
    data_files=DATA_FILES,
    options={"py2app": OPTIONS},
    setup_requires=["py2app"],
)