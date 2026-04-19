# budgettracker

Budget Tracker with Web Interface

## Installation

```bash
git clone https://github.com/niklasblock/budgettracker.git
cd budgettracker
pip install -e .
uvicorn app.main:app --reload
```

## Usage
Open your browser and navigate to:
http://127.0.0.1:8000/static/index.html


## Features
- Add, view and delete transactions (income & expenses)
- Set budget goals per category
- Transaction summary (income, expenses, balance)
- Budget goal comparison (spent vs limit)

## Roadmap
- [ ] Monatsfiler - Transaktionen nach Monat filtern 
- [ ] Farb-Feedback im Budget-Vergleich - rot/grün je nach Status 
- [ ] Formular-Validierung - leere Felder abfrangen, Fehlermeldungen anzeigen 