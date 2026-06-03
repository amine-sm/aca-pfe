const express = require("express");
const { authRequired, requireRole } = require("../middleware/authMiddleware");
const {
  generateQuestions,
  finishOnboarding,
} = require("../controllers/qwenOnboardingController");

const router = express.Router();

router.post("/generate", authRequired, requireRole("USER"), generateQuestions);
router.post("/finish", authRequired, requireRole("USER"), finishOnboarding);

module.exports = router;
