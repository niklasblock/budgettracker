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

    } catch (error) {
        console.error('Fehler beim Aufrufen:', error)
    }
}

async function deleteTransaction(id) {
    await fetch(`/transactions/${id}`, {method: "DELETE"});
    document.getElementById("transaction-body").innerHTML = "";
    loadTransactions();
}

document.addEventListener("DOMContentLoaded", () => {
    loadTransactions();
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
}); 
    
