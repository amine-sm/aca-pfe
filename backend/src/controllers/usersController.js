const bcrypt = require("bcryptjs");
const { query } = require("../database/db");
const { generateToken } = require("../utils/jwt");

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
// REGISTER USER
// =======================
async function registerUser(req, res) {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      birth_date,
      gender,
      city,
      country,
      preferred_language,
      addiction_type,
      consumption_level,
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nom, email et mot de passe obligatoires",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    const existingUser = await query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `
      INSERT INTO users (
        full_name,
        email,
        phone,
        password_hash,
        birth_date,
        gender,
        city,
        country,
        preferred_language,
        addiction_type,
        consumption_level,
        risk_level,
        is_active,
        is_verified
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unknown', TRUE, FALSE)
      `,
      [
        full_name,
        email,
        phone || null,
        password_hash,
        birth_date || null,
        gender || null,
        city || null,
        country || "Algeria",
        preferred_language || "français",
        addiction_type || null,
        consumption_level || null,
      ]
    );

    const token = generateToken({
      id: result.insertId,
      role: "USER",
    });

    return res.status(201).json({
      success: true,
      message: "Compte utilisateur créé avec succès",
      token,
      user: {
        id: result.insertId,
        full_name,
        email,
        role: "USER",
      },
    });
  } catch (error) {
    console.error("Erreur registerUser:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur création compte",
      error: error.message,
    });
  }
}

// =======================
// LOGIN USER
// =======================
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe obligatoires",
      });
    }

    const users = await query(
      `
      SELECT *
      FROM users
      WHERE email = ?
        AND is_active = TRUE
      `,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    const user = users[0];

    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    const token = generateToken({
      id: user.id,
      role: "USER",
    });

    delete user.password_hash;

    return res.json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        ...user,
        role: "USER",
      },
    });
  } catch (error) {
    console.error("Erreur loginUser:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur connexion",
      error: error.message,
    });
  }
}

// =======================
// GET PROFILE
// =======================
function getMyProfile(req, res) {
  return res.json({
    success: true,
    user: req.user,
  });
}

// =======================
// UPDATE PROFILE
// =======================
async function updateMyProfile(req, res) {
  try {
    const {
      full_name,
      phone,
      birth_date,
      gender,
      city,
      country,
      preferred_language,
      addiction_type,
      consumption_level,
    } = req.body;

    await query(
      `
      UPDATE users
      SET
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        birth_date = COALESCE(?, birth_date),
        gender = COALESCE(?, gender),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        preferred_language = COALESCE(?, preferred_language),
        addiction_type = COALESCE(?, addiction_type),
        consumption_level = COALESCE(?, consumption_level)
      WHERE id = ?
      `,
      [
        full_name || null,
        phone || null,
        birth_date || null,
        gender || null,
        city || null,
        country || null,
        preferred_language || null,
        addiction_type || null,
        consumption_level || null,
        req.auth.id,
      ]
    );

    const users = await query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        birth_date,
        gender,
        city,
        country,
        preferred_language,
        addiction_type,
        consumption_level,
        risk_level,
        is_active,
        is_verified,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      `,
      [req.auth.id]
    );

    return res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      user: users[0],
    });
  } catch (error) {
    console.error("Erreur updateMyProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur modification profil",
      error: error.message,
    });
  }
}

// =======================
// CHANGE PASSWORD
// =======================
async function changePassword(req, res) {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Ancien et nouveau mot de passe obligatoires",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères",
      });
    }

    const users = await query(
      "SELECT password_hash FROM users WHERE id = ?",
      [req.auth.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    const ok = await bcrypt.compare(old_password, users[0].password_hash);

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: "Ancien mot de passe incorrect",
      });
    }

    const hash = await bcrypt.hash(new_password, 10);

    await query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [hash, req.auth.id]
    );

    return res.json({
      success: true,
      message: "Mot de passe changé avec succès",
    });
  } catch (error) {
    console.error("Erreur changePassword:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur changement mot de passe",
      error: error.message,
    });
  }
}

// =======================
// SAUVEGARDER QUESTIONNAIRE SIMPLE
// =======================
async function createQuestionnaire(req, res) {
  try {
    const userId = req.auth.id;

    const {
      questionnaire_type,
      answers,
      total_score,
      risk_level,
    } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({
        success: false,
        message: "Les réponses du formulaire sont obligatoires",
      });
    }

    const result = await query(
      `
      INSERT INTO questionnaires (
        user_id,
        questionnaire_type,
        answers,
        total_score,
        risk_level
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        userId,
        questionnaire_type || "initial",
        JSON.stringify(answers),
        Number(total_score || 0),
        risk_level || "unknown",
      ]
    );

    await query(
      `
      UPDATE users
      SET risk_level = ?
      WHERE id = ?
      `,
      [risk_level || "unknown", userId]
    );

    return res.status(201).json({
      success: true,
      message: "Réponses du questionnaire sauvegardées avec succès",
      questionnaire: {
        id: result.insertId,
        user_id: userId,
        questionnaire_type: questionnaire_type || "initial",
        answers,
        total_score: Number(total_score || 0),
        risk_level: risk_level || "unknown",
      },
    });
  } catch (error) {
    console.error("Erreur createQuestionnaire:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur sauvegarde questionnaire",
      error: error.message,
    });
  }
}

// =======================
// QUESTIONNAIRE COMPLET
// Sauvegarder + Python /nlp + conversation + Python /chat
// =======================
async function submitFullQuestionnaire(req, res) {
  try {
    const userId = req.auth.id;

    const {
      title,
      questionnaire_type,
      questionnaire,
      message,
    } = req.body;

    if (!questionnaire || typeof questionnaire !== "object") {
      return res.status(400).json({
        success: false,
        message: "Les réponses du questionnaire sont obligatoires",
      });
    }

    const finalMessage =
      message ||
      "L'utilisateur a complété le questionnaire initial et demande une analyse.";

    // 1. Appeler Python /nlp
    const nlpResult = await analyzeMessageWithPython(
      finalMessage,
      questionnaire
    );

    const data = extractNlpData(nlpResult);

    const totalScore = Number(data.riskScore || 0);
    const riskLevel = data.riskLevel || "unknown";

    const summary = `${data.analysisSummary} ${data.diagnosticSummary}`.trim();

    // 2. Sauvegarder questionnaire
    const questionnaireResult = await query(
      `
      INSERT INTO questionnaires (
        user_id,
        questionnaire_type,
        answers,
        total_score,
        risk_level
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        userId,
        questionnaire_type || "initial",
        JSON.stringify(questionnaire),
        totalScore,
        riskLevel,
      ]
    );

    // 3. Créer conversation
    const conversationResult = await query(
      `
      INSERT INTO conversations (
        user_id,
        title,
        status,
        summary,
        emotional_state,
        risk_level
      )
      VALUES (?, ?, 'open', ?, ?, ?)
      `,
      [
        userId,
        title || "Conversation après questionnaire",
        summary || null,
        data.emotionalState,
        riskLevel,
      ]
    );

    const conversationId = conversationResult.insertId;

    // 4. Sauvegarder message USER
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
      [conversationId, finalMessage]
    );

    const userMessageId = userMessageResult.insertId;

    // 5. Sauvegarder analyse Python
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
        conversationId,
        userMessageId,
        data.sentiment,
        data.emotion,
        data.intent,
        totalScore,
        riskLevel,
        JSON.stringify(data.dominantEmotions),
        "fastapi-python-nlp",
        JSON.stringify(nlpResult),
      ]
    );

    // 6. Mettre à jour user
    await query(
      `
      UPDATE users
      SET risk_level = ?
      WHERE id = ?
      `,
      [riskLevel, userId]
    );

    // 7. Créer alerte si risque élevé
    if (riskLevel === "eleve" || riskLevel === "critique") {
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
          conversationId,
          riskLevel === "critique" ? "emergency" : "addiction_high_risk",
          riskLevel,
          finalMessage.substring(0, 500),
        ]
      );
    }

    // 8. Appeler Python /chat
    const chatResult = await generateReplyWithPython({
      message: finalMessage,
      summary_context: summary || "",
      emotional_state: data.emotionalState,
      risk_level: riskLevel,
    });

    const botReply =
      chatResult?.reply ||
      data.therapyMessage ||
      "Je suis là pour t’écouter. Tu peux continuer la discussion.";

    // 9. Sauvegarder message ASSISTANT
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
      [conversationId, botReply]
    );

    return res.status(201).json({
      success: true,
      message:
        "Questionnaire sauvegardé, traité par Python et conversation sauvegardée",
      questionnaire: {
        id: questionnaireResult.insertId,
        answers: questionnaire,
        total_score: totalScore,
        risk_level: riskLevel,
      },
      conversation: {
        id: conversationId,
        title: title || "Conversation après questionnaire",
        summary,
        emotional_state: data.emotionalState,
        risk_level: riskLevel,
      },
      user_message: {
        id: userMessageId,
        text: finalMessage,
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
        risk_score: totalScore,
        risk_level: riskLevel,
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
    console.error("Erreur submitFullQuestionnaire:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur traitement complet questionnaire",
      error: error.message,
    });
  }
}

// =======================
// GET QUESTIONNAIRES
// =======================
async function getMyQuestionnaires(req, res) {
  try {
    const questionnaires = await query(
      `
      SELECT *
      FROM questionnaires
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.auth.id]
    );

    const parsedQuestionnaires = questionnaires.map((q) => {
      let parsedAnswers = q.answers;

      try {
        parsedAnswers =
          typeof q.answers === "string" ? JSON.parse(q.answers) : q.answers;
      } catch {
        parsedAnswers = q.answers;
      }

      return {
        ...q,
        answers: parsedAnswers,
      };
    });

    return res.json({
      success: true,
      questionnaires: parsedQuestionnaires,
    });
  } catch (error) {
    console.error("Erreur getMyQuestionnaires:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération questionnaires",
      error: error.message,
    });
  }
}

// =======================
// DELETE ACCOUNT
// =======================
async function deactivateMyAccount(req, res) {
  try {
    await query(
      "UPDATE users SET is_active = FALSE WHERE id = ?",
      [req.auth.id]
    );

    return res.json({
      success: true,
      message: "Compte désactivé avec succès",
    });
  } catch (error) {
    console.error("Erreur deactivateMyAccount:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur désactivation compte",
      error: error.message,
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  createQuestionnaire,
  submitFullQuestionnaire,
  getMyQuestionnaires,
  deactivateMyAccount,
};