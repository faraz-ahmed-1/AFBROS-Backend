const express =
    require("express");

const router =
    express.Router();


const {
    getDashboard
} = require(
    "../controllers/dashboardController"
);


// Dashboard is readable by
// Manager and Guest.

router.get(
    "/",
    getDashboard
);


module.exports =
    router;