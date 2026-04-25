# budgettracker

Budget Tracker with Web Interface

## Installation

```bash
git clone https://github.com/niklasblock/budgettracker.git
cd budgettracker
pip install -e .
uvicorn app.main:app --reload
```

## macOS App
To launch the app with a double-click, create the app bundle:

```bash
mkdir -p BudgetTracker.app/Contents/MacOS
cp launch.sh BudgetTracker.app/Contents/MacOS/launch
chmod +x BudgetTracker.app/Contents/MacOS/launch
```

Then create `BudgetTracker.app/Contents/Info.plist` with the contents from the repository.

## Usage
Open your browser and navigate to:
http://127.0.0.1:8000/static/index.html


## Features
- Dashboard with metrics, charts, and budget overview
- Transactions with a monthly filter and “planned/paid” status
- Recurring payments that are automatically marked as “planned”
- Manage categories
- Budget goals with progress bars
- Dark Mode
- macOS App Launcher

## Roadmap
- [ ] Import/Export data using csv 
- [ ] Annual overview of standing orders and subscriptions