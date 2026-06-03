const { query } = require("../database/db");

function safeJson(value, fallback) {
  try {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getPatientClinicalProfile(req, res) {
  try {
    const auth = req.auth;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID patient obligatoire.",
      });
    }

    if (auth.role === "PSYCHOLOGIST") {
      const assignments = await query(
        `
        SELECT id
        FROM psychologist_assignments
        WHERE psychologist_id = ?
          AND user_id = ?
          AND status = 'active'
        LIMIT 1
        `,
        [auth.id, userId]
      );

      if (assignments.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Ce patient n'est pas affecté à ce psychologue.",
        });
      }
    }

    const patients = await query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        gender,
        birth_date,
        city,
        country,
        addiction_type,
        consumption_level,
        risk_level,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient introuvable.",
      });
    }

    const profiles = await query(
      `
      SELECT *
      FROM onboarding_profiles
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      `,
      [userId]
    );

    const latest = profiles.length > 0 ? profiles[0] : null;

    const latest_profile = latest
      ? {
          id: latest.id,
          created_at: latest.created_at,
          updated_at: latest.updated_at,
          addiction_type: latest.addiction_type,
          free_text: latest.free_text,
          risk_level: latest.risk_level,
          risk_score: Number(latest.risk_score || 0),
          orientation_type: latest.orientation_type,
          sentiment: latest.sentiment,
          dominant_emotions: safeJson(latest.dominant_emotions, []),
          recommendations: safeJson(latest.recommendations, []),
          answers: safeJson(latest.answers, []),
          full_profile: safeJson(latest.full_profile, null),
        }
      : null;

    const profile_history = profiles.map((p) => ({
      id: p.id,
      addiction_type: p.addiction_type,
      risk_level: p.risk_level,
      risk_score: Number(p.risk_score || 0),
      orientation_type: p.orientation_type,
      created_at: p.created_at,
    }));

    return res.json({
      success: true,
      patient: patients[0],
      latest_profile,
      profile_history,
    });
  } catch (error) {
    console.error("Erreur getPatientClinicalProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération dossier patient.",
      error: error.message,
    });
  }
}

module.exports = {
  getPatientClinicalProfile,
};