const express = require("express");

const {
  loginAdmin,
  getAdminProfile,
  dashboard,

  listUsers,
  getUserDetail,
  disableUser,
  enableUser,

  listPsychologists,
  listPsychologistCommissions,
  markPsychologistPayoutsPaid,
  getPsychologistDetail,
  verifyPsychologist,
  disablePsychologist,
  enablePsychologist,

  listAlerts,
  closeAlert,

  listPayments,
  listAppointments,

  listConversations,
  getConversationDetailAdmin,
} = require("../controllers/adminController");

const {
  authRequired,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =======================
// PUBLIC ADMIN ROUTE
// =======================

router.post("/login", loginAdmin);

// =======================
// ADMIN PRIVATE ROUTES
// =======================

router.get(
  "/me",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  getAdminProfile
);

router.get(
  "/dashboard",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  dashboard
);

// =======================
// USERS
// =======================

router.get(
  "/users",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  listUsers
);

router.get(
  "/users/:id",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  getUserDetail
);

router.patch(
  "/users/:id/disable",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  disableUser
);

router.patch(
  "/users/:id/enable",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  enableUser
);

// =======================
// PSYCHOLOGISTS
// =======================

router.get(
  "/psychologists",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  listPsychologists
);

// IMPORTANT : cette route doit rester AVANT /psychologists/:id
router.get(
  "/psychologists/commissions",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  listPsychologistCommissions
);

// IMPORTANT : cette route doit rester AVANT /psychologists/:id
router.patch(
  "/psychologists/:psychologistId/payouts/pay",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  markPsychologistPayoutsPaid
);

router.get(
  "/psychologists/:id",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  getPsychologistDetail
);

router.patch(
  "/psychologists/:id/verify",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  verifyPsychologist
);

router.patch(
  "/psychologists/:id/disable",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  disablePsychologist
);

router.patch(
  "/psychologists/:id/enable",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  enablePsychologist
);

// =======================
// ALERTS
// =======================

router.get(
  "/alerts",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  listAlerts
);

router.patch(
  "/alerts/:id/close",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  closeAlert
);

// =======================
// PAYMENTS
// =======================

router.get(
  "/payments",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  listPayments
);

// =======================
// APPOINTMENTS
// =======================

router.get(
  "/appointments",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  listAppointments
);

// =======================
// CONVERSATIONS
// =======================

router.get(
  "/conversations",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  listConversations
);

router.get(
  "/conversations/:id",
  authRequired,
  requireRole("ADMIN", "SUPER_ADMIN"),
  getConversationDetailAdmin
);

module.exports = router;