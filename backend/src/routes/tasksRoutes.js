const express = require("express");
const { authRequired, requireRole } = require("../middleware/authMiddleware");
const {
  createTask,
  updateTask,
  deleteTask,
  getPatientTasks,
  getLateTasksAlerts,
  getMyTasks,
  completeTask,
  getAllMyPatientsTasks,
  getMyPatients,
  getMyProgressStats,
} = require("../controllers/tasksController");

const router = express.Router();

// USER
router.get("/mine", authRequired, requireRole("USER"), getMyTasks);
router.get("/mine/progress", authRequired, requireRole("USER"), getMyProgressStats);
router.post("/:taskId/complete", authRequired, requireRole("USER"), completeTask);

// PSYCHOLOGUE / ADMIN
router.post("/", authRequired, requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"), createTask);
router.put("/:taskId", authRequired, requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"), updateTask);
router.delete("/:taskId", authRequired, requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"), deleteTask);

router.get("/patient/:userId", authRequired, requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"), getPatientTasks);
router.get("/alerts", authRequired, requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"), getLateTasksAlerts);
router.get("/psychologist/all", authRequired, requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"), getAllMyPatientsTasks);
router.get("/my-patients", authRequired, requireRole("PSYCHOLOGIST", "ADMIN", "SUPER_ADMIN"), getMyPatients);

module.exports = router;