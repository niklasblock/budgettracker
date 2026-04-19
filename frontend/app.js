// --- TRANSACTIONS 
async function loadTransactions(){
    try {
        const response = await fetch("/transactions"); 
        const data = await response.json(); 
        
        const tbody = document.getElementById("transaction-body");

        data.forEach(transaction => {
            const row = document.createElement("tr"); 
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.type}</td>
                <td>${transaction.category}</td>
                <td>${transaction.amount}</td>
                <td>${transaction.description}</td>
                <td><button onclick="deleteTransaction(${transaction.id})">🗑</button></td>

            `;
            tbody.appendChild(row);
        });
        loadSummary(); 

    } catch (error) {
        console.error('Fehler beim Aufrufen:', error)
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

        const tbody = document.getElementById("budget-goal-body"); 

        data.forEach(budget_goal => {
            const row = document.createElement("tr"); 
            row.innerHTML = `
                <td>${budget_goal.category}</td>
                <td>${budget_goal.limit}</td>
                <td><button onclick="deleteBudgetGoals(${budget_goal.id})">🗑</button></td>
            `; 
            tbody.appendChild(row); 
        }); 
    } catch (error) {
        console.error('Fehler beim Aufrufen:' , error)
    }
}

async function deleteBudgetGoals(id) {
    await fetch(`/budget_goal/${id}`, {method: "DELETE"}); 
    document.getElementById("budget-goal-body").innerHTML = ""; 
    loadBudgetGoals(); 
}

// --- Event Listener 
document.addEventListener("DOMContentLoaded", () => {
    loadTransactions();
    loadBudgetGoals(); 
    loadSummary(); 

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
    
