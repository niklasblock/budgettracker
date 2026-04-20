// --- TRANSACTIONS 
async function loadTransactions(){
    try {
        const response = await fetch("/transactions"); 
        const data = await response.json(); 
        const tbody = document.getElementById("transaction-body");
        tbody.innerHTML = "";
        data.forEach(transaction => {
            const row = document.createElement("tr"); 
            const badgeClass = transaction.type === "income" ? "badge-income" : "badge-expense";
            const badgeLabel = transaction.type === "income" ? "Einnahme" : "Ausgabe";
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.category}</td>
                <td style="color:#666">${transaction.description || "—"}</td>
                <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                <td>${transaction.amount} €</td>
                <td><button class="delete-btn" onclick="deleteTransaction(${transaction.id})">✕</button></td>
            `;
            tbody.appendChild(row);
        });
        loadSummary(); 
    } catch (error) {
        console.error('Fehler beim Aufrufen:', error);
    }
}

async function deleteTransaction(id) {
    await fetch(`/transactions/${id}`, {method: "DELETE"});
    document.getElementById("transaction-body").innerHTML = "";
    loadTransactions();
    loadSummary(); 
}

async function loadSummary() {
    const response = await fetch("/transactions/summary"); 
    const data = await response.json(); 

    document.getElementById("summary-income").textContent = data.income + " €";
    document.getElementById("summary-expenses").textContent = data.expenses + " €";
    document.getElementById("summary-balance").textContent = data.balance + " €";
}

// --- BUDGETGOALS
async function loadBudgetGoals() {
    try {
        const response = await fetch("/budget_goal"); 
        const data = await response.json(); 
        const container = document.getElementById("budget-goal-body");
        container.innerHTML = "";
        data.forEach(goal => {
            const row = document.createElement("div");
            row.className = "budget-row";
            row.innerHTML = `
                <div>
                    <div class="budget-info">${goal.category}</div>
                    <div class="budget-nums">Limit: ${goal.limit} €</div>
                </div>
                <button class="delete-btn" onclick="deleteBudgetGoals(${goal.id})">✕</button>
            `;
            container.appendChild(row);
        });
    } catch (error) {
        console.error('Fehler beim Aufrufen:', error);
    }
}

async function deleteBudgetGoals(id) {
    await fetch(`/budget_goal/${id}`, {method: "DELETE"}); 
    document.getElementById("budget-goal-body").innerHTML = ""; 
    loadBudgetGoals(); 
    loadBudgetSummary(); 
}

async function loadBudgetSummary() {
    try {
        const response = await fetch("/budget_goal/summary"); 
        const data = await response.json(); 
        const container = document.getElementById("budget-summary-body");
        container.innerHTML = "";
        data.forEach(item => {
            const percent = item.limit > 0 ? Math.min((item.spent / item.limit) * 100, 100) : 0;
            const fillClass = percent >= 100 ? "progress-over" : percent >= 80 ? "progress-warn" : "progress-ok";
            const row = document.createElement("div");
            row.className = "budget-row";
            row.innerHTML = `
                <div style="flex:1">
                    <div style="display:flex; justify-content:space-between;">
                        <div class="budget-info">${item.category}</div>
                        <div class="budget-nums">${item.spent} € / ${item.limit} €</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${fillClass}" style="width:${percent}%"></div>
                    </div>
                </div>
            `;
            container.appendChild(row);
        });
    } catch (error) {
        console.error('Fehler beim Aufrufen:', error);
    }
}

// --- Event Listener 
document.addEventListener("DOMContentLoaded", () => {
    loadTransactions();
    loadBudgetGoals(); 
    loadSummary(); 
    loadBudgetSummary(); 

    document.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault(); // verhindert Reload

        const formData = new FormData(e.target);

        const transaction = {
            amount: parseFloat(formData.get("amount")),
            type: formData.get("type"),
            category: formData.get("category"),
            description: formData.get("description"),
            date: formData.get("date")
        };

        if (!transaction.amount || !transaction.category || !transaction.date) {
            document.getElementById("transaction-error").style.display = "block";
            return;
        }
        document.getElementById("transaction-error").style.display = "none";

        try {
            const response = await fetch("/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(transaction)
            });

            if (!response.ok) {
                throw new Error("Fehler beim Speichern");
            }

            // Formular leeren
            e.target.reset();

            // Tabelle neu laden
            document.getElementById("transaction-body").innerHTML = "";
            loadTransactions();

        } catch (error) {
            console.error("POST Fehler:", error);
        }
    });
    
    document.getElementById("budget-goal-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        const budgetGoal = {
            category: formData.get("category"),
            limit: parseFloat(formData.get("limit"))
        };

        if (!budgetGoal.category || !budgetGoal.limit) {
            document.getElementById("budget-goal-error").style.display = "block";
            return;
        }
        document.getElementById("budget-goal-error").style.display = "none";

        try {
            const response = await fetch("/budget_goal", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(budgetGoal)
            });

            if (!response.ok) throw new Error("Fehler beim Speichern");

            e.target.reset();
            document.getElementById("budget-goal-body").innerHTML = "";
            loadBudgetGoals();

        } catch (error) {
            console.error("POST Fehler:", error);
        }
    });
}); 
    
