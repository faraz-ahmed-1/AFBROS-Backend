const express =
    require("express");

const router =
    express.Router();

const {

    requestUpdateOtp,

    verifyUpdateOtp

} = require(
    "../controllers/donorProfileController"
);


// ======================================================
// DONOR PUBLIC OTP FLOW
// ======================================================

router.post(
    "/update/request-otp",
    requestUpdateOtp
);


router.post(
    "/update/verify-otp",
    verifyUpdateOtp
);


module.exports =
    router;