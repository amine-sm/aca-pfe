const express = require("express");
const { authRequired, requireRole } = require("../middleware/authMiddleware");
const {
  dziriChat,
  dziriAnalyze,
  dziriInfo,
  getCrisisAlerts,
} = require("../controllers/dziribertController");

const router = express.Router();

// 💬 Chat principal - accessible aux patients
router.post("/chat", authRequired, requireRole("USER"), dziriChat);

// 🔬 Analyse seule (sans Qwen) - accessible aux patients aussi
router.post("/analyze", authRequired, requireRole("USER"), dziriAnalyze);

// ℹ️ Infos modèles - accessible à tout user connecté
router.get("/info", authRequired, dziriInfo);

// 🚨 Alertes crise - réservé aux psychologues et admins
router.get(
  "/crisis-alerts",
  authRequired,
  requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"),
  getCrisisAlerts
);

module.exports = router;
