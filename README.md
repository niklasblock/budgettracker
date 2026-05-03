# budgettracker

Budget Tracker with Web Interface

## Installation

```bash
git clone https://github.com/niklasblock/budgettracker.git
cd budgettracker
pip install -e .
```

## Run

```bash
# Als Desktop App (empfohlen)
python start.py

# Als Browser App
uvicorn app.main:app --reload
# dann http://127.0.0.1:8000/static/index.html öffnen
```

## Build als .app (macOS)

```bash
pyinstaller --windowed --name "BudgetTracker" \
  --add-data "frontend:frontend" \
  --add-data "config.yaml:." \
  --hidden-import "webview" \
  --hidden-import "webview.platforms.cocoa" \
  --icon icon.icns \
  start.py
```


## Features
- Dashboard with metrics, charts, and budget overview
- Transactions with monthly filter, planned/paid status and edit functionality 
- Recurring payments that are automatically marked as “planned”
- Manage categories
- Budget goals with progress bars (limit & target types)
- Dark Mode
- macOS App Launcher

## Roadmap
- [ ] Import/Export data using csv 
- [ ] Annual overview of standing orders and subscriptions
- [ ] Search in transactions 
- [ ] Budget limit notifications 