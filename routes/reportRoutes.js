const express =
    require("express");

const router =
    express.Router();


const {
    getStatement
} = require(
    "../controllers/reportController"
);


// ======================================================
// PDF STATEMENT DATA
// ======================================================

router.get(
    "/statement",
    getStatement
);


module.exports =
    router;