const { query } = require("../database/db");

// =======================
// Nettoyer les créneaux expirés
// Supprime seulement les créneaux disponibles qui sont passés
// =======================
async function deleteExpiredAvailableSlots() {
  await query(
    `
    DELETE FROM psychologist_slots
    WHERE status = 'available'
      AND STR_TO_DATE(CONCAT(slot_date, ' ', end_time), '%Y-%m-%d %H:%i:%s') < NOW()
    `
  );
}

// =======================
// CREATE SLOT PSYCHOLOGIST
// Bloque :
// - date/heure passée
// - même créneau déjà créé
// - chevauchement avec un autre créneau
// =======================
async function createSlot(req, res) {
  try {
    const psychologistId = req.auth.id;
    const { slot_date, start_time, end_time, mode } = req.body;

    if (!slot_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "La date, l'heure début et l'heure fin sont obligatoires.",
      });
    }

    if (String(start_time) >= String(end_time)) {
      return res.status(400).json({
        success: false,
        message: "L'heure de fin doit être supérieure à l'heure de début.",
      });
    }

    const allowedModes = ["online", "in_person"];
    const finalMode = allowedModes.includes(mode) ? mode : "online";

    await deleteExpiredAvailableSlots();

    // Vérifier date/heure invalide ou passée côté serveur
    const passedCheck = await query(
      `
      SELECT
        CASE
          WHEN STR_TO_DATE(CONCAT(?, ' ', ?), '%Y-%m-%d %H:%i') IS NULL
          THEN 1
          WHEN STR_TO_DATE(CONCAT(?, ' ', ?), '%Y-%m-%d %H:%i') <= NOW()
          THEN 1
          ELSE 0
        END AS is_invalid_or_passed
      `,
      [slot_date, start_time, slot_date, start_time]
    );

    if (
      passedCheck.length === 0 ||
      Number(passedCheck[0].is_invalid_or_passed) === 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Impossible de créer un créneau dans le passé.",
      });
    }

    // Vérifier conflit / chevauchement
    // Exemple bloqué :
    // existant 10:00 - 10:45
    // nouveau 10:15 - 10:30
    // nouveau 10:30 - 11:00
    const conflict = await query(
      `
      SELECT id, start_time, end_time, status
      FROM psychologist_slots
      WHERE psychologist_id = ?
        AND slot_date = ?
        AND status != 'cancelled'
        AND (
          ? < end_time
          AND ? > start_time
        )
      LIMIT 1
      `,
      [psychologistId, slot_date, start_time, end_time]
    );

    if (conflict.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Ce créneau est déjà pris ou chevauche un autre créneau existant.",
      });
    }

    const result = await query(
      `
      INSERT INTO psychologist_slots (
        psychologist_id,
        slot_date,
        start_time,
        end_time,
        mode,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'available')
      `,
      [psychologistId, slot_date, start_time, end_time, finalMode]
    );

    return res.status(201).json({
      success: true,
      message: "Créneau ajouté avec succès.",
      slot: {
        id: result.insertId,
        psychologist_id: psychologistId,
        slot_date,
        start_time,
        end_time,
        mode: finalMode,
        status: "available",
      },
    });
  } catch (error) {
    console.error("Erreur createSlot:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur création créneau.",
      error: error.message,
    });
  }
}

// =======================
// GET MY SLOTS PSYCHOLOGIST
// =======================
async function getMySlots(req, res) {
  try {
    await deleteExpiredAvailableSlots();

    const psychologistId = req.auth.id;

    const slots = await query(
      `
      SELECT
        s.id,
        s.psychologist_id,
        s.slot_date,
        s.start_time,
        s.end_time,
        s.mode,
        s.status,
        s.created_at,

        a.id AS appointment_id,
        a.user_id AS appointment_user_id,
        a.status AS appointment_status,

        u.full_name AS user_name,
        u.email AS user_email

      FROM psychologist_slots s

      LEFT JOIN appointments a
        ON a.id = (
          SELECT a2.id
          FROM appointments a2
          WHERE a2.slot_id = s.id
          ORDER BY a2.created_at DESC, a2.id DESC
          LIMIT 1
        )

      LEFT JOIN users u ON u.id = a.user_id

      WHERE s.psychologist_id = ?
      ORDER BY s.slot_date DESC, s.start_time ASC
      `,
      [psychologistId]
    );

    return res.json({
      success: true,
      slots,
    });
  } catch (error) {
    console.error("Erreur getMySlots:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération des créneaux.",
      error: error.message,
    });
  }
}

// =======================
// GET AVAILABLE SLOTS USER
// =======================
async function getAvailableSlots(req, res) {
  try {
    await deleteExpiredAvailableSlots();

    const { psychologist_id } = req.params;

    const slots = await query(
      `
      SELECT
        id,
        psychologist_id,
        slot_date,
        start_time,
        end_time,
        mode,
        status
      FROM psychologist_slots
      WHERE psychologist_id = ?
        AND status = 'available'
        AND STR_TO_DATE(CONCAT(slot_date, ' ', start_time), '%Y-%m-%d %H:%i:%s') >= NOW()
      ORDER BY slot_date ASC, start_time ASC
      `,
      [psychologist_id]
    );

    return res.json({
      success: true,
      slots,
    });
  } catch (error) {
    console.error("Erreur getAvailableSlots:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération des créneaux disponibles.",
      error: error.message,
    });
  }
}

// =======================
// DELETE SLOT PSYCHOLOGIST
// Supprime seulement si le créneau n'est pas pris
// =======================
async function deleteSlot(req, res) {
  try {
    const psychologistId = req.auth.id;
    const { id } = req.params;

    const slots = await query(
      `
      SELECT *
      FROM psychologist_slots
      WHERE id = ?
        AND psychologist_id = ?
      LIMIT 1
      `,
      [id, psychologistId]
    );

    if (slots.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Créneau introuvable.",
      });
    }

    const slot = slots[0];

    if (slot.status === "booked") {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer un créneau déjà pris.",
      });
    }

    const appointments = await query(
      `
      SELECT id
      FROM appointments
      WHERE slot_id = ?
        AND psychologist_id = ?
        AND status NOT IN ('cancelled', 'completed', 'no_show')
      LIMIT 1
      `,
      [id, psychologistId]
    );

    if (appointments.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Impossible de supprimer ce créneau car il contient un rendez-vous.",
      });
    }

    await query(
      `
      DELETE FROM psychologist_slots
      WHERE id = ?
        AND psychologist_id = ?
      `,
      [id, psychologistId]
    );

    return res.json({
      success: true,
      message: "Créneau supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur deleteSlot:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur suppression créneau.",
      error: error.message,
    });
  }
}

module.exports = {
  createSlot,
  getMySlots,
  getAvailableSlots,
  deleteSlot,
};