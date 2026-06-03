const { query } = require("../database/db");

const {
  generateRecommendationsForUser,
} = require("../services/recommendationService");

// =======================
// GENERATE RECOMMENDATIONS
// =======================
async function generateRecommendations(req, res) {
  try {
    const userId = req.auth.id;

    const recommendations = await generateRecommendationsForUser(userId, 3);

    if (recommendations.length === 0) {
      return res.json({
        success: true,
        message: "Aucun psychologue validé disponible pour le moment",
        recommendations: [],
      });
    }

    return res.json({
      success: true,
      message: "Recommandations générées avec succès selon l’analyse IA Python",
      recommendations,
    });
  } catch (error) {
    console.error("Erreur generateRecommendations:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur génération recommandations",
      error: error.message,
    });
  }
}

// =======================
// GET MY RECOMMENDATIONS
// =======================
async function getMyRecommendations(req, res) {
  try {
    const userId = req.auth.id;

    const recommendations = await query(
      `
      SELECT 
        pr.id AS recommendation_id,
        pr.user_id,
        pr.psychologist_id,
        pr.recommendation_score,
        pr.reason,
        pr.status,
        pr.created_at,

        p.full_name,
        p.email,
        p.phone,
        p.license_number,
        p.specialization,
        p.experience_years,
        p.city,
        p.country,
        p.languages,
        p.accepts_online,
        p.accepts_in_person,
        p.consultation_price,
        p.currency,
        p.rating,
        p.is_verified,
        p.is_active
      FROM psychologist_recommendations pr
      JOIN psychologists p ON p.id = pr.psychologist_id
      WHERE pr.user_id = ?
      ORDER BY pr.recommendation_score DESC, pr.created_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("Erreur getMyRecommendations:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération recommandations",
      error: error.message,
    });
  }
}

// =======================
// ACCEPT RECOMMENDATION
// Ici le patient choisit le psychologue.
// Le dossier devient disponible au psychologue grâce à psychologist_assignments.
// =======================
async function acceptRecommendation(req, res) {
  try {
    const userId = req.auth.id;
    const { id } = req.params;

    const recommendations = await query(
      `
      SELECT *
      FROM psychologist_recommendations
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (recommendations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recommandation introuvable",
      });
    }

    const recommendation = recommendations[0];

    if (recommendation.status === "accepted") {
      return res.status(409).json({
        success: false,
        message: "Cette recommandation est déjà acceptée",
      });
    }

    const psychologists = await query(
      `
      SELECT *
      FROM psychologists
      WHERE id = ?
        AND is_active = TRUE
        AND is_verified = TRUE
      LIMIT 1
      `,
      [recommendation.psychologist_id]
    );

    if (psychologists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Psychologue introuvable ou non validé",
      });
    }

    const psychologist = psychologists[0];

    const existingAssignment = await query(
      `
      SELECT *
      FROM psychologist_assignments
      WHERE user_id = ?
        AND psychologist_id = ?
        AND status = 'active'
      LIMIT 1
      `,
      [userId, recommendation.psychologist_id]
    );

    if (existingAssignment.length > 0) {
      await query(
        `
        UPDATE psychologist_recommendations
        SET status = 'accepted'
        WHERE id = ?
        `,
        [id]
      );

      return res.json({
        success: true,
        message:
          "Ce psychologue est déjà affecté à cet utilisateur. Le dossier est déjà disponible.",
        assignment_id: existingAssignment[0].id,
        psychologist: {
          id: psychologist.id,
          full_name: psychologist.full_name,
          email: psychologist.email,
          phone: psychologist.phone,
          specialization: psychologist.specialization,
          city: psychologist.city,
          languages: psychologist.languages,
        },
      });
    }

    const assignmentResult = await query(
      `
      INSERT INTO psychologist_assignments (
        user_id,
        psychologist_id,
        assigned_by,
        status
      )
      VALUES (?, ?, 'user', 'active')
      `,
      [userId, recommendation.psychologist_id]
    );

    await query(
      `
      UPDATE psychologist_recommendations
      SET status = 'accepted'
      WHERE id = ?
      `,
      [id]
    );

    await query(
      `
      UPDATE psychologist_recommendations
      SET status = 'rejected'
      WHERE user_id = ?
        AND id <> ?
        AND status = 'suggested'
      `,
      [userId, id]
    );

    await query(
      `
      UPDATE psychologists
      SET current_active_cases = current_active_cases + 1
      WHERE id = ?
      `,
      [recommendation.psychologist_id]
    );

    await query(
      `
      INSERT INTO notifications (
        receiver_type,
        receiver_id,
        title,
        message,
        type,
        is_read
      )
      VALUES ('psychologist', ?, ?, ?, 'assignment', FALSE)
      `,
      [
        recommendation.psychologist_id,
        "Nouveau dossier patient disponible",
        "Un patient vous a choisi. Son dossier clinique est maintenant disponible dans votre espace psychologue.",
      ]
    );

    await query(
      `
      INSERT INTO notifications (
        receiver_type,
        receiver_id,
        title,
        message,
        type,
        is_read
      )
      VALUES ('user', ?, ?, ?, 'assignment', FALSE)
      `,
      [
        userId,
        "Psychologue affecté",
        `Vous êtes maintenant affecté à ${psychologist.full_name}. Votre dossier clinique est partagé avec ce psychologue.`,
      ]
    );

    return res.json({
      success: true,
      message:
        "Recommandation acceptée. Psychologue affecté et dossier patient disponible.",
      assignment_id: assignmentResult.insertId,
      psychologist: {
        id: psychologist.id,
        full_name: psychologist.full_name,
        email: psychologist.email,
        phone: psychologist.phone,
        specialization: psychologist.specialization,
        city: psychologist.city,
        languages: psychologist.languages,
      },
    });
  } catch (error) {
    console.error("Erreur acceptRecommendation:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur acceptation recommandation",
      error: error.message,
    });
  }
}

// =======================
// REJECT RECOMMENDATION
// =======================
async function rejectRecommendation(req, res) {
  try {
    const userId = req.auth.id;
    const { id } = req.params;

    const recommendations = await query(
      `
      SELECT *
      FROM psychologist_recommendations
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (recommendations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recommandation introuvable",
      });
    }

    await query(
      `
      UPDATE psychologist_recommendations
      SET status = 'rejected'
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Recommandation refusée",
    });
  } catch (error) {
    console.error("Erreur rejectRecommendation:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur refus recommandation",
      error: error.message,
    });
  }
}

// =======================
// GET MY ACTIVE PSYCHOLOGIST
// =======================
async function getMyActivePsychologist(req, res) {
  try {
    const userId = req.auth.id;

    const assignments = await query(
      `
      SELECT
        pa.id AS assignment_id,
        pa.status AS assignment_status,
        pa.assigned_by,
        pa.start_date,
        pa.end_date,

        p.id AS psychologist_id,
        p.full_name,
        p.email,
        p.phone,
        p.license_number,
        p.specialization,
        p.experience_years,
        p.city,
        p.country,
        p.languages,
        p.accepts_online,
        p.accepts_in_person,
        p.consultation_price,
        p.currency,
        p.rating
      FROM psychologist_assignments pa
      JOIN psychologists p ON p.id = pa.psychologist_id
      WHERE pa.user_id = ?
        AND pa.status = 'active'
      ORDER BY pa.start_date DESC
      LIMIT 1
      `,
      [userId]
    );

    return res.json({
      success: true,
      psychologist: assignments.length > 0 ? assignments[0] : null,
    });
  } catch (error) {
    console.error("Erreur getMyActivePsychologist:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération psychologue actif",
      error: error.message,
    });
  }
}

module.exports = {
  generateRecommendations,
  getMyRecommendations,
  acceptRecommendation,
  rejectRecommendation,
  getMyActivePsychologist,
};