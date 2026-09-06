const express =
    require("express");

const router =
    express.Router();

const requireManager =
    require("../middleware/requireManager");


const {

    addExpense,

    getExpenses,

    updateExpense,

    deleteExpense

} = require(
    "../controllers/expenseController"
);


// ======================================================
// PUBLIC READ
// ======================================================

router.get(
    "/",
    getExpenses
);


// ======================================================
// FINANCE MANAGER ONLY
// ======================================================

router.post(
    "/",
    requireManager,
    addExpense
);


router.put(
    "/:id",
    requireManager,
    updateExpense
);


router.delete(
    "/:id",
    requireManager,
    deleteExpense
);


module.exports =
    router;