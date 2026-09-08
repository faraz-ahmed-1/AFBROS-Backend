const db = require("../config/db");


// ======================================================
// HELPERS
// ======================================================

const validAmount = (value) => {

    const number =
        Number(value);

    return (
        Number.isFinite(number) &&
        number > 0
    );

};


// ======================================================
// ADD DONATION - MANAGER
// ======================================================

const addDonation = (req, res) => {

    const {
        fullName,
        phone,
        amount,
        date
    } = req.body;


    if (
        !fullName?.trim() ||
        !phone?.trim() ||
        !amount ||
        !date
    ) {

        return res.status(400).json({
            message:
                "Please fill in all donation fields."
        });

    }


    if (!validAmount(amount)) {

        return res.status(400).json({
            message:
                "Donation amount must be greater than zero."
        });

    }


    const sql = `

        INSERT INTO donations
        (
            full_name,
            phone,
            amount,
            donation_date
        )

        VALUES (?, ?, ?, ?)

    `;


    db.query(
        sql,
        [
            fullName.trim(),
            phone.trim(),
            Number(amount),
            date
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "ADD DONATION ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to add donation."
                });

            }


            return res.status(201).json({

                success: true,

                message:
                    "Donation added successfully.",

                id:
                    result.insertId

            });

        }
    );

};


// ======================================================
// GET DONATIONS
// PUBLIC / GUEST
// ======================================================

const getDonations = (req, res) => {

    const search =
        req.query.search?.trim() || "";

    const sort =
        req.query.sort || "id";


    const sortOptions = {

        id:
            "id ASC",

        amountAsc:
            "amount ASC",

        amountDesc:
            "amount DESC",

        dateNewest:
            "donation_date DESC, id DESC",

        dateOldest:
            "donation_date ASC, id ASC"

    };


    const orderBy =
        sortOptions[sort] ||
        sortOptions.id;


    const value =
        `%${search}%`;


    const sql = `

        SELECT
            id,
            full_name,
            phone,
            amount,
            donation_date

        FROM donations

        WHERE
            full_name LIKE ?
            OR phone LIKE ?
            OR CAST(amount AS CHAR) LIKE ?

        ORDER BY ${orderBy}

    `;


    db.query(
        sql,
        [
            value,
            value,
            value
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "GET DONATIONS ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to load donations."
                });

            }


            return res.status(200).json(
                result
            );

        }
    );

};


// ======================================================
// UPDATE DONATION
// ======================================================

const updateDonation = (req, res) => {

    const id =
        Number(req.params.id);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return res.status(400).json({
            message:
                "Invalid donation ID."
        });

    }


    const {
        fullName,
        phone,
        amount,
        date
    } = req.body;


    if (
        !fullName?.trim() ||
        !phone?.trim() ||
        !amount ||
        !date
    ) {

        return res.status(400).json({
            message:
                "Please fill in all donation fields."
        });

    }


    if (!validAmount(amount)) {

        return res.status(400).json({
            message:
                "Donation amount must be greater than zero."
        });

    }


    const sql = `

        UPDATE donations

        SET
            full_name = ?,
            phone = ?,
            amount = ?,
            donation_date = ?

        WHERE id = ?

    `;


    db.query(
        sql,
        [
            fullName.trim(),
            phone.trim(),
            Number(amount),
            date,
            id
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "UPDATE DONATION ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to update donation."
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    message:
                        "Donation not found."
                });

            }


            return res.json({

                success: true,

                message:
                    "Donation updated successfully."

            });

        }
    );

};


// ======================================================
// DELETE DONATION
// ======================================================

const deleteDonation = (req, res) => {

    const id =
        Number(req.params.id);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return res.status(400).json({
            message:
                "Invalid donation ID."
        });

    }


    db.query(
        `
            DELETE FROM donations
            WHERE id = ?
        `,
        [id],
        (err, result) => {

            if (err) {

                console.error(
                    "DELETE DONATION ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to delete donation."
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    message:
                        "Donation not found."
                });

            }


            return res.json({

                success: true,

                message:
                    "Donation deleted successfully."

            });

        }
    );

};


// ======================================================
// SUBMIT DONATION REQUEST
// ======================================================

const submitDonationRequest = (
    req,
    res
) => {

    const {
        fullName,
        phone,
        trxId,
        amount,
        transactionDate,
        transactionTime
    } = req.body;


    if (
        !fullName?.trim() ||
        !phone?.trim() ||
        !trxId?.trim() ||
        !amount ||
        !transactionDate ||
        !transactionTime
    ) {

        return res.status(400).json({
            message:
                "Please complete all transaction details."
        });

    }


    if (!validAmount(amount)) {

        return res.status(400).json({
            message:
                "Donation amount must be greater than zero."
        });

    }


    const sql = `

        INSERT INTO pending_donations
        (
            full_name,
            phone,
            trx_id,
            amount,
            transaction_date,
            transaction_time,
            status
        )

        VALUES (?, ?, ?, ?, ?, ?, 'pending')

    `;


    db.query(
        sql,
        [
            fullName.trim(),
            phone.trim(),
            trxId.trim(),
            Number(amount),
            transactionDate,
            transactionTime
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "SUBMIT REQUEST ERROR:",
                    err
                );


                if (
                    err.code ===
                    "ER_DUP_ENTRY"
                ) {

                    return res.status(409).json({
                        message:
                            "This transaction ID has already been submitted."
                    });

                }


                return res.status(500).json({
                    message:
                        "Unable to submit donation request."
                });

            }


            return res.status(201).json({

                success: true,

                message:
                    "Donation submitted for verification.",

                id:
                    result.insertId

            });

        }
    );

};


// ======================================================
// GET ALL REQUESTS
// MANAGER
// ======================================================

const getDonationRequests = (
    req,
    res
) => {

    const sql = `

        SELECT
            id,
            full_name,
            phone,
            trx_id,
            amount,
            transaction_date,
            transaction_time,
            status,
            decision_at,
            created_at

        FROM pending_donations

        ORDER BY

            CASE
                WHEN status = 'pending'
                THEN 0
                ELSE 1
            END,

            created_at DESC

    `;


    db.query(
        sql,
        (err, result) => {

            if (err) {

                console.error(
                    "GET REQUESTS ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to load donation requests."
                });

            }


            return res.json(
                result
            );

        }
    );

};


// ======================================================
// PENDING REQUEST COUNT
// ======================================================

const getPendingRequestCount = (
    req,
    res
) => {

    db.query(
        `

            SELECT COUNT(*) AS count

            FROM pending_donations

            WHERE status = 'pending'

        `,
        (err, result) => {

            if (err) {

                console.error(
                    "REQUEST COUNT ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to load request count."
                });

            }


            return res.json({

                count:
                    Number(
                        result[0]?.count ||
                        0
                    )

            });

        }
    );

};


// ======================================================
// ACCEPT REQUEST
// ======================================================

const approveDonationRequest = (
    req,
    res
) => {

    const id =
        Number(req.params.id);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return res.status(400).json({
            message:
                "Invalid donation request ID."
        });

    }


    db.beginTransaction(
        (transactionErr) => {

            if (transactionErr) {

                return res.status(500).json({
                    message:
                        "Unable to start approval."
                });

            }


            db.query(
                `

                    SELECT *

                    FROM pending_donations

                    WHERE id = ?

                    FOR UPDATE

                `,
                [id],
                (selectErr, rows) => {

                    if (selectErr) {

                        return db.rollback(
                            () => {

                                console.error(
                                    selectErr
                                );

                                res.status(500).json({
                                    message:
                                        "Unable to read donation request."
                                });

                            }
                        );

                    }


                    if (
                        !rows.length
                    ) {

                        return db.rollback(
                            () => {

                                res.status(404).json({
                                    message:
                                        "Donation request not found."
                                });

                            }
                        );

                    }


                    const request =
                        rows[0];


                    if (
                        request.status !==
                        "pending"
                    ) {

                        return db.rollback(
                            () => {

                                res.status(409).json({
                                    message:
                                        `This request is already ${request.status}.`
                                });

                            }
                        );

                    }


                    // ONLY EXISTING DONATION COLUMNS

                    db.query(
                        `

                            INSERT INTO donations
                            (
                                full_name,
                                phone,
                                amount,
                                donation_date
                            )

                            VALUES (?, ?, ?, ?)

                        `,
                        [
                            request.full_name,
                            request.phone,
                            request.amount,
                            request.transaction_date
                        ],
                        (insertErr) => {

                            if (insertErr) {

                                return db.rollback(
                                    () => {

                                        console.error(
                                            insertErr
                                        );

                                        res.status(500).json({
                                            message:
                                                "Unable to add approved donation."
                                        });

                                    }
                                );

                            }


                            db.query(
                                `

                                    UPDATE pending_donations

                                    SET
                                        status = 'accepted',
                                        decision_at = NOW()

                                    WHERE id = ?

                                `,
                                [id],
                                (updateErr) => {

                                    if (updateErr) {

                                        return db.rollback(
                                            () => {

                                                console.error(
                                                    updateErr
                                                );

                                                res.status(500).json({
                                                    message:
                                                        "Unable to complete approval."
                                                });

                                            }
                                        );

                                    }


                                    db.commit(
                                        (commitErr) => {

                                            if (commitErr) {

                                                return db.rollback(
                                                    () => {

                                                        res.status(500).json({
                                                            message:
                                                                "Unable to complete approval."
                                                        });

                                                    }
                                                );

                                            }


                                            return res.json({

                                                success: true,

                                                message:
                                                    "Donation request accepted."

                                            });

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};


// ======================================================
// REJECT REQUEST
// ======================================================

const rejectDonationRequest = (
    req,
    res
) => {

    const id =
        Number(req.params.id);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return res.status(400).json({
            message:
                "Invalid donation request ID."
        });

    }


    db.query(
        `

            UPDATE pending_donations

            SET
                status = 'rejected',
                decision_at = NOW()

            WHERE
                id = ?
                AND status = 'pending'

        `,
        [id],
        (err, result) => {

            if (err) {

                console.error(
                    "REJECT REQUEST ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to reject request."
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(409).json({
                    message:
                        "Request was not found or has already been processed."
                });

            }


            return res.json({

                success: true,

                message:
                    "Donation request rejected."

            });

        }
    );

};


module.exports = {

    addDonation,

    getDonations,

    updateDonation,

    deleteDonation,

    submitDonationRequest,

    getDonationRequests,

    getPendingRequestCount,

    approveDonationRequest,

    rejectDonationRequest
};