const { query } = require("../database/db");

const {
  analyzeMessageWithPython,
  generateReplyWithPython,
} = require("../services/pythonNlpService");

// =======================
// EXTRACTION RESULTAT PYTHON
// =======================
function extractNlpData(nlpResult) {
  return {
    sentiment:
      nlpResult?.nlp?.sentiment?.label ||
      nlpResult?.sentiment ||
      "unknown",

    emotion: Array.isArray(nlpResult?.analysis?.dominant_emotions)
      ? nlpResult.analysis.dominant_emotions[0] || "unknown"
      : nlpResult?.emotion || "unknown",

    intent:
      nlpResult?.nlp?.intent?.label ||
      nlpResult?.intent ||
      "unknown",

    riskScore:
      nlpResult?.scores?.global_score ||
      nlpResult?.risk_score ||
      0,

    riskLevel:
      nlpResult?.diagnostic?.risk_level ||
      nlpResult?.risk_level ||
      "unknown",

    priority:
      nlpResult?.diagnostic?.priority || null,

    orientation:
      nlpResult?.diagnostic?.orientation || null,

    emotionalState:
      nlpResult?.analysis?.emotional_state ||
      "stable",

    vulnerability:
      nlpResult?.analysis?.vulnerability ||
      null,

    needsHelp:
      nlpResult?.analysis?.needs_help ||
      false,

    relapseSuspected:
      nlpResult?.analysis?.relapse_suspected ||
      false,

    analysisSummary:
      nlpResult?.analysis?.analysis_summary ||
      "",

    diagnosticSummary:
      nlpResult?.diagnostic?.diagnostic_summary ||
      "",

    therapyMessage:
      nlpResult?.therapy?.message ||
      "",

    dominantEmotions:
      nlpResult?.analysis?.dominant_emotions ||
      [],
  };
}

// =======================
// START CONVERSATION
// =======================
async function startConversation(req, res) {
  try {
    const userId = req.auth.id;
    const { title } = req.body;

    const result = await query(
      `
      INSERT INTO conversations (
        user_id,
        title,
        status
      )
      VALUES (?, ?, 'open')
      `,
      [userId, title || "Nouvelle conversation"]
    );

    return res.status(201).json({
      success: true,
      message: "Conversation créée avec succès",
      conversation: {
        id: result.insertId,
        user_id: userId,
        title: title || "Nouvelle conversation",
        status: "open",
      },
      conversation_id: result.insertId,
    });
  } catch (error) {
    console.error("Erreur startConversation:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur création conversation",
      error: error.message,
    });
  }
}

// =======================
// SEND MESSAGE
// Sauvegarder message user + appeler Python + sauvegarder NLP + réponse assistant
// =======================
async function sendMessage(req, res) {
  try {
    const userId = req.auth.id;

    const {
      conversation_id,
      message,
      questionnaire,
    } = req.body;

    if (!conversation_id || !message) {
      return res.status(400).json({
        success: false,
        message: "conversation_id et message sont obligatoires",
      });
    }

    // 1. Vérifier conversation
    const conversations = await query(
      `
      SELECT *
      FROM conversations
      WHERE id = ?
        AND user_id = ?
        AND status = 'open'
      `,
      [conversation_id, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation introuvable ou fermée",
      });
    }

    const conversation = conversations[0];

    // 2. Sauvegarder message USER
    const userMessageResult = await query(
      `
      INSERT INTO messages (
        conversation_id,
        sender_type,
        message_text,
        is_sensitive,
        is_deleted
      )
      VALUES (?, 'user', ?, FALSE, FALSE)
      `,
      [conversation_id, message]
    );

    const userMessageId = userMessageResult.insertId;

    // 3. Appeler backend Python /nlp
    const nlpResult = await analyzeMessageWithPython(
      message,
      questionnaire || {}
    );

    const data = extractNlpData(nlpResult);

    const summary = `${data.analysisSummary} ${data.diagnosticSummary}`.trim();

    // 4. Sauvegarder analyse NLP
    const nlpAnalysisResult = await query(
      `
      INSERT INTO nlp_analyses (
        user_id,
        conversation_id,
        message_id,
        sentiment,
        emotion,
        intent,
        risk_score,
        risk_level,
        detected_keywords,
        model_name,
        raw_result
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        conversation_id,
        userMessageId,
        data.sentiment,
        data.emotion,
        data.intent,
        Number(data.riskScore || 0),
        data.riskLevel,
        JSON.stringify(data.dominantEmotions || []),
        "fastapi-python-nlp",
        JSON.stringify(nlpResult),
      ]
    );

    // 5. Mettre à jour risque user
    await query(
      `
      UPDATE users
      SET risk_level = ?
      WHERE id = ?
      `,
      [data.riskLevel, userId]
    );

    // 6. Mettre à jour conversation
    await query(
      `
      UPDATE conversations
      SET
        summary = ?,
        emotional_state = ?,
        risk_level = ?
      WHERE id = ?
      `,
      [
        summary || conversation.summary || null,
        data.emotionalState,
        data.riskLevel,
        conversation_id,
      ]
    );

    // 7. Créer alerte si risque élevé
    if (data.riskLevel === "eleve" || data.riskLevel === "critique") {
      await query(
        `
        INSERT INTO risk_alerts (
          user_id,
          conversation_id,
          alert_type,
          risk_level,
          message_excerpt,
          status
        )
        VALUES (?, ?, ?, ?, ?, 'open')
        `,
        [
          userId,
          conversation_id,
          data.riskLevel === "critique"
            ? "emergency"
            : "addiction_high_risk",
          data.riskLevel,
          message.substring(0, 500),
        ]
      );
    }

    // 8. Appeler backend Python /chat
    const chatResult = await generateReplyWithPython({
      message,
      summary_context: conversation.summary || summary || "",
      emotional_state: data.emotionalState,
      risk_level: data.riskLevel,
    });

    const botReply =
      chatResult?.reply ||
      data.therapyMessage ||
      "Je suis là pour t’écouter. Tu peux continuer la discussion.";

    // 9. Sauvegarder réponse ASSISTANT
    const assistantMessageResult = await query(
      `
      INSERT INTO messages (
        conversation_id,
        sender_type,
        message_text,
        is_sensitive,
        is_deleted
      )
      VALUES (?, 'assistant', ?, FALSE, FALSE)
      `,
      [conversation_id, botReply]
    );

    return res.json({
      success: true,
      message: "Message sauvegardé et traité par Python avec succès",
      conversation_id,

      user_message: {
        id: userMessageId,
        text: message,
      },

      assistant_message: {
        id: assistantMessageResult.insertId,
        text: botReply,
      },

      nlp_analysis: {
        id: nlpAnalysisResult.insertId,
        sentiment: data.sentiment,
        emotion: data.emotion,
        intent: data.intent,
        risk_score: Number(data.riskScore || 0),
        risk_level: data.riskLevel,
        emotional_state: data.emotionalState,
        vulnerability: data.vulnerability,
        needs_help: data.needsHelp,
        relapse_suspected: data.relapseSuspected,
      },

      diagnostic: nlpResult.diagnostic || null,
      therapy: nlpResult.therapy || null,
      nlp: nlpResult,
      reply: botReply,
    });
  } catch (error) {
    console.error("Erreur sendMessage:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur traitement et sauvegarde du message",
      error: error.message,
    });
  }
}

// =======================
// GET MY CONVERSATIONS
// =======================
async function getMyConversations(req, res) {
  try {
    const userId = req.auth.id;

    const conversations = await query(
      `
      SELECT *
      FROM conversations
      WHERE user_id = ?
      ORDER BY started_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Erreur getMyConversations:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération conversations",
      error: error.message,
    });
  }
}

// =======================
// GET CONVERSATION BY ID
// =======================
async function getConversationById(req, res) {
  try {
    const userId = req.auth.id;
    const { id } = req.params;

    const conversations = await query(
      `
      SELECT *
      FROM conversations
      WHERE id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation introuvable",
      });
    }

    const messages = await query(
      `
      SELECT *
      FROM messages
      WHERE conversation_id = ?
        AND is_deleted = FALSE
      ORDER BY created_at ASC
      `,
      [id]
    );

    const analyses = await query(
      `
      SELECT *
      FROM nlp_analyses
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      `,
      [id]
    );

    const parsedAnalyses = analyses.map((a) => {
      let rawResult = a.raw_result;
      let detectedKeywords = a.detected_keywords;

      try {
        rawResult =
          typeof a.raw_result === "string"
            ? JSON.parse(a.raw_result)
            : a.raw_result;
      } catch {}

      try {
        detectedKeywords =
          typeof a.detected_keywords === "string"
            ? JSON.parse(a.detected_keywords)
            : a.detected_keywords;
      } catch {}

      return {
        ...a,
        raw_result: rawResult,
        detected_keywords: detectedKeywords,
      };
    });

    return res.json({
      success: true,
      conversation: conversations[0],
      messages,
      analyses: parsedAnalyses,
    });
  } catch (error) {
    console.error("Erreur getConversationById:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération conversation",
      error: error.message,
    });
  }
}

// =======================
// CLOSE CONVERSATION
// =======================
async function closeConversation(req, res) {
  try {
    const userId = req.auth.id;
    const { id } = req.params;

    await query(
      `
      UPDATE conversations
      SET status = 'closed',
          ended_at = NOW()
      WHERE id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    return res.json({
      success: true,
      message: "Conversation fermée avec succès",
    });
  } catch (error) {
    console.error("Erreur closeConversation:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur fermeture conversation",
      error: error.message,
    });
  }
}
// =======================
// DELETE CONVERSATION
// Supprimer une conversation du user connecté
// =======================
async function deleteConversation(req, res) {
  try {
    const userId = req.auth.id;
    const { id } = req.params;

    // 1. Vérifier que la conversation appartient au user
    const conversations = await query(
      `
      SELECT *
      FROM conversations
      WHERE id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation introuvable",
      });
    }

    // 2. Supprimer les alertes liées
    await query(
      `
      DELETE FROM risk_alerts
      WHERE conversation_id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    // 3. Supprimer les analyses NLP liées
    await query(
      `
      DELETE FROM nlp_analyses
      WHERE conversation_id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    // 4. Supprimer les messages liés
    await query(
      `
      DELETE FROM messages
      WHERE conversation_id = ?
      `,
      [id]
    );

    // 5. Supprimer la conversation
    await query(
      `
      DELETE FROM conversations
      WHERE id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    return res.json({
      success: true,
      message: "Conversation supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur deleteConversation:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur suppression conversation",
      error: error.message,
    });
  }
}
module.exports = {
  startConversation,
  sendMessage,
  getMyConversations,
  getConversationById,
  closeConversation,
  deleteConversation,
};