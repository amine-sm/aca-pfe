const express = require("express");

const {
  registerPsychologist,
  loginPsychologist,
  listPublicPsychologists,
  getMyPsychologistProfile,
  updateMyPsychologistProfile,
  changePsychologistPassword,
  getMyPatients,
  getPatientDetail,
  deactivateMyPsychologistAccount,
} = require("../controllers/psychologistsController");

const {
  authRequired,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =======================
// PUBLIC ROUTES
// =======================

// Créer compte psychologue
router.post("/register", registerPsychologist);

// Login psychologue
router.post("/login", loginPsychologist);

// Liste publique des psychologues validés
router.get("/", listPublicPsychologists);

// =======================
// PSYCHOLOGIST PRIVATE ROUTES
// =======================

// Profil psychologue connecté
router.get(
  "/me",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  getMyPsychologistProfile
);

// Modifier profil psychologue connecté
router.put(
  "/me",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  updateMyPsychologistProfile
);

// Changer mot de passe psychologue
router.put(
  "/me/password",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  changePsychologistPassword
);

// Désactiver compte psychologue
router.delete(
  "/me",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  deactivateMyPsychologistAccount
);

// Liste des patients affectés au psychologue
router.get(
  "/me/patients",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  getMyPatients
);

// Détail d’un patient affecté
router.get(
  "/me/patients/:userId",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  getPatientDetail
);

module.exports = router;