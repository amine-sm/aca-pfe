const express = require("express");

const {
  listActivePaymentMethods,
  listPaymentMethodsAdmin,
  createPaymentMethodAdmin,
  updatePaymentMethodAdmin,
  deletePaymentMethodAdmin,
} = require("../controllers/paymentMethodsController");

const { authRequired, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Méthodes actives affichées au patient
router.get("/active", authRequired, requireRole("USER"), listActivePaymentMethods);

// Admin : liste complète
router.get(
  "/admin",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  listPaymentMethodsAdmin
);

// Admin : ajouter
router.post(
  "/admin",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  createPaymentMethodAdmin
);

// Admin : modifier / activer / désactiver
router.patch(
  "/admin/:id",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  updatePaymentMethodAdmin
);

// Admin : désactiver
router.delete(
  "/admin/:id",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  deletePaymentMethodAdmin
);

module.exports = router;
