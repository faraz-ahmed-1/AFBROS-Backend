const express =
    require("express");

const router =
    express.Router();

const requireManager =
    require("../middleware/requireManager");


const {

    addDonation,

    getDonations,

    updateDonation,

    deleteDonation,

    submitDonationRequest,

    getPendingDonationRequests,

    approveDonationRequest,

    rejectDonationRequest

} = require(
    "../controllers/donationController"
);


// ======================================================
// PUBLIC / GUEST
// ======================================================

// Read approved donations
router.get(
    "/",
    getDonations
);


// Guest submits donation verification
router.post(
    "/requests",
    submitDonationRequest
);


// ======================================================
// FINANCE MANAGER
// ======================================================

// Pending donation list
router.get(
    "/requests",
    requireManager,
    getPendingDonationRequests
);


// Approve
router.post(
    "/requests/:id/approve",
    requireManager,
    approveDonationRequest
);


// Reject
router.delete(
    "/requests/:id/reject",
    requireManager,
    rejectDonationRequest
);


// Direct manager donation
router.post(
    "/",
    requireManager,
    addDonation
);


// Edit donation
router.put(
    "/:id",
    requireManager,
    updateDonation
);


// Delete donation
router.delete(
    "/:id",
    requireManager,
    deleteDonation
);


module.exports =
    router;