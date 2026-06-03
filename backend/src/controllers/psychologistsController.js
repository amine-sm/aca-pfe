const bcrypt = require("bcryptjs");
const { query } = require("../database/db");
const { generateToken } = require("../utils/jwt");

// =======================
// REGISTER PSYCHOLOGIST
// =======================
async function registerPsychologist(req, res) {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      license_number,
      specialization,
      experience_years,
      city,
      country,
      languages,
      accepts_online,
      accepts_in_person,
      consultation_price,
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

    const existingPsychologist = await query(
      `
      SELECT id
      FROM psychologists
      WHERE email = ?
      `,
      [email]
    );

    if (existingPsychologist.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé par un psychologue",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `
      INSERT INTO psychologists (
        full_name,
        email,
        phone,
        password_hash,
        license_number,
        specialization,
        experience_years,
        city,
        country,
        languages,
        accepts_online,
        accepts_in_person,
        consultation_price,
        currency,
        max_active_cases,
        current_active_cases,
        rating,
        is_verified,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DZD', 20, 0, 0, FALSE, TRUE)
      `,
      [
        full_name,
        email,
        phone || null,
        password_hash,
        license_number || null,
        specialization || null,
        Number(experience_years || 0),
        city || null,
        country || "Algeria",
        languages || "français,arabe",
        accepts_online !== undefined ? Boolean(accepts_online) : true,
        accepts_in_person !== undefined ? Boolean(accepts_in_person) : false,
        Number(consultation_price || 0),
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Compte psychologue créé avec succès. En attente de validation par l’admin.",
      psychologist: {
        id: result.insertId,
        full_name,
        email,
        phone: phone || null,
        license_number: license_number || null,
        specialization: specialization || null,
        experience_years: Number(experience_years || 0),
        city: city || null,
        country: country || "Algeria",
        languages: languages || "français,arabe",
        accepts_online:
          accepts_online !== undefined ? Boolean(accepts_online) : true,
        accepts_in_person:
          accepts_in_person !== undefined ? Boolean(accepts_in_person) : false,
        consultation_price: Number(consultation_price || 0),
        currency: "DZD",
        is_verified: false,
        is_active: true,
      },
    });
  } catch (error) {
    console.error("Erreur registerPsychologist:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur création compte psychologue",
      error: error.message,
    });
  }
}

// =======================
// LOGIN PSYCHOLOGIST
// =======================
async function loginPsychologist(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe obligatoires",
      });
    }

    const psychologists = await query(
      `
      SELECT *
      FROM psychologists
      WHERE email = ?
        AND is_active = TRUE
      `,
      [email]
    );

    if (psychologists.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    const psychologist = psychologists[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      psychologist.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    if (!psychologist.is_verified) {
      return res.status(403).json({
        success: false,
        message:
          "Votre compte psychologue est en attente de validation par l’admin",
      });
    }

    const token = generateToken({
      id: psychologist.id,
      role: "PSYCHOLOGIST",
    });

    delete psychologist.password_hash;

    return res.json({
      success: true,
      message: "Connexion psychologue réussie",
      token,
      psychologist: {
        ...psychologist,
        role: "PSYCHOLOGIST",
      },
    });
  } catch (error) {
    console.error("Erreur loginPsychologist:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur connexion psychologue",
      error: error.message,
    });
  }
}

// =======================
// LIST PUBLIC PSYCHOLOGISTS
// =======================
async function listPublicPsychologists(req, res) {
  try {
    const psychologists = await query(
      `
      SELECT
        id,
        full_name,
        phone,
        license_number,
        specialization,
        experience_years,
        city,
        country,
        languages,
        accepts_online,
        accepts_in_person,
        consultation_price,
        currency,
        max_active_cases,
        current_active_cases,
        rating,
        is_verified,
        created_at
      FROM psychologists
      WHERE is_active = TRUE
        AND is_verified = TRUE
      ORDER BY rating DESC, experience_years DESC, full_name ASC
      `
    );

    return res.json({
      success: true,
      psychologists,
    });
  } catch (error) {
    console.error("Erreur listPublicPsychologists:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération psychologues",
      error: error.message,
    });
  }
}

// =======================
// GET MY PSYCHOLOGIST PROFILE
// =======================
async function getMyPsychologistProfile(req, res) {
  try {
    return res.json({
      success: true,
      psychologist: req.psychologist,
    });
  } catch (error) {
    console.error("Erreur getMyPsychologistProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération profil psychologue",
      error: error.message,
    });
  }
}

// =======================
// UPDATE MY PSYCHOLOGIST PROFILE
// =======================
async function updateMyPsychologistProfile(req, res) {
  try {
    const psychologistId = req.auth.id;

    const {
      full_name,
      phone,
      license_number,
      specialization,
      experience_years,
      city,
      country,
      languages,
      accepts_online,
      accepts_in_person,
      consultation_price,
      max_active_cases,
    } = req.body;

    await query(
      `
      UPDATE psychologists
      SET
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        license_number = COALESCE(?, license_number),
        specialization = COALESCE(?, specialization),
        experience_years = COALESCE(?, experience_years),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        languages = COALESCE(?, languages),
        accepts_online = COALESCE(?, accepts_online),
        accepts_in_person = COALESCE(?, accepts_in_person),
        consultation_price = COALESCE(?, consultation_price),
        max_active_cases = COALESCE(?, max_active_cases)
      WHERE id = ?
      `,
      [
        full_name || null,
        phone || null,
        license_number || null,
        specialization || null,
        experience_years !== undefined ? Number(experience_years) : null,
        city || null,
        country || null,
        languages || null,
        accepts_online !== undefined ? Boolean(accepts_online) : null,
        accepts_in_person !== undefined ? Boolean(accepts_in_person) : null,
        consultation_price !== undefined ? Number(consultation_price) : null,
        max_active_cases !== undefined ? Number(max_active_cases) : null,
        psychologistId,
      ]
    );

    const psychologists = await query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        license_number,
        specialization,
        experience_years,
        city,
        country,
        languages,
        accepts_online,
        accepts_in_person,
        consultation_price,
        currency,
        max_active_cases,
        current_active_cases,
        rating,
        is_verified,
        is_active,
        created_at,
        updated_at
      FROM psychologists
      WHERE id = ?
      `,
      [psychologistId]
    );

    return res.json({
      success: true,
      message: "Profil psychologue mis à jour avec succès",
      psychologist: psychologists[0],
    });
  } catch (error) {
    console.error("Erreur updateMyPsychologistProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur modification profil psychologue",
      error: error.message,
    });
  }
}

// =======================
// CHANGE PSYCHOLOGIST PASSWORD
// =======================
async function changePsychologistPassword(req, res) {
  try {
    const psychologistId = req.auth.id;
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

    const psychologists = await query(
      `
      SELECT id, password_hash
      FROM psychologists
      WHERE id = ?
      `,
      [psychologistId]
    );

    if (psychologists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Psychologue introuvable",
      });
    }

    const isOldPasswordValid = await bcrypt.compare(
      old_password,
      psychologists[0].password_hash
    );

    if (!isOldPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Ancien mot de passe incorrect",
      });
    }

    const newPasswordHash = await bcrypt.hash(new_password, 10);

    await query(
      `
      UPDATE psychologists
      SET password_hash = ?
      WHERE id = ?
      `,
      [newPasswordHash, psychologistId]
    );

    return res.json({
      success: true,
      message: "Mot de passe psychologue changé avec succès",
    });
  } catch (error) {
    console.error("Erreur changePsychologistPassword:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur changement mot de passe psychologue",
      error: error.message,
    });
  }
}

// =======================
// GET MY PATIENTS
// =======================
async function getMyPatients(req, res) {
  try {
    const psychologistId = req.auth.id;

    const patients = await query(
      `
      SELECT
        pa.id AS assignment_id,
        pa.status AS assignment_status,
        pa.assigned_by,
        pa.start_date,
        pa.end_date,

        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        u.birth_date,
        u.gender,
        u.city,
        u.country,
        u.preferred_language,
        u.addiction_type,
        u.consumption_level,
        u.risk_level,
        u.is_active,
        u.created_at AS user_created_at
      FROM psychologist_assignments pa
      JOIN users u ON u.id = pa.user_id
      WHERE pa.psychologist_id = ?
      ORDER BY pa.start_date DESC
      `,
      [psychologistId]
    );

    return res.json({
      success: true,
      patients,
    });
  } catch (error) {
    console.error("Erreur getMyPatients:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération patients du psychologue",
      error: error.message,
    });
  }
}

// =======================
// GET PATIENT DETAIL
// =======================
async function getPatientDetail(req, res) {
  try {
    const psychologistId = req.auth.id;
    const { userId } = req.params;

    const assignments = await query(
      `
      SELECT *
      FROM psychologist_assignments
      WHERE psychologist_id = ?
        AND user_id = ?
        AND status = 'active'
      `,
      [psychologistId, userId]
    );

    if (assignments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Ce patient n’est pas affecté à ce psychologue",
      });
    }

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
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient introuvable",
      });
    }

    const questionnaires = await query(
      `
      SELECT *
      FROM questionnaires
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    const conversations = await query(
      `
      SELECT *
      FROM conversations
      WHERE user_id = ?
      ORDER BY started_at DESC
      `,
      [userId]
    );

    const alerts = await query(
      `
      SELECT *
      FROM risk_alerts
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      patient: users[0],
      questionnaires,
      conversations,
      alerts,
    });
  } catch (error) {
    console.error("Erreur getPatientDetail:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération détail patient",
      error: error.message,
    });
  }
}

// =======================
// DEACTIVATE MY PSYCHOLOGIST ACCOUNT
// =======================
async function deactivateMyPsychologistAccount(req, res) {
  try {
    const psychologistId = req.auth.id;

    await query(
      `
      UPDATE psychologists
      SET is_active = FALSE
      WHERE id = ?
      `,
      [psychologistId]
    );

    return res.json({
      success: true,
      message: "Compte psychologue désactivé avec succès",
    });
  } catch (error) {
    console.error("Erreur deactivateMyPsychologistAccount:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur désactivation compte psychologue",
      error: error.message,
    });
  }
}

module.exports = {
  registerPsychologist,
  loginPsychologist,
  listPublicPsychologists,
  getMyPsychologistProfile,
  updateMyPsychologistProfile,
  changePsychologistPassword,
  getMyPatients,
  getPatientDetail,
  deactivateMyPsychologistAccount,
};