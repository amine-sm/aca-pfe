const express = require("express");

const {
  createAppointment,
  getMyAppointments,
  getPsychologistAppointments,
  updateAppointmentStatus,
  cancelMyAppointment,
} = require("../controllers/appointmentsController");

const {
  authRequired,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// USER : créer rendez-vous
router.post(
  "/",
  authRequired,
  requireRole("USER"),
  createAppointment
);

// USER : voir mes rendez-vous
router.get(
  "/me",
  authRequired,
  requireRole("USER"),
  getMyAppointments
);

// USER : annuler rendez-vous
router.patch(
  "/:id/cancel",
  authRequired,
  requireRole("USER"),
  cancelMyAppointment
);

// PSYCHOLOGIST : voir les rendez-vous reçus
router.get(
  "/psychologist/me",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  getPsychologistAppointments
);

// PSYCHOLOGIST : confirmer / terminer / annuler
router.patch(
  "/:id/status",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  updateAppointmentStatus
);

module.exports = router;