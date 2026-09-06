const db = require("../config/db");


// ======================================================
// HELPERS
// ======================================================

const isValidAmount = (value) => {

    const amount = Number(value);

    return (
        Number.isFinite(amount) &&
        amount > 0
    );

};


// ======================================================
// ADD DONATION - FINANCE MANAGER
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


    if (!isValidAmount(amount)) {

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
// GET DONATIONS - PUBLIC / GUEST
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


    const searchValue =
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
            searchValue,
            searchValue,
            searchValue
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
// UPDATE DONATION - FINANCE MANAGER
// ======================================================

const updateDonation = (req, res) => {

    const donationId =
        Number(req.params.id);


    if (
        !Number.isInteger(donationId) ||
        donationId <= 0
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


    if (!isValidAmount(amount)) {

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
            donationId
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
                        "Donation record not found."
                });

            }


            return res.status(200).json({

                success: true,

                message:
                    "Donation updated successfully."

            });

        }
    );

};


// ======================================================
// DELETE DONATION - FINANCE MANAGER
// ======================================================

const deleteDonation = (req, res) => {

    const donationId =
        Number(req.params.id);


    if (
        !Number.isInteger(donationId) ||
        donationId <= 0
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
        [donationId],
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
                        "Donation record not found."
                });

            }


            return res.status(200).json({

                success: true,

                message:
                    "Donation deleted successfully."

            });

        }
    );

};


// ======================================================
// GUEST SUBMIT DONATION REQUEST
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


    if (!isValidAmount(amount)) {

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
            transaction_time
        )
        VALUES (?, ?, ?, ?, ?, ?)
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
                    "SUBMIT PENDING DONATION ERROR:",
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
                        "Unable to submit donation for verification."
                });

            }


            return res.status(201).json({

                success: true,

                message:
                    "Donation details submitted for verification.",

                id:
                    result.insertId

            });

        }
    );

};


// ======================================================
// GET PENDING DONATIONS - FINANCE MANAGER
// ======================================================

const getPendingDonationRequests = (
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
            created_at
        FROM pending_donations
        ORDER BY created_at DESC
    `;


    db.query(
        sql,
        (err, result) => {

            if (err) {

                console.error(
                    "GET PENDING DONATIONS ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to load pending donations."
                });

            }


            return res.status(200).json(
                result
            );

        }
    );

};


// ======================================================
// APPROVE GUEST DONATION
// ======================================================
//
// IMPORTANT:
// Only existing donation table columns are inserted:
//
// full_name
// phone
// amount
// donation_date
//
// trx_id and transaction_time are NOT inserted.
// ======================================================

const approveDonationRequest = (
    req,
    res
) => {

    const requestId =
        Number(req.params.id);


    if (
        !Number.isInteger(requestId) ||
        requestId <= 0
    ) {

        return res.status(400).json({
            message:
                "Invalid donation request ID."
        });

    }


    const selectSql = `
        SELECT *
        FROM pending_donations
        WHERE id = ?
    `;


    db.query(
        selectSql,
        [requestId],
        (selectErr, rows) => {

            if (selectErr) {

                console.error(
                    "APPROVE SELECT ERROR:",
                    selectErr
                );

                return res.status(500).json({
                    message:
                        "Unable to read donation request."
                });

            }


            if (
                !rows ||
                rows.length === 0
            ) {

                return res.status(404).json({
                    message:
                        "Donation request not found."
                });

            }


            const request =
                rows[0];


            /*
                INSERT ONLY EXISTING
                DONATIONS TABLE COLUMNS
            */

            const insertSql = `
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
                insertSql,
                [
                    request.full_name,
                    request.phone,
                    request.amount,
                    request.transaction_date
                ],
                (
                    insertErr,
                    insertResult
                ) => {

                    if (insertErr) {

                        console.error(
                            "APPROVE INSERT ERROR:",
                            insertErr
                        );

                        return res.status(500).json({
                            message:
                                "Unable to add approved donation."
                        });

                    }


                    /*
                        Only remove pending row
                        after successful donation insert.
                    */

                    db.query(
                        `
                            DELETE FROM pending_donations
                            WHERE id = ?
                        `,
                        [requestId],
                        (
                            deleteErr,
                            deleteResult
                        ) => {

                            if (deleteErr) {

                                console.error(
                                    "APPROVE CLEANUP ERROR:",
                                    deleteErr
                                );

                                /*
                                    Donation is already inserted.
                                    We should report server issue.
                                */

                                return res.status(500).json({
                                    message:
                                        "Donation was approved, but pending request cleanup failed."
                                });

                            }


                            return res.status(200).json({

                                success: true,

                                message:
                                    "Donation approved and added successfully.",

                                donationId:
                                    insertResult.insertId

                            });

                        }
                    );

                }
            );

        }
    );

};


// ======================================================
// REJECT GUEST DONATION
// ======================================================

const rejectDonationRequest = (
    req,
    res
) => {

    const requestId =
        Number(req.params.id);


    if (
        !Number.isInteger(requestId) ||
        requestId <= 0
    ) {

        return res.status(400).json({
            message:
                "Invalid donation request ID."
        });

    }


    db.query(
        `
            DELETE FROM pending_donations
            WHERE id = ?
        `,
        [requestId],
        (err, result) => {

            if (err) {

                console.error(
                    "REJECT DONATION ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Unable to reject donation request."
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    message:
                        "Donation request not found."
                });

            }


            return res.status(200).json({

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

    getPendingDonationRequests,

    approveDonationRequest,

    rejectDonationRequest

};