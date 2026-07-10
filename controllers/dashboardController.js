const db = require("../config/db");

const getDashboard = (req, res) => {

    const sql = `
        SELECT
            (SELECT IFNULL(SUM(amount),0) FROM donations) AS totalDonations,
            (SELECT IFNULL(SUM(amount),0) FROM expenses) AS totalExpenses
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        const donations = Number(result[0].totalDonations);
        const expenses = Number(result[0].totalExpenses);

        res.json({
            totalDonations: donations,
            totalExpenses: expenses,
            remainingBalance: donations - expenses
        });

    });

};

module.exports = { getDashboard };