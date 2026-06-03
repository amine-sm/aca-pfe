/**
 * 🇩🇿 DziriBERT Controller
 * ========================
 *
 * Pont entre Frontend et Python Service.
 * Appelle /dziri/chat qui orchestre DziriBERT + Qwen2.5
 *
 * Gestion :
 * - Crise détectée → renvoie l'aide d'urgence (PAS de Qwen)
 * - Sinon → réponse Qwen enrichie par contexte DziriBERT
 * - Sauvegarde de la conversation en BDD
 */

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


/**
 * POST /api/dziri/chat
 *
 * Body : { message, conversation_id?, response_language? }
 *
 * Flow :
 * 1. Appel Python /dziri/chat (DziriBERT + Qwen)
 * 2. Si crise → renvoie urgence + flag block
 * 3. Sinon → sauvegarde le message + la réponse
 * 4. Renvoie tout au frontend
 */
async function dziriChat(req, res) {
  try {
    const userId = req.auth.id;
    const {
      message,
      conversation_id,
      response_language = "darija",
      country = "DZ",
    } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Message trop court",
      });
    }

    // 🇩🇿 Appel Python (DziriBERT → Qwen)
    const result = await callPython("/dziri/chat", {
      message: message.trim(),
      country,
      response_language,
    });

    // 🚨 Gestion de la crise
    if (result.is_crisis) {
      // On sauvegarde le signal de crise pour le psychologue
      try {
        await query(
          `
          INSERT INTO crisis_alerts (
            user_id,
            message,
            severity,
            confidence,
            created_at
          )
          VALUES (?, ?, ?, ?, NOW())
          `,
          [
            userId,
            message.substring(0, 500),
            result.analysis?.crisis?.severity || "high",
            result.analysis?.crisis?.confidence || 0.7,
          ]
        );
      } catch (dbError) {
        // Si la table n'existe pas encore, on log juste, sans bloquer
        console.warn("Table crisis_alerts manquante :", dbError.message);
      }

      return res.json({
        success: true,
        is_crisis: true,
        response_text: result.response_text,
        emergency_info: result.emergency_info,
        analysis: result.analysis,
        should_block_chat: true,
      });
    }

    // ✅ Pas de crise → sauvegarde normale
    let savedConvId = conversation_id || null;
    let userMessageId = null;
    let assistantMessageId = null;

    try {
      // Créer une conversation si nécessaire
      if (!savedConvId) {
        const convResult = await query(
          `INSERT INTO conversations (user_id, title, created_at) VALUES (?, ?, NOW())`,
          [userId, message.substring(0, 60)]
        );
        savedConvId = convResult.insertId;
      }

      // Sauvegarder le message utilisateur
      const userMsgResult = await query(
        `
        INSERT INTO messages (conversation_id, role, content, metadata, created_at)
        VALUES (?, ?, ?, ?, NOW())
        `,
        [
          savedConvId,
          "user",
          message,
          JSON.stringify({
            sentiment: result.analysis?.sentiment?.label,
            addiction_type: result.analysis?.addiction_type?.label,
            confidence: result.analysis?.sentiment?.confidence,
          }),
        ]
      );
      userMessageId = userMsgResult.insertId;

      // Sauvegarder la réponse assistant
      const assistMsgResult = await query(
        `
        INSERT INTO messages (conversation_id, role, content, metadata, created_at)
        VALUES (?, ?, ?, ?, NOW())
        `,
        [
          savedConvId,
          "assistant",
          result.response_text,
          JSON.stringify({
            model: "dziribert+qwen2.5",
            pipeline: result.pipeline,
          }),
        ]
      );
      assistantMessageId = assistMsgResult.insertId;
    } catch (dbError) {
      console.warn("Sauvegarde BDD échouée :", dbError.message);
      // On continue, le frontend recevra quand même la réponse
    }

    return res.json({
      success: true,
      is_crisis: false,
      response_text: result.response_text,
      analysis: result.analysis,
      conversation_id: savedConvId,
      user_message_id: userMessageId,
      assistant_message_id: assistantMessageId,
      pipeline: result.pipeline,
    });
  } catch (error) {
    console.error("Erreur dziriChat:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur du service de chat",
      error: error.message,
    });
  }
}


/**
 * POST /api/dziri/analyze
 *
 * Analyse SANS génération Qwen (utile pour debug / dashboard psychologue).
 */
async function dziriAnalyze(req, res) {
  try {
    const { message, country = "DZ" } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Message trop court",
      });
    }

    const result = await callPython("/dziri/analyze", {
      text: message.trim(),
      country,
    });

    return res.json(result);
  } catch (error) {
    console.error("Erreur dziriAnalyze:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur d'analyse",
      error: error.message,
    });
  }
}


/**
 * GET /api/dziri/info
 *
 * Infos sur les modèles chargés (pour dashboard admin/psychologue).
 */
async function dziriInfo(req, res) {
  try {
    const response = await fetch(`${NLP_SERVICE_URL}/dziri/info`);
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Impossible d'obtenir les infos",
      error: error.message,
    });
  }
}


/**
 * GET /api/dziri/crisis-alerts
 *
 * Liste des alertes de crise pour le psychologue.
 */
async function getCrisisAlerts(req, res) {
  try {
    const alerts = await query(
      `
      SELECT
        ca.id,
        ca.user_id,
        u.email,
        u.first_name,
        u.last_name,
        ca.message,
        ca.severity,
        ca.confidence,
        ca.created_at,
        ca.acknowledged
      FROM crisis_alerts ca
      JOIN users u ON ca.user_id = u.id
      ORDER BY ca.created_at DESC
      LIMIT 50
      `
    );

    return res.json({
      success: true,
      total: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Erreur getCrisisAlerts:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur récupération alertes",
      error: error.message,
    });
  }
}


module.exports = {
  dziriChat,
  dziriAnalyze,
  dziriInfo,
  getCrisisAlerts,
};
