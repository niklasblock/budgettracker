// --- TRANSACTIONS 
async function loadTransactions(){
    try {
        const month = document.getElementById("month-filter").value;
        const response = await fetch(`/transactions?month=${month}`);
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
        loadCategoryChart();
        loadYearlyChart(); 
    } catch (error) {
        console.error('Fehler beim Aufrufen:', error);
    }
}

async function deleteTransaction(id) {
    await fetch(`/transactions/${id}`, {method: "DELETE"});
    document.getElementById("transaction-body").innerHTML = "";
    loadTransactions();
    loadSummary(); 
    loadCategoryChart();
    loadYearlyChart(); 
}

async function loadSummary() {
    const response = await fetch("/transactions/summary"); 
    const data = await response.json(); 

    document.getElementById("summary-income").textContent = data.income + " €";
    document.getElementById("summary-expenses").textContent = data.expenses + " €";
    document.getElementById("summary-balance").textContent = data.balance + " €";
}

let yearlyChart = null;

async function loadYearlyChart() {
    const response = await fetch("/transactions/yearly");
    const data = await response.json();

    const labels = data.map(d => d.month);
    const income = data.map(d => d.income);
    const expenses = data.map(d => d.expenses);

    const ctx = document.getElementById("yearly-chart").getContext("2d");

    if (yearlyChart) {
        yearlyChart.destroy();
    }

    yearlyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Einnahmen",
                    data: income,
                    borderColor: "#3b6d11",
                    backgroundColor: "rgba(59, 109, 17, 0.1)",
                    tension: 0.3
                },
                {
                    label: "Ausgaben",
                    data: expenses,
                    borderColor: "#a32d2d",
                    backgroundColor: "rgba(163, 45, 45, 0.1)",
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
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

// --- Category 

let categoryChart = null;

async function loadCategoryChart() {
    const response = await fetch("/transactions/by-category");
    const data = await response.json();

    const labels = data.map(d => d.category);
    const values = data.map(d => d.total);

    const ctx = document.getElementById("category-chart").getContext("2d");

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Ausgaben (€)",
                data: values,
                backgroundColor: "#a32d2d",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

async function loadCategories() {
    const response = await fetch("/categories");
    const data = await response.json();

    const selects = ["category", "bg-category", "rec-category"];
    
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '<option value="">Kategorie wählen</option>';
        data.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    });
}

async function loadCategoryList() {
    const response = await fetch("/categories");
    const data = await response.json();

    const container = document.getElementById("category-list");
    container.innerHTML = "";

    data.forEach(cat => {
        const row = document.createElement("div");
        row.className = "budget-row";
        row.innerHTML = `
            <div class="budget-info">${cat.name}</div>
            <button class="delete-btn" onclick="deleteCategory(${cat.id})">✕</button>
        `;
        container.appendChild(row);
    });
}

async function deleteCategory(id) {
    await fetch(`/categories/${id}`, {method: "DELETE"});
    loadCategoryList();
    loadCategories();
}

// --- Recurring
async function loadRecurring() {
    const response = await fetch("/recurring"); 
    const data = await response.json(); 

    const container = document.getElementById("recurring-list"); 
    container.innerHTML = ""; 

    data.forEach(r => {
        const row = document.createElement("div");
        row.className = "budget-row";
        row.innerHTML = `
            <div>
                <div class="budget-info">${r.description || r.category}</div>
                <div class="budget-nums">${r.amount} € — monatlich ab ${r.next_due}</div>
            </div>
            <button class="delete-btn" onclick="deleteRecurring(${r.id})">✕</button>
        `;
        container.appendChild(row);
    });
}

async function deleteRecurring(id) {
    await fetch(`/recurring/${id}`, {method: "DELETE"}); 
    loadRecurring(); 
}

// --- Show Page 
function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById(page).style.display = "block";
    
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");
}

// --- Dark Mode
function toggleDark() {
    document.body.classList.toggle("dark");
    const btn = document.getElementById("dark-toggle");
    btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    localStorage.setItem("dark", document.body.classList.contains("dark"));
}

// Dark Mode beim Start wiederherstellen
if (localStorage.getItem("dark") === "true") {
    document.body.classList.add("dark");
    document.getElementById("dark-toggle").textContent = "☀️";
}

// --- Event Listener 
document.addEventListener("DOMContentLoaded", () => {

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById("month-filter").value = currentMonth;

    loadTransactions();
    loadBudgetGoals(); 
    loadSummary(); 
    loadBudgetSummary(); 
    loadCategoryChart(); 
    loadCategories(); 
    loadCategoryList(); 
    loadYearlyChart(); 

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
            loadYearlyChart(); 

        } catch (error) {
            console.error("POST Fehler:", error);
        }
    });
    
    document.getElementById("category-form").addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const formData = new FormData(e.target); 

        const category = {
            name: formData.get("name")
        }; 
        console.info("Category", category)
        if (!category.name) {
            document.getElementById("category-error").style.display = "block"; 
            return; 
        }
        document.getElementById("category-error").style.display = "none"; 

        try{
            const response = await fetch("/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(category)
            });

            if (!response.ok) {
                if (response.status === 400) {
                    document.getElementById("category-error").textContent = "Kategorie existiert bereits.";
                    document.getElementById("category-error").style.display = "block";
                }
                throw new Error("Fehler beim Speichern");
            }

            // Formular leeren
            e.target.reset();

            document.getElementById("category-list").innerHTML = ""; 
            loadCategories();
            loadCategoryList(); 




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
    document.getElementById("month-filter").addEventListener("change", () => {
        loadTransactions();
    });
    document.getElementById("recurring-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const recurring = {
            amount: parseFloat(formData.get("amount")),
            type: formData.get("type"),
            category: formData.get("category"),
            description: formData.get("description"),
            interval: "monthly",
            next_due: formData.get("next_due")
        };

        if (!recurring.amount || !recurring.category || !recurring.next_due) return;

        await fetch("/recurring", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(recurring)
        });

        e.target.reset();
        loadRecurring();
        loadCategories();
    });
}); 
    
