require("dotenv").config();

const mysql = require("mysql2");


console.log("HOST:", process.env.DB_HOST);
console.log("PORT:", process.env.DB_PORT);
console.log("USER:", process.env.DB_USER);
console.log("DB:", process.env.DB_NAME);


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
// ENSURE COLUMN EXISTS
// ======================================================

const ensureColumn = (
    table,
    column,
    definition
) => {

    connection.query(
        `SHOW COLUMNS FROM ${table} LIKE ?`,
        [column],
        (err, result) => {

            if (err) {

                console.error(
                    `Unable to check ${column}:`,
                    err
                );

                return;
            }


            if (result.length > 0) {

                console.log(
                    `${table}.${column} ready.`
                );

                return;
            }


            connection.query(
                `
                    ALTER TABLE ${table}
                    ADD COLUMN ${column} ${definition}
                `,
                (alterErr) => {

                    if (alterErr) {

                        console.error(
                            `Unable to add ${column}:`,
                            alterErr
                        );

                        return;
                    }


                    console.log(
                        `${table}.${column} created.`
                    );

                }
            );

        }
    );

};


// ======================================================
// INITIALIZE TABLES
// ======================================================

const initializeTables = () => {

    const requestTable = `

        CREATE TABLE IF NOT EXISTS pending_donations (

            id INT AUTO_INCREMENT PRIMARY KEY,

            full_name VARCHAR(255) NOT NULL,

            phone VARCHAR(50) NOT NULL,

            trx_id VARCHAR(120) NOT NULL UNIQUE,

            amount DECIMAL(12, 2) NOT NULL,

            transaction_date DATE NOT NULL,

            transaction_time TIME NOT NULL,

            status ENUM(
                'pending',
                'accepted',
                'rejected'
            ) NOT NULL DEFAULT 'pending',

            decision_at DATETIME NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )

    `;


    connection.query(
        requestTable,
        (err) => {

            if (err) {

                console.error(
                    "Donation requests table error:",
                    err
                );

                return;
            }


            console.log(
                "Donation requests table ready."
            );


            // Existing table migration

            ensureColumn(
                "pending_donations",
                "status",
                `
                    ENUM(
                        'pending',
                        'accepted',
                        'rejected'
                    )
                    NOT NULL
                    DEFAULT 'pending'
                    AFTER transaction_time
                `
            );


            ensureColumn(
                "pending_donations",
                "decision_at",
                `
                    DATETIME NULL
                    AFTER status
                `
            );

        }
    );

};


// ======================================================
// CONNECT
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


    initializeTables();

});


module.exports = connection;