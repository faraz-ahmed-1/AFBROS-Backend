const bcrypt = require("bcrypt");
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

const userTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role ENUM('admin','staff') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

db.query(userTable, async (err) => {

    if (err) {
        console.log(err);
        return;
    }

    console.log("Users table ready");

    // Check if admin already exists
    db.query(
        "SELECT * FROM users WHERE username = ?",
        ["ghani-afbros"],
        async (err, result) => {

            if (err) {
                console.log(err);
                return;
            }

            if (result.length > 0) {
                console.log("Default admin already exists");
                return;
            }

            const hashedPassword = await bcrypt.hash("afbros", 10);

            db.query(
                `INSERT INTO users
                (username, password, full_name, role)
                VALUES (?, ?, ?, ?)`,
                [
                    "ghani-afbros",
                    hashedPassword,
                    "Administrator",
                    "admin"
                ],
                (err) => {

                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Default admin created");
                    }

                }
            );

        }
    );

});

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