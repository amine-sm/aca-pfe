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
 * POST /api/qwen-onboarding/generate
 * Le user écrit son texte → Qwen génère 10 questions personnalisées
 */
async function generateQuestions(req, res) {
  try {
    const { free_text, nb_questions } = req.body;

    if (!free_text || free_text.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Le texte est trop court (min 5 caractères).",
      });
    }

    const data = await callPython("/qwen-onboarding/generate", {
      free_text,
      nb_questions: Number(nb_questions) || 10,
    });

    return res.json(data);
  } catch (error) {
    console.error("Erreur generateQuestions:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur de génération des questions",
      error: error.message,
    });
  }
}


/**
 * POST /api/qwen-onboarding/finish
 * Le user a répondu aux questions → on construit son profil + on sauvegarde
 */
async function finishOnboarding(req, res) {
  try {
    const userId = req.auth.id;
    const { free_text, answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Veuillez répondre à au moins une question",
      });
    }

    // Appel Python pour calculer le profil
    const result = await callPython("/qwen-onboarding/finish", {
      free_text: free_text || "",
      answers,
    });

    const profile = result.profile || {};
    const riskLevel = profile?.risk?.level || "faible";
    const orientationType = profile?.orientation?.type || "self_support";

    // Mise à jour du user
    await query(
      `UPDATE users SET risk_level = ? WHERE id = ?`,
      [riskLevel, userId]
    );

    // Sauvegarde dans onboarding_profiles
    let profileId = null;
    try {
      const insertResult = await query(
        `
        INSERT INTO onboarding_profiles (
          user_id,
          addiction_type,
          free_text,
          risk_level,
          risk_score,
          orientation_type,
          sentiment,
          dominant_emotions,
          recommendations,
          answers,
          full_profile
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          "general",  // pas de choix d'addiction dans ce flow simplifié
          (free_text || "").substring(0, 2000),
          riskLevel,
          Number(profile?.risk?.score || 0),
          orientationType,
          profile?.nlp?.sentiment || "neutre",
          JSON.stringify(profile?.nlp?.dominant_emotions || []),
          JSON.stringify(profile?.recommendations || []),
          JSON.stringify(answers || []),
          JSON.stringify(profile),
        ]
      );
      profileId = insertResult.insertId;
    } catch (dbError) {
      console.warn("Sauvegarde BDD impossible:", dbError.message);
    }

    return res.json({
      success: true,
      profile_id: profileId,
      profile,
    });
  } catch (error) {
    console.error("Erreur finishOnboarding:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la finalisation",
      error: error.message,
    });
  }
}


module.exports = {
  generateQuestions,
  finishOnboarding,
};
