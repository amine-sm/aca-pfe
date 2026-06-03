const express = require("express");
const { authRequired, requireRole } = require("../middleware/authMiddleware");
const {
  smartChat,
  detectLanguage,
} = require("../controllers/smartChatController");

const router = express.Router();

router.post("/chat", authRequired, requireRole("USER"), smartChat);
router.post("/detect-language", authRequired, detectLanguage);

module.exports = router;