const express = require("express");

const {
  getPatientClinicalProfile,
} = require("../controllers/onboardingController");

const {
  authRequired,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/patient/:userId",
  authRequired,
  requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"),
  getPatientClinicalProfile
);

module.exports = router;