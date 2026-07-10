const express = require("express");
const router = express.Router();

const {
    addDonation,
    getDonations,
    updateDonation,
    deleteDonation
} = require("../controllers/donationController");

router.post("/", addDonation);
router.get("/", getDonations);
router.put("/:id", updateDonation);
router.delete("/:id", deleteDonation);

module.exports = router;