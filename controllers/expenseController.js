const db = require("../config/db");

// Add Expense
const addExpense = (req, res) => {

    const { fullName, amount, description, date } = req.body;

    const sql = `
        INSERT INTO expenses
        (full_name, amount, description, expense_date)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [fullName, amount, description, date],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.status(201).json({
                message: "Expense Added Successfully"
            });

        }
    );

};

// Get Expenses
const getExpenses = (req, res) => {

    const search = req.query.search || "";

    const sql = `
        SELECT *
        FROM expenses
        WHERE full_name LIKE ?
        ORDER BY id ASC
    `;

    db.query(
        sql,
        [`%${search}%`],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result);

        }
    );

};

// Update Expense
const updateExpense = (req, res) => {

    const { id } = req.params;
    const { fullName, amount, description, date } = req.body;

    const sql = `
        UPDATE expenses
        SET
        full_name=?,
        amount=?,
        description=?,
        expense_date=?
        WHERE id=?
    `;

    db.query(
        sql,
        [fullName, amount, description, date, id],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Expense Updated"
            });

        }
    );

};

// Delete Expense
const deleteExpense = (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM expenses WHERE id=?",
        [id],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Expense Deleted"
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