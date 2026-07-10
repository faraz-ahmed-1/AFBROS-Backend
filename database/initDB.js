const db = require("../config/db");

const createTables = () => {

    const donationTable = `
        CREATE TABLE IF NOT EXISTS donations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            donation_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const expenseTable = `
        CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            description TEXT,
            expense_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(donationTable, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Donations table ready");
        }
    });

    db.query(expenseTable, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Expenses table ready");
        }
    });

};

module.exports = createTables;