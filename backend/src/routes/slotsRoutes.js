const express = require("express");

const {
  createSlot,
  getMySlots,
  getAvailableSlots,
  deleteSlot,
} = require("../controllers/slotsController");

const {
  authRequired,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authRequired, requireRole("PSYCHOLOGIST"), createSlot);

router.get(
  "/psychologist/me",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  getMySlots
);

router.get(
  "/available/:psychologist_id",
  authRequired,
  requireRole("USER"),
  getAvailableSlots
);

router.delete(
  "/:id",
  authRequired,
  requireRole("PSYCHOLOGIST"),
  deleteSlot
);

module.exports = router;