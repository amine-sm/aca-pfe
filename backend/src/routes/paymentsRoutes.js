const express = require("express");

const {
  getPlans,
  createCheckout,
  getMyPayments,
  getMyPaymentById,
  getMyInvoices,
  uploadPaymentProof,
  markManualPaid,
  rejectPayment,
  getAllPaymentsAdmin,
  getMyPayouts,
  webhookPayment,
} = require("../controllers/paymentsController");

const { authRequired, requireRole } = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// =======================
// PUBLIC ROUTES
// =======================

router.get("/plans", getPlans);

router.post("/webhook/:provider", webhookPayment);

// =======================
// USER ROUTES
// =======================

// Créer paiement avec preuve PNG/JPG/PDF
router.post(
  "/create-checkout",
  authRequired,
  requireRole("USER"),
  upload.single("proof_file"),
  createCheckout
);

// Modifier / envoyer une preuve après création paiement
router.post(
  "/:id/proof",
  authRequired,
  requireRole("USER"),
  upload.single("proof_file"),
  uploadPaymentProof
);

router.get("/me", authRequired, requireRole("USER"), getMyPayments);

router.get("/me/:id", authRequired, requireRole("USER"), getMyPaymentById);

router.get("/invoices/me", authRequired, requireRole("USER"), getMyInvoices);

// =======================
// PSYCHOLOGIST ROUTES
// =======================

router.get(
  "/psychologist/payouts/me",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  getMyPayouts
);

// =======================
// ADMIN ROUTES
// =======================

router.get(
  "/admin/all",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  getAllPaymentsAdmin
);

router.patch(
  "/:id/manual-paid",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  markManualPaid
);

router.patch(
  "/:id/reject",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  rejectPayment
);

module.exports = router;