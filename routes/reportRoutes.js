const express =
    require("express");

const router =
    express.Router();

const requireManager =
    require("../middleware/requireManager");

const {
    getStatement
} = require(
    "../controllers/reportController"
);


// ======================================================
// FINANCE MANAGER ONLY
// ======================================================

router.get(
    "/statement",
    requireManager,
    getStatement
);


module.exports =
    router;