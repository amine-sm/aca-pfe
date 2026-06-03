const { query } = require("../database/db");

const NLP_SERVICE_URL =
  process.env.NLP_SERVICE_URL || "http://127.0.0.1:8000";


async function callPython(path, body) {
  const response = await fetch(`${NLP_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FastAPI ${path} ${response.status}: ${text}`);
  }
  return response.json();
}


async function smartChat(req, res) {
  try {
    const userId = req.auth.id;
    const {
      message,
      conversation_id,
      country = "DZ",
      force_pipeline,
    } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Message trop court",
      });
    }

    const result = await callPython("/smart/chat", {
      message: message.trim(),
      country,
      force_pipeline: force_pipeline || null,
    });

    if (result.is_crisis) {
      try {
        await query(
          `INSERT INTO crisis_alerts (user_id, message, severity, confidence, detected_at, created_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            message.substring(0, 500),
            result.analysis?.crisis?.severity || "high",
            result.analysis?.crisis?.confidence || 0.7,
          ]
        );
      } catch (dbError) {
        console.warn("Table crisis_alerts manquante :", dbError.message);
      }

      return res.json({
        success: true,
        is_crisis: true,
        response_text: result.response_text,
        emergency_info: result.emergency_info,
        language: result.language,
        pipeline_used: result.pipeline_used,
        should_block_chat: true,
      });
    }

    let savedConvId = conversation_id || null;

    try {
      // 🆕 Création de conversation si nécessaire
      if (!savedConvId) {
        const convResult = await query(
          `INSERT INTO conversations (user_id, title, started_at) VALUES (?, ?, NOW())`,
          [userId, message.substring(0, 60)]
        );
        savedConvId = convResult.insertId;
      }

      // 🆕 Sauvegarde message USER (avec les BONS noms de colonnes)
      await query(
        `INSERT INTO messages (conversation_id, sender_type, message_text, created_at)
         VALUES (?, ?, ?, NOW())`,
        [savedConvId, "user", message]
      );

      // 🆕 Sauvegarde message ASSISTANT
      await query(
        `INSERT INTO messages (conversation_id, sender_type, message_text, created_at)
         VALUES (?, ?, ?, NOW())`,
        [savedConvId, "assistant", result.response_text]
      );
    } catch (dbError) {
      console.warn("Sauvegarde BDD échouée :", dbError.message);
    }

    return res.json({
      success: true,
      is_crisis: false,
      response_text: result.response_text,
      language: result.language,
      pipeline_used: result.pipeline_used,
      analysis: result.analysis,
      conversation_id: savedConvId,
    });
  } catch (error) {
    console.error("Erreur smartChat:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur du service de chat",
      error: error.message,
    });
  }
}


async function detectLanguage(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Texte vide" });
    }

    const result = await callPython("/smart/detect-language", {
      text: message,
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur détection",
      error: error.message,
    });
  }
}


module.exports = {
  smartChat,
  detectLanguage,
};