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

## Konfiguration

Die Einstellungen (z. B. der Datenbank-Pfad) liegen in `~/.budgettracker/config.yaml`.
Die Datei wird beim ersten Start aus der `config.yaml` im Repo erzeugt und übersteht dadurch
neue Builds der App. Zum Testen mit einer anderen Datenbank, ohne die Config zu ändern:

```bash
cp "<pfad-zur-echten>/budget.db" /tmp/test_budget.db
BUDGETTRACKER_DB=/tmp/test_budget.db python start.py
```

Ist Port 8000 belegt (z. B. läuft noch eine andere Instanz), nutzt `start.py` automatisch einen freien Port.

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