require("dotenv").config();

const mysql = require("mysql2");

// ======================================================
// CREATE MYSQL CONNECTION
// ======================================================

const connection = mysql.createConnection({

    host: process.env.DB_HOST,

    port: process.env.DB_PORT,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    ssl: {
        rejectUnauthorized: false
    }

});


// ======================================================
// CREATE REQUIRED TABLES
// ======================================================

const initializeTables = () => {

    const pendingDonationsTable = `

        CREATE TABLE IF NOT EXISTS pending_donations (

            id INT AUTO_INCREMENT PRIMARY KEY,

            full_name VARCHAR(255) NOT NULL,

            phone VARCHAR(50) NOT NULL,

            trx_id VARCHAR(120) NOT NULL UNIQUE,

            amount DECIMAL(12, 2) NOT NULL,

            transaction_date DATE NOT NULL,

            transaction_time TIME NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )

    `;


    connection.query(
        pendingDonationsTable,
        (err) => {

            if (err) {

                console.error(
                    "Pending donations table creation failed:"
                );

                console.error(err);

                return;

            }


            console.log(
                "Pending donations table ready."
            );

        }
    );

};


// ======================================================
// CONNECT TO AIVEN MYSQL
// ======================================================

connection.connect((err) => {

    if (err) {

        console.error(
            "Database Connection Failed"
        );

        console.error(err);

        return;

    }


    console.log(
        "Connected to Aiven MySQL"
    );


    // Create any missing tables
    initializeTables();

});


module.exports = connection;