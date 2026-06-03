const express = require("express");

const {
  generateRecommendations,
  getMyRecommendations,
  acceptRecommendation,
  rejectRecommendation,
  getMyActivePsychologist,
} = require("../controllers/recommendationsController");

const {
  authRequired,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =======================
// USER RECOMMENDATION ROUTES
// =======================

// Générer recommandations selon user + analyse Python NLP
router.post(
  "/generate",
  authRequired,
  requireRole("USER"),
  generateRecommendations
);

// Afficher mes recommandations
router.get(
  "/me",
  authRequired,
  requireRole("USER"),
  getMyRecommendations
);

// Afficher mon psychologue actif
router.get(
  "/me/active-psychologist",
  authRequired,
  requireRole("USER"),
  getMyActivePsychologist
);

// Accepter une recommandation
router.post(
  "/:id/accept",
  authRequired,
  requireRole("USER"),
  acceptRecommendation
);

// Refuser une recommandation
router.post(
  "/:id/reject",
  authRequired,
  requireRole("USER"),
  rejectRecommendation
);

module.exports = router;