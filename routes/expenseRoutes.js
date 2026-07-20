const verifyToken = require("../middleware/verifyToken");
const express = require("express");
const router = express.Router();

const {
    addExpense,
    getExpenses,
    updateExpense,
    deleteExpense
} = require("../controllers/expenseController");

router.post("/", verifyToken, addExpense);
router.get("/", verifyToken, getExpenses);
router.put("/:id", verifyToken, updateExpense);
router.delete("/:id", verifyToken, deleteExpense);

module.exports = router;