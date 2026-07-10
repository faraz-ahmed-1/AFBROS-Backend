const db = require("../config/db");

// Add Donation
const addDonation = (req, res) => {

    const { fullName, phone, amount, date } = req.body;

    const sql = `
        INSERT INTO donations
        (full_name, phone, amount, donation_date)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [fullName, phone, amount, date],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.status(201).json({
                message: "Donation Added Successfully"
            });

        }
    );

};

// Get All Donations
const getDonations = (req, res) => {

    const search = req.query.search || "";
    const sort = req.query.sort || "id";

    let orderBy = "id ASC";

    if (sort === "amountAsc") {
        orderBy = "amount ASC";
    }

    if (sort === "amountDesc") {
        orderBy = "amount DESC";
    }

    if (sort === "dateNewest") {
        orderBy = "donation_date DESC";
    }

    if (sort === "dateOldest") {
        orderBy = "donation_date ASC";
    }

    const sql = `
        SELECT *
        FROM donations
        WHERE
            full_name LIKE ?
            OR phone LIKE ?
            OR amount LIKE ?
        ORDER BY ${orderBy}
    `;

    db.query(
        sql,
        [
            `%${search}%`,
            `%${search}%`,
            `%${search}%`
        ],
        (err, result) => {

            if (err)
                return res.status(500).json(err);

            res.json(result);

        }
    );

};

// Update Donation
const updateDonation = (req, res) => {

    const { id } = req.params;
    const { fullName, phone, amount, date } = req.body;

    const sql = `
        UPDATE donations
        SET
        full_name=?,
        phone=?,
        amount=?,
        donation_date=?
        WHERE id=?
    `;

    db.query(
        sql,
        [fullName, phone, amount, date, id],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Donation Updated"
            });

        }
    );

};

// Delete Donation
const deleteDonation = (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM donations WHERE id=?",
        [id],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Donation Deleted"
            });

        }
    );

};

module.exports = {
    addDonation,
    getDonations,
    updateDonation,
    deleteDonation
};