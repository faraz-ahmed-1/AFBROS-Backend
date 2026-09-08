require("dotenv").config();

const mysql =
    require("mysql2");


// ======================================================
// DATABASE CONNECTION
// ======================================================

const db =
    mysql.createConnection({

        host:
            process.env.DB_HOST,

        port:
            process.env.DB_PORT,

        user:
            process.env.DB_USER,

        password:
            process.env.DB_PASSWORD,

        database:
            process.env.DB_NAME,

        ssl: {
            rejectUnauthorized:
                false
        }

    });


// ======================================================
// QUERY PROMISE
// ======================================================

const queryAsync = (
    sql,
    params = []
) => {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            db.query(
                sql,
                params,
                (
                    err,
                    result
                ) => {

                    if (err) {

                        reject(err);

                        return;

                    }


                    resolve(result);

                }
            );

        }
    );

};


// ======================================================
// CHECK COLUMN
// ======================================================

const columnExists =
    async (
        tableName,
        columnName
    ) => {

        const rows =
            await queryAsync(
                `
                    SHOW COLUMNS
                    FROM \`${tableName}\`
                    LIKE ?
                `,
                [
                    columnName
                ]
            );


        return (
            rows.length >
            0
        );

    };


// ======================================================
// ENSURE COLUMN
// ======================================================

const ensureColumn =
    async (
        tableName,
        columnName,
        definition
    ) => {

        const exists =
            await columnExists(
                tableName,
                columnName
            );


        if (exists) {

            return;

        }


        await queryAsync(
            `
                ALTER TABLE \`${tableName}\`
                ADD COLUMN \`${columnName}\`
                ${definition}
            `
        );


        console.log(
            `Created ${tableName}.${columnName}`
        );

    };


// ======================================================
// INITIALIZE TABLES
// ======================================================

const initializeTables =
    async () => {

        // ==================================================
        // DONATION REQUEST HISTORY
        // ==================================================

        await queryAsync(
            `

                CREATE TABLE IF NOT EXISTS pending_donations
                (
                    id INT AUTO_INCREMENT PRIMARY KEY,

                    full_name VARCHAR(255) NOT NULL,

                    phone VARCHAR(50) NOT NULL,

                    email VARCHAR(255) NULL,

                    account_title VARCHAR(255) NULL,

                    trx_id VARCHAR(120) NULL,

                    amount DECIMAL(12, 2) NOT NULL,

                    transaction_date DATE NOT NULL,

                    transaction_time TIME NULL,

                    status ENUM(
                        'pending',
                        'accepted',
                        'rejected'
                    )
                    NOT NULL
                    DEFAULT 'pending',

                    decision_at DATETIME NULL,

                    created_at TIMESTAMP
                        DEFAULT CURRENT_TIMESTAMP
                )

            `
        );


        // ==================================================
        // MIGRATE EXISTING REQUEST TABLE
        // ==================================================

        await ensureColumn(
            "pending_donations",
            "email",
            "VARCHAR(255) NULL AFTER phone"
        );


        await ensureColumn(
            "pending_donations",
            "account_title",
            "VARCHAR(255) NULL AFTER email"
        );


        await ensureColumn(
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
            `
        );


        await ensureColumn(
            "pending_donations",
            "decision_at",
            "DATETIME NULL"
        );


        /*
            Old request form required these.
            New request form doesn't.

            Keep columns only for compatibility
            with old request history.
        */

        if (
            await columnExists(
                "pending_donations",
                "trx_id"
            )
        ) {

            await queryAsync(
                `
                    ALTER TABLE pending_donations

                    MODIFY COLUMN trx_id
                        VARCHAR(120)
                        NULL
                `
            );

        }


        if (
            await columnExists(
                "pending_donations",
                "transaction_time"
            )
        ) {

            await queryAsync(
                `
                    ALTER TABLE pending_donations

                    MODIFY COLUMN transaction_time
                        TIME
                        NULL
                `
            );

        }


        // ==================================================
        // DONOR PROFILE
        //
        // Email stays OUTSIDE donations table.
        // ==================================================

        await queryAsync(
            `

                CREATE TABLE IF NOT EXISTS donor_profiles
                (
                    id INT AUTO_INCREMENT PRIMARY KEY,

                    full_name VARCHAR(255) NOT NULL,

                    phone VARCHAR(50) NOT NULL,

                    email VARCHAR(255) NOT NULL,

                    created_at TIMESTAMP
                        DEFAULT CURRENT_TIMESTAMP,

                    updated_at TIMESTAMP
                        DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,

                    UNIQUE KEY uq_donor_phone (
                        phone
                    ),

                    UNIQUE KEY uq_donor_email (
                        email
                    )
                )

            `
        );


        // ==================================================
        // DONOR UPDATE OTP
        // ==================================================

        await queryAsync(
            `

                CREATE TABLE IF NOT EXISTS donor_update_otps
                (
                    id INT AUTO_INCREMENT PRIMARY KEY,

                    donor_id INT NOT NULL,

                    new_full_name VARCHAR(255) NULL,

                    new_phone VARCHAR(50) NULL,

                    new_email VARCHAR(255) NULL,

                    otp_hash VARCHAR(64) NOT NULL,

                    attempts INT
                        NOT NULL
                        DEFAULT 0,

                    expires_at DATETIME NOT NULL,

                    verified_at DATETIME NULL,

                    created_at TIMESTAMP
                        DEFAULT CURRENT_TIMESTAMP,

                    CONSTRAINT fk_donor_update_otp
                        FOREIGN KEY (
                            donor_id
                        )
                        REFERENCES donor_profiles(id)
                        ON DELETE CASCADE
                )

            `
        );


        await ensureColumn(
            "donor_update_otps",
            "attempts",
            `
                INT
                NOT NULL
                DEFAULT 0
                AFTER otp_hash
            `
        );


        console.log(
            "AFBROS database tables ready."
        );

    };


// ======================================================
// CONNECT
// ======================================================

db.connect(
    async (
        err
    ) => {

        if (err) {

            console.error(
                "Database Connection Failed:",
                err
            );

            return;

        }


        console.log(
            "Connected to Aiven MySQL"
        );


        try {

            await initializeTables();

        } catch (
            initError
        ) {

            console.error(
                "DATABASE INITIALIZATION ERROR:",
                initError
            );

        }

    }
);


module.exports =
    db;