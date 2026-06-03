const express = require("express");

const {
  startConversation,
  sendMessage,
  getMyConversations,
  getConversationById,
  closeConversation,
  deleteConversation,
} = require("../controllers/conversationsController");

const {
  authRequired,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Créer conversation
router.post(
  "/start",
  authRequired,
  requireRole("USER"),
  startConversation
);

// Envoyer message
router.post(
  "/message",
  authRequired,
  requireRole("USER"),
  sendMessage
);

// Voir mes conversations
router.get(
  "/",
  authRequired,
  requireRole("USER"),
  getMyConversations
);

// Voir une conversation
router.get(
  "/:id",
  authRequired,
  requireRole("USER"),
  getConversationById
);

// Fermer conversation
router.patch(
  "/:id/close",
  authRequired,
  requireRole("USER"),
  closeConversation
);

// Supprimer conversation
router.delete(
  "/:id",
  authRequired,
  requireRole("USER"),
  deleteConversation
);

module.exports = router;