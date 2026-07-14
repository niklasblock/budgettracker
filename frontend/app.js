// --- TOAST
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 200);
    }, 3000);
}

// --- CONFIRM
let confirmCallback = null;

function showConfirm(message, onConfirm) {
    document.getElementById("confirm-message").textContent = message;
    document.getElementById("confirm-modal").classList.add("open");
    confirmCallback = onConfirm;
    document.getElementById("confirm-ok").onclick = () => {
        closeConfirm();
        onConfirm();
    };
}

function closeConfirm() {
    document.getElementById("confirm-modal").classList.remove("open");
    confirmCallback = null;
}

// --- INLINE ERROR
function showInlineError(containerId, message = "Fehler beim Laden. Bitte App neu starten.", isRow = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (isRow) {
        container.innerHTML = `<tr><td colspan="99" class="inline-error">⚠ ${message}</td></tr>`;
    } else {
        container.innerHTML = `<div class="inline-error">⚠ ${message}</div>`;
    }
}

// --- Add Modal
function openAddModal() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("modal-date").value = today;
    document.getElementById("add-modal-error").style.display = "none";
    document.getElementById("add-modal-form").reset();
    document.getElementById("modal-date").value = today;
    document.getElementById("add-modal").classList.add("open");
}

function closeAddModal() {
    document.getElementById("add-modal").classList.remove("open");
}

// --- Settings
async function loadSettings() {
    try {
        const response = await fetch("/settings");
        if (!response.ok) throw new Error();
        const data = await response.json();
        document.getElementById("db-path-current").textContent = data.db_path;
        document.getElementById("db-path").placeholder = data.db_path;
    } catch {
        showToast("Einstellungen konnten nicht geladen werden.", "error");
    }
}

async function saveSettings() {
    const dbPath = document.getElementById("db-path").value.trim();
    if (!dbPath) { showToast("Bitte einen Pfad eingeben.", "error"); return; }
    try {
        const response = await fetch("/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ db_path: dbPath })
        });
        if (!response.ok) throw new Error();
        document.getElementById("db-path-current").textContent = dbPath;
        document.getElementById("db-path").value = "";
        document.getElementById("db-path").placeholder = dbPath;
        showToast("Gespeichert – App neu starten um den Pfad zu aktivieren.");
    } catch {
        showToast("Fehler beim Speichern.", "error");
    }
}

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
        showInlineError("transaction-body", "Transaktionen konnten nicht geladen werden.", true);
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
    showConfirm("Transaktion wirklich löschen?", async () => {
        try {
            const response = await fetch(`/transactions/${id}`, {method: "DELETE"});
            if (!response.ok) throw new Error();
            showToast("Transaktion gelöscht");
            loadTransactions();
            loadSummary();
            loadCategoryChart();
            loadYearlyChart();
        } catch {
            showToast("Fehler beim Löschen", "error");
        }
    });
}

async function loadSummary() {
    const month = getCurrentMonth(); 
    const response = await fetch(`/transactions/summary?month=${month}`);
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
        showInlineError("budget-goal-body");
    }
}

async function deleteBudgetGoals(id) {
    showConfirm("Budget-Ziel wirklich löschen?", async () => {
        try {
            const response = await fetch(`/budget_goal/${id}`, {method: "DELETE"});
            if (!response.ok) throw new Error();
            showToast("Budget-Ziel gelöscht");
            loadBudgetGoals();
            loadBudgetSummary();
        } catch {
            showToast("Fehler beim Löschen", "error");
        }
    });
}

async function loadBudgetSummary() {
    try {
        const month = getCurrentMonth();
        const response = await fetch(`/budget_goal/summary?month=${month}`);
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
        showInlineError("budget-summary-body");
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
    const month = getCurrentMonth(); 
    const response = await fetch(`/transactions/by-category?month=${month}`);
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
    try {
        const response = await fetch("/categories");
        if (!response.ok) throw new Error();
        const data = await response.json();

        const selects = ["category", "bg-category", "rec-category", "edit-category", "modal-category"];
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
    } catch {
        showToast("Kategorien konnten nicht geladen werden.", "error");
    }
}

async function loadCategoryList() {
    try {
        const response = await fetch("/categories");
        if (!response.ok) throw new Error();
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
    } catch {
        showInlineError("category-list");
    }
}

async function deleteCategory(id) {
    showConfirm("Kategorie wirklich löschen?", async () => {
        try {
            const response = await fetch(`/categories/${id}`, {method: "DELETE"});
            if (!response.ok) throw new Error();
            showToast("Kategorie gelöscht");
            loadCategoryList();
            loadCategories();
        } catch {
            showToast("Fehler beim Löschen", "error");
        }
    });
}

let allUpcomingRecurring = [];

async function loadUpcomingRecurring() {
    try {
        const response = await fetch("/recurring/upcoming");
        allUpcomingRecurring = await response.json();

        const container = document.getElementById("upcoming-recurring-body");
        container.innerHTML = "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const inWindow = allUpcomingRecurring.filter(r => r.in_window);

        if (inWindow.length === 0) {
            container.innerHTML = `<p style="font-size:13px; color:#666;">Keine Daueraufträge in diesem Zeitraum.</p>`;
            return;
        }

        const table = document.createElement("table");
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Fällig</th>
                    <th>Beschreibung</th>
                    <th>Kategorie</th>
                    <th>Intervall</th>
                    <th>Typ</th>
                    <th>Betrag</th>
                </tr>
            </thead>
        `;
        const tbody = document.createElement("tbody");

        inWindow.forEach(r => {
            const dueDate = new Date(r.next_due);
            const isPast = dueDate < today;
            const badgeClass = r.type === "income" ? "badge-income" : "badge-expense";
            const badgeLabel = r.type === "income" ? "Einnahme" : "Ausgabe";
            const dateStyle = isPast ? "color:#a32d2d;" : "";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td style="${dateStyle}">${r.next_due}</td>
                <td style="color:#666">${r.description || "—"}</td>
                <td>${r.category}</td>
                <td style="color:#888; font-size:12px;">${INTERVAL_LABELS[r.interval] || r.interval}</td>
                <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                <td>${r.amount.toFixed(2)} €</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);

        // Gesamt-Summe
        const totalExpenses = inWindow
            .filter(r => r.type === "expense")
            .reduce((sum, r) => sum + r.amount, 0);
        const totalIncome = inWindow
            .filter(r => r.type === "income")
            .reduce((sum, r) => sum + r.amount, 0);

        const summary = document.createElement("div");
        summary.style = "display:flex; gap:1.5rem; margin-top:1rem; padding-top:0.75rem; border-top:0.5px solid #e0e0e0; font-size:13px;";
        summary.innerHTML = `
            <span>Gesamt Ausgaben: <strong style="color:#a32d2d;">${totalExpenses.toFixed(2)} €</strong></span>
            ${totalIncome > 0 ? `<span>Gesamt Einnahmen: <strong style="color:#3b6d11;">${totalIncome.toFixed(2)} €</strong></span>` : ""}
        `;
        container.appendChild(summary);
    } catch (error) {
        console.error("Fehler beim Laden der Daueraufträge:", error);
        showInlineError("upcoming-recurring-body");
    }
}
function filterRecurring(interval, btn) {
    document.querySelectorAll("#recurring-filter-tabs .filter-tab").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    renderRecurringList(interval);
}

const INTERVAL_LABELS = {
    weekly: "Wöchentlich",
    monthly: "Monatlich",
    quarterly: "Quartalsweise",
    yearly: "Jährlich"
};

let allRecurring = [];

async function loadRecurring() {
    try {
        const response = await fetch("/recurring"); 
        if (!response.ok) throw new Error();
        allRecurring = await response.json(); 
        renderRecurringList("all");
    } catch {
        showInlineError("recurring-list");
    }
}

function renderRecurringList(interval) {
    const container = document.getElementById("recurring-list"); 
    container.innerHTML = ""; 

    const filtered = interval === "all"
        ? allRecurring
        : allRecurring.filter(r => r.interval === interval);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="font-size:13px; color:#666; margin-top:8px;">Keine Daueraufträge gefunden.</p>`;
        return;
    }

    filtered.forEach(r => {
        const row = document.createElement("div");
        row.className = "budget-row";
        row.innerHTML = `
            <div>
                <div class="budget-info">${r.description || "—"}</div>
                <div class="budget-nums">${r.category} · ${r.amount} € · ${INTERVAL_LABELS[r.interval] || r.interval} · nächste Ausführung: ${r.next_due}</div>
            </div>
            <button class="delete-btn" onclick="deleteRecurring(${r.id})">✕</button>
        `;
        container.appendChild(row);
    });
}

async function deleteRecurring(id) {
    showConfirm("Dauerauftrag wirklich löschen?", async () => {
        try {
            const response = await fetch(`/recurring/${id}`, {method: "DELETE"});
            if (!response.ok) throw new Error();
            showToast("Dauerauftrag gelöscht");
            loadRecurring();
            loadUpcomingRecurring();
        } catch {
            showToast("Fehler beim Löschen", "error");
        }
    });
}

// --- Show Page 
const PAGE_TITLES = {
    dashboard: { title: "Dashboard", sub: "Übersicht" },
    transaktionen: { title: "Transaktionen", sub: "Einnahmen & Ausgaben" },
    dauerauftraege: { title: "Daueraufträge", sub: "Verwaltung" },
    "budget-ziele": { title: "Budget-Ziele", sub: "Verwaltung" },
    kategorien: { title: "Kategorien", sub: "Verwaltung" },
    einstellungen: { title: "Einstellungen", sub: "App-Konfiguration" },
};

function showPage(page, btn = null) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const target = document.getElementById(page);
    if (target) target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    const meta = PAGE_TITLES[page] || { title: page, sub: "" };
    document.getElementById("topbar-title").textContent = meta.title;
    document.getElementById("topbar-sub").textContent = meta.sub;

    if (page === "einstellungen") loadSettings();
}

// --- Month state for topbar chip
let currentMonthDate = new Date();

function updateMonthLabel() {
    const months = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    document.getElementById("month-label").textContent =
        `${months[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`;
}

function changeMonth(dir) {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + dir);
    updateMonthLabel();
    // sync selects
    const m = String(currentMonthDate.getMonth() + 1).padStart(2, "0");
    const y = currentMonthDate.getFullYear();
    const ms = document.getElementById("month-select");
    const ys = document.getElementById("year-select");
    if (ms) ms.value = m;
    if (ys) ys.value = y;
    loadTransactions();
    loadSummary();
    loadBudgetSummary();
    loadCategoryChart();
    loadUpcomingRecurring();
}

//Get current Month 
function getCurrentMonth() {
    const m = String(currentMonthDate.getMonth() + 1).padStart(2, "0");
    return `${currentMonthDate.getFullYear()}-${m}`;
}

// --- Dark Mode
function toggleDark() {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("dark", document.documentElement.classList.contains("dark"));
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
    updateMonthLabel();

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
    loadUpcomingRecurring();

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
                showToast("Transaktion hinzugefügt");
            }

            e.target.reset();
            document.getElementById("transaction-body").innerHTML = "";
            loadTransactions();
            loadYearlyChart();

        } catch (error) {
            console.error("POST Fehler:", error);
            showToast("Fehler beim Speichern", "error");
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

            showToast("Kategorie hinzugefügt");
            e.target.reset();
            document.getElementById("category-list").innerHTML = ""; 
            loadCategories();
            loadCategoryList(); 

        } catch (error) {
            console.error("POST Fehler:", error);
            showToast("Fehler beim Speichern", "error");
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

            showToast("Budget-Ziel hinzugefügt");
            e.target.reset();
            document.getElementById("budget-goal-body").innerHTML = "";
            loadBudgetGoals();
            loadBudgetSummary(); 

        } catch (error) {
            console.error("POST Fehler:", error);
            showToast("Fehler beim Speichern", "error");
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
            interval: formData.get("interval"),
            next_due: formData.get("next_due")
        };

        if (!recurring.amount || !recurring.category || !recurring.next_due) return;

        try {
            const response = await fetch("/recurring", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(recurring)
            });
            if (!response.ok) throw new Error();
            showToast("Dauerauftrag hinzugefügt");
            e.target.reset();
            loadRecurring();
            loadUpcomingRecurring();
        } catch {
            showToast("Fehler beim Speichern", "error");
        }
    });
    document.getElementById("add-modal-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transaction = {
            amount: parseFloat(formData.get("amount")),
            type: formData.get("type"),
            category: formData.get("category"),
            description: formData.get("description"),
            date: formData.get("date")
        };
        if (!transaction.amount || !transaction.category || !transaction.date || !transaction.type) {
            document.getElementById("add-modal-error").style.display = "block";
            return;
        }
        document.getElementById("add-modal-error").style.display = "none";
        try {
            const response = await fetch("/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transaction)
            });
            if (!response.ok) throw new Error();
            showToast("Transaktion hinzugefügt");
            closeAddModal();
            loadTransactions();
            loadSummary();
            loadCategoryChart();
            loadYearlyChart();
            loadBudgetSummary();
        } catch {
            showToast("Fehler beim Speichern", "error");
        }
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

        showToast("Transaktion gespeichert");
        closeEditModal();
        loadTransactions();
    });
});