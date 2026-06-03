const express = require("express");

const {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  createQuestionnaire,
  submitFullQuestionnaire,
  getMyQuestionnaires,
  deactivateMyAccount,
} = require("../controllers/usersController");

const {
  authRequired,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =======================
// PUBLIC ROUTES
// =======================

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// =======================
// USER PRIVATE ROUTES
// =======================

// Get my profile
router.get(
  "/me",
  authRequired,
  requireRole("USER"),
  getMyProfile
);

// Update my profile
router.put(
  "/me",
  authRequired,
  requireRole("USER"),
  updateMyProfile
);

// Change password
router.put(
  "/me/password",
  authRequired,
  requireRole("USER"),
  changePassword
);

// Deactivate my account
router.delete(
  "/me",
  authRequired,
  requireRole("USER"),
  deactivateMyAccount
);

// =======================
// QUESTIONNAIRE ROUTES
// =======================

// Sauvegarder questionnaire simple
router.post(
  "/questionnaires",
  authRequired,
  requireRole("USER"),
  createQuestionnaire
);

// Sauvegarder questionnaire + appeler Python + créer conversation + sauvegarder tout
router.post(
  "/questionnaires/submit-full",
  authRequired,
  requireRole("USER"),
  submitFullQuestionnaire
);

// Récupérer mes questionnaires
router.get(
  "/questionnaires",
  authRequired,
  requireRole("USER"),
  getMyQuestionnaires
);

module.exports = router;