const db = require("../config/db");


// ======================================================
// ADD EXPENSE
// ======================================================

const addExpense = (req, res) => {

    const {
        fullName,
        amount,
        description,
        date
    } = req.body;

    if (
        !fullName?.trim() ||
        !amount ||
        !description?.trim() ||
        !date
    ) {
        return res.status(400).json({
            message: "Please fill in all expense fields."
        });
    }

    const numericAmount =
        Number(amount);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {
        return res.status(400).json({
            message: "Expense amount must be greater than zero."
        });
    }

    const sql = `
        INSERT INTO expenses
        (
            full_name,
            amount,
            description,
            expense_date
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            fullName.trim(),
            numericAmount,
            description.trim(),
            date
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "ADD EXPENSE ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Unable to add expense."
                });
            }

            return res.status(201).json({
                success: true,
                message: "Expense added successfully.",
                id: result.insertId
            });
        }
    );
};


// ======================================================
// GET EXPENSES
// ======================================================

const getExpenses = (req, res) => {

    const search =
        req.query.search?.trim() || "";

    const searchValue =
        `%${search}%`;

    const sql = `
        SELECT *
        FROM expenses
        WHERE
            full_name LIKE ?
            OR description LIKE ?
            OR CAST(amount AS CHAR) LIKE ?
        ORDER BY id ASC
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
                    "GET EXPENSES ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Unable to load expenses."
                });
            }

            return res.status(200).json(result);
        }
    );
};


// ======================================================
// UPDATE EXPENSE
// ======================================================

const updateExpense = (req, res) => {

    const expenseId =
        Number(req.params.id);

    if (
        !Number.isInteger(expenseId) ||
        expenseId <= 0
    ) {
        return res.status(400).json({
            message: "Invalid expense ID."
        });
    }

    const {
        fullName,
        amount,
        description,
        date
    } = req.body;

    if (
        !fullName?.trim() ||
        !amount ||
        !description?.trim() ||
        !date
    ) {
        return res.status(400).json({
            message: "Please fill in all expense fields."
        });
    }

    const numericAmount =
        Number(amount);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {
        return res.status(400).json({
            message: "Expense amount must be greater than zero."
        });
    }

    const sql = `
        UPDATE expenses
        SET
            full_name = ?,
            amount = ?,
            description = ?,
            expense_date = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            fullName.trim(),
            numericAmount,
            description.trim(),
            date,
            expenseId
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "UPDATE EXPENSE ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Unable to update expense."
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Expense record not found."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Expense updated successfully."
            });
        }
    );
};


// ======================================================
// DELETE EXPENSE
// ======================================================

const deleteExpense = (req, res) => {

    const expenseId =
        Number(req.params.id);

    if (
        !Number.isInteger(expenseId) ||
        expenseId <= 0
    ) {
        return res.status(400).json({
            message: "Invalid expense ID."
        });
    }

    const sql = `
        DELETE FROM expenses
        WHERE id = ?
    `;

    db.query(
        sql,
        [expenseId],
        (err, result) => {

            if (err) {

                console.error(
                    "DELETE EXPENSE ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Unable to delete expense."
                });
            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Expense record not found."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Expense deleted successfully."
            });
        }
    );
};


module.exports = {
    addExpense,
    getExpenses,
    updateExpense,
    deleteExpense
};