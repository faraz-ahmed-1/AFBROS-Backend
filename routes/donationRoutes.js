const express =
    require("express");

const router =
    express.Router();

const requireManager =
    require(
        "../middleware/requireManager"
    );

const {

    addDonation,

    getDonations,

    updateDonation,

    deleteDonation,

    submitDonationRequest,

    getDonationRequests,

    getPendingRequestCount,

    approveDonationRequest,

    rejectDonationRequest

} = require(
    "../controllers/donationController"
);


// ======================================================
// PUBLIC
// ======================================================

router.get(
    "/",
    getDonations
);


router.post(
    "/requests",
    submitDonationRequest
);


// ======================================================
// MANAGER REQUEST MANAGEMENT
// ======================================================

router.get(
    "/requests/count",
    requireManager,
    getPendingRequestCount
);


router.get(
    "/requests",
    requireManager,
    getDonationRequests
);


router.post(
    "/requests/:id/approve",
    requireManager,
    approveDonationRequest
);


router.post(
    "/requests/:id/reject",
    requireManager,
    rejectDonationRequest
);


// ======================================================
// MANAGER DONATION CRUD
// ======================================================

router.post(
    "/",
    requireManager,
    addDonation
);


router.put(
    "/:id",
    requireManager,
    updateDonation
);


router.delete(
    "/:id",
    requireManager,
    deleteDonation
);


module.exports =
    router;