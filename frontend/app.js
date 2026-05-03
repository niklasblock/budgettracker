// --- TRANSACTIONS 
async function loadTransactions(){
    try {
        const month = document.getElementById("month-select").value;
        const year = document.getElementById("year-select").value;
        const response = await fetch(`/transactions?month=${year}-${month}`);
        const data = await response.json(); 
        
        const tbody = document.getElementById("transaction-body");
        tbody.innerHTML = "";
        data.forEach(transaction => {
            const row = document.createElement("tr"); 
            const badgeClass = transaction.type === "income" ? "badge-income" : "badge-expense";
            const badgeLabel = transaction.type === "income" ? "Einnahme" : "Ausgabe";
            const statusBtn = transaction.status === "planned" 
                ? `<button class="status-btn planned" onclick="toggleStatus(${transaction.id})">geplant</button>`
                : `<button class="status-btn paid" onclick="toggleStatus(${transaction.id})">✓</button>`;
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.category}</td>
                <td style="color:#666">${transaction.description || "—"}</td>
                <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                <td>${transaction.amount} €</td>
                <td>${statusBtn}</td>
                <td><button class="delete-btn" onclick="editTransaction(${transaction.id}, ${transaction.amount}, '${transaction.type}', '${transaction.category}', '${transaction.description || ""}', '${transaction.date}', '${transaction.status}')">✎</button></td>
                <td><button class="delete-btn" onclick="deleteTransaction(${transaction.id})">✕</button></td>
            `;
            tbody.appendChild(row);
        });
        loadSummary(); 
        loadCategoryChart();
        loadYearlyChart(); 
        loadBudgetSummary();
    } catch (error) {
        console.error('Fehler beim Aufrufen:', error);
    }
}

async function toggleStatus(id) {
    await fetch(`/transactions/${id}/status`, {method: "PATCH"});
    loadTransactions();
}

let editingId = null;

function editTransaction(id, amount, type, category, description, date, status) {
    editingId = id;
    document.getElementById("edit-amount").value = amount;
    document.getElementById("edit-type").value = type;
    document.getElementById("edit-category").value = category;
    document.getElementById("edit-description").value = description;
    document.getElementById("edit-date").value = date;
    
    // Kategorien im Edit-Dropdown laden
    const select = document.getElementById("edit-category");
    select.value = category;
    
    document.getElementById("edit-modal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
    editingId = null;
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

    document.getElementById("summary-income").textContent = data.income.toFixed(2) + " €";
    document.getElementById("summary-expenses").textContent = data.expenses.toFixed(2) + " €";
    document.getElementById("summary-balance").textContent = data.balance.toFixed(2) + " €";
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
            const typeLabel = goal.goal_type === "target" ? "Ziel" : "Limit";
            row.innerHTML = `
                <div>
                    <div class="budget-info">${goal.category}</div>
                    <div class="budget-nums">${typeLabel}: ${goal.limit} €</div>
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

        const limits = data.filter(d => d.goal_type !== "target");
        const targets = data.filter(d => d.goal_type === "target");

        if (limits.length > 0) {
            container.innerHTML += `<div style="font-size:11px; font-weight:500; color:#666; margin-bottom:8px;">LIMITS</div>`;
            limits.forEach(item => renderBudgetRow(item, container));
        }

        if (targets.length > 0) {
            container.innerHTML += `<div style="font-size:11px; font-weight:500; color:#666; margin-top:12px; margin-bottom:8px;">ZIELE</div>`;
            targets.forEach(item => renderBudgetRow(item, container));
        }

    } catch (error) {
        console.error('Fehler beim Aufrufen:', error);
    }
}

function renderBudgetRow(item, container) {
    const percent = item.limit > 0 ? Math.min((item.spent / item.limit) * 100, 100) : 0;
    const fillClass = item.goal_type === "target"
        ? (percent >= 100 ? "progress-ok" : percent >= 50 ? "progress-warn" : "progress-over")
        : (percent >= 100 ? "progress-over" : percent >= 80 ? "progress-warn" : "progress-ok");
    const label = item.goal_type === "target"
        ? `erreicht: ${item.spent.toFixed(2)} € / Ziel: ${item.limit} €`
        : `${item.spent.toFixed(2)} € / ${item.limit} €`;

    const row = document.createElement("div");
    row.className = "budget-row";
    row.innerHTML = `
        <div style="flex:1">
            <div style="display:flex; justify-content:space-between;">
                <div class="budget-info">${item.category}</div>
                <div class="budget-nums">${label}</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${fillClass}" style="width:${percent}%"></div>
            </div>
        </div>
    `;
    container.appendChild(row);
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

    const selects = ["category", "bg-category", "rec-category", "edit-category"];
    
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
                <div class="budget-info">${r.description || "—"}</div>
                <div class="budget-nums">${r.category} · ${r.amount} € — monatlich ab ${r.next_due}</div>
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
function showPage(page, btn = null) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById(page).style.display = "block";
    
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    if (btn) {
        btn.classList.add("active");
    } else if (event && event.target) {
        event.target.classList.add("active");
    }
}

// --- Dark Mode
function toggleDark() {
    document.documentElement.classList.toggle("dark");
    const btn = document.getElementById("dark-toggle");
    btn.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
    localStorage.setItem("dark", document.documentElement.classList.contains("dark"));
}

// Dark Mode beim Start wiederherstellen
if (localStorage.getItem("dark") === "true") {
    document.documentElement.classList.add("dark");
    document.getElementById("dark-toggle").textContent = "☀️";
}

// --- Event Listener 
document.addEventListener("DOMContentLoaded", () => {

    const monthSelect = document.getElementById("month-select");
    const yearSelect = document.getElementById("year-select");

    const months = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];

    months.forEach((m, i) => {
        const option = document.createElement("option");
        option.value = String(i + 1).padStart(2, "0");
        option.textContent = m;
        monthSelect.appendChild(option);
    });

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 3; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    // Aktuellen Monat und Jahr setzen
    const now = new Date();
    monthSelect.value = String(now.getMonth() + 1).padStart(2, "0");
    yearSelect.value = now.getFullYear();

    // Event Listener
    monthSelect.addEventListener("change", loadTransactions);
    yearSelect.addEventListener("change", loadTransactions);

    loadTransactions();
    loadBudgetGoals(); 
    loadSummary(); 
    loadBudgetSummary(); 
    loadCategoryChart(); 
    loadCategories(); 
    loadCategoryList(); 
    loadYearlyChart(); 
    loadRecurring(); 

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

        if (!transaction.amount || !transaction.category || !transaction.date || !transaction.type) {
            document.getElementById("transaction-error").style.display = "block";
            return;
        }
        document.getElementById("transaction-error").style.display = "none";

        try {
            if (editingId) {
                // PUT
                await fetch(`/transactions/${editingId}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({...transaction, status: "paid"})
                });
                editingId = null;
                document.querySelector("#transaction-form button[type='submit']").textContent = "Hinzufügen";
            } else {
                // POST
                const response = await fetch("/transactions", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(transaction)
                });
                if (!response.ok) throw new Error("Fehler beim Speichern");
            }

            e.target.reset();
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
            limit: parseFloat(formData.get("limit")),
            goal_type: formData.get("goal_type")  
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
            loadBudgetSummary(); 

        } catch (error) {
            console.error("POST Fehler:", error);
        }
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
    document.getElementById("edit-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const transaction = {
            amount: parseFloat(formData.get("amount")),
            type: formData.get("type"),
            category: formData.get("category"),
            description: formData.get("description"),
            date: formData.get("date"),
            status: "paid"
        };

        await fetch(`/transactions/${editingId}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(transaction)
        });

        closeEditModal();
        loadTransactions();
    });
}); 
    
