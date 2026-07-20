const verifyToken = require("../middleware/verifyToken");
const express = require("express");
const router = express.Router();

const {
    addDonation,
    getDonations,
    updateDonation,
    deleteDonation
} = require("../controllers/donationController");

router.post("/", verifyToken, addDonation);
router.get("/", verifyToken, getDonations);
router.put("/:id", verifyToken, updateDonation);
router.delete("/:id", verifyToken, deleteDonation);

module.exports = router;