const { query } = require("../database/db");

// =======================
// CREATE APPOINTMENT USER
// =======================
async function createAppointment(req, res) {
  try {
    const userId = req.auth.id;

    const { slot_id, notes } = req.body;

    if (!slot_id) {
      return res.status(400).json({
        success: false,
        message: "Veuillez choisir un créneau disponible.",
      });
    }

    const slots = await query(
      `
      SELECT
        s.*,
        p.consultation_price,
        p.currency
      FROM psychologist_slots s
      JOIN psychologists p ON p.id = s.psychologist_id
      WHERE s.id = ?
        AND s.status = 'available'
        AND p.is_active = 1
        AND p.is_verified = 1
      LIMIT 1
      `,
      [slot_id]
    );

    if (slots.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ce créneau est indisponible ou déjà pris.",
      });
    }

    const slot = slots[0];

    const assignments = await query(
      `
      SELECT id
      FROM psychologist_assignments
      WHERE user_id = ?
        AND psychologist_id = ?
        AND status = 'active'
      LIMIT 1
      `,
      [userId, slot.psychologist_id]
    );

    if (assignments.length === 0) {
      return res.status(403).json({
        success: false,
        message:
          "Vous devez accepter ce psychologue avant de prendre un rendez-vous.",
      });
    }

    const alreadyExists = await query(
      `
      SELECT id
      FROM appointments
      WHERE slot_id = ?
        AND status IN ('pending', 'confirmed', 'pending_payment')
      LIMIT 1
      `,
      [slot.id]
    );

    if (alreadyExists.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ce créneau est déjà réservé.",
      });
    }

    const appointmentDate = `${slot.slot_date} ${slot.start_time}`;

    const result = await query(
      `
      INSERT INTO appointments (
        user_id,
        psychologist_id,
        slot_id,
        appointment_date,
        duration_minutes,
        mode,
        status,
        payment_status,
        price,
        currency,
        notes
      )
      VALUES (?, ?, ?, ?, 45, ?, 'pending', 'unpaid', ?, ?, ?)
      `,
      [
        userId,
        slot.psychologist_id,
        slot.id,
        appointmentDate,
        slot.mode || "online",
        Number(slot.consultation_price || 0),
        slot.currency || "DZD",
        notes || null,
      ]
    );

    await query(
      `
      UPDATE psychologist_slots
      SET status = 'pending'
      WHERE id = ?
      `,
      [slot.id]
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
      VALUES ('psychologist', ?, ?, ?, 'appointment', 0)
      `,
      [
        slot.psychologist_id,
        "Nouvelle demande de rendez-vous",
        "Un utilisateur a choisi un de vos créneaux. Veuillez confirmer ou annuler le rendez-vous.",
      ]
    ).catch(() => null);

    return res.status(201).json({
      success: true,
      message:
        "Demande de rendez-vous envoyée. Le psychologue doit maintenant confirmer.",
      appointment: {
        id: result.insertId,
        user_id: userId,
        psychologist_id: slot.psychologist_id,
        slot_id: slot.id,
        appointment_date: appointmentDate,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Erreur createAppointment:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur création rendez-vous.",
      error: error.message,
    });
  }
}

// =======================
// GET MY APPOINTMENTS USER
// =======================
async function getMyAppointments(req, res) {
  try {
    const userId = req.auth.id;

    const appointments = await query(
      `
      SELECT
        a.id,
        a.user_id,
        a.psychologist_id,
        a.slot_id,
        a.appointment_date,
        a.duration_minutes,
        a.mode,
        a.status,
        a.payment_status,
        a.price,
        a.currency,
        a.notes,
        a.created_at,

        p.full_name AS psychologist_name,
        p.specialization AS psychologist_specialization,
        p.city AS psychologist_city,

        s.slot_date,
        s.start_time,
        s.end_time,
        s.status AS slot_status

      FROM appointments a
      LEFT JOIN psychologists p ON p.id = a.psychologist_id
      LEFT JOIN psychologist_slots s ON s.id = a.slot_id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Erreur getMyAppointments:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération rendez-vous.",
      error: error.message,
    });
  }
}

// =======================
// GET PSYCHOLOGIST APPOINTMENTS
// =======================
async function getPsychologistAppointments(req, res) {
  try {
    const psychologistId = req.auth.id;

    const appointments = await query(
      `
      SELECT
        a.id,
        a.user_id,
        a.psychologist_id,
        a.slot_id,
        a.appointment_date,
        a.duration_minutes,
        a.mode,
        a.status,
        a.payment_status,
        a.price,
        a.currency,
        a.notes,
        a.created_at,

        u.full_name AS user_name,
        u.email AS user_email,
        u.risk_level AS risk_level,

        s.slot_date,
        s.start_time,
        s.end_time,
        s.status AS slot_status

      FROM appointments a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN psychologist_slots s ON s.id = a.slot_id
      WHERE a.psychologist_id = ?
      ORDER BY a.created_at DESC
      `,
      [psychologistId]
    );

    return res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Erreur getPsychologistAppointments:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération rendez-vous psychologue.",
      error: error.message,
    });
  }
}

// =======================
// UPDATE APPOINTMENT STATUS PSYCHOLOGIST
// =======================
async function updateAppointmentStatus(req, res) {
  try {
    const psychologistId = req.auth.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["confirmed", "completed", "cancelled", "no_show"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Statut invalide. Utilisez confirmed, completed, cancelled ou no_show.",
      });
    }

    const appointments = await query(
      `
      SELECT
        a.*,
        u.full_name AS user_name,
        u.email AS user_email
      FROM appointments a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
        AND a.psychologist_id = ?
      LIMIT 1
      `,
      [id, psychologistId]
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable.",
      });
    }

    const appointment = appointments[0];

    if (
      appointment.status === "completed" ||
      appointment.status === "cancelled" ||
      appointment.status === "no_show"
    ) {
      return res.status(400).json({
        success: false,
        message: "Impossible de modifier un rendez-vous déjà finalisé.",
      });
    }

    await query(
      `
      UPDATE appointments
      SET status = ?
      WHERE id = ?
        AND psychologist_id = ?
      `,
      [status, id, psychologistId]
    );

    if (appointment.slot_id) {
      if (status === "confirmed" || status === "completed") {
        await query(
          `
          UPDATE psychologist_slots
          SET status = 'booked'
          WHERE id = ?
            AND psychologist_id = ?
          `,
          [appointment.slot_id, psychologistId]
        );
      }

      if (status === "cancelled" || status === "no_show") {
        await query(
          `
          UPDATE psychologist_slots
          SET status = 'available'
          WHERE id = ?
            AND psychologist_id = ?
          `,
          [appointment.slot_id, psychologistId]
        );
      }
    }

    let notificationTitle = "Statut du rendez-vous modifié";
    let notificationMessage = `Votre rendez-vous est maintenant : ${status}.`;

    if (status === "confirmed") {
      notificationTitle = "Rendez-vous confirmé";
      notificationMessage =
        "Votre psychologue a confirmé votre rendez-vous.";
    }

    if (status === "completed") {
      notificationTitle = "Rendez-vous terminé";
      notificationMessage =
        "Votre psychologue a marqué votre rendez-vous comme terminé.";
    }

    if (status === "cancelled") {
      notificationTitle = "Rendez-vous annulé";
      notificationMessage =
        "Votre psychologue a annulé votre rendez-vous.";
    }

    if (status === "no_show") {
      notificationTitle = "Absence au rendez-vous";
      notificationMessage =
        "Votre rendez-vous a été marqué comme absent.";
    }

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
      VALUES ('user', ?, ?, ?, 'appointment', 0)
      `,
      [appointment.user_id, notificationTitle, notificationMessage]
    ).catch(() => null);

    return res.json({
      success: true,
      message: notificationMessage,
      appointment: {
        id: Number(id),
        user_id: appointment.user_id,
        user_name: appointment.user_name,
        user_email: appointment.user_email,
        status,
        slot_id: appointment.slot_id || null,
      },
    });
  } catch (error) {
    console.error("Erreur updateAppointmentStatus:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur modification statut rendez-vous.",
      error: error.message,
    });
  }
}

// =======================
// CANCEL MY APPOINTMENT USER
// =======================
async function cancelMyAppointment(req, res) {
  try {
    const userId = req.auth.id;
    const { id } = req.params;

    const appointments = await query(
      `
      SELECT *
      FROM appointments
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable.",
      });
    }

    const appointment = appointments[0];

    if (
      appointment.status === "completed" ||
      appointment.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Impossible d'annuler ce rendez-vous.",
      });
    }

    await query(
      `
      UPDATE appointments
      SET status = 'cancelled'
      WHERE id = ?
        AND user_id = ?
      `,
      [id, userId]
    );

    if (appointment.slot_id) {
      await query(
        `
        UPDATE psychologist_slots
        SET status = 'available'
        WHERE id = ?
        `,
        [appointment.slot_id]
      );
    }

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
      VALUES ('psychologist', ?, ?, ?, 'appointment', 0)
      `,
      [
        appointment.psychologist_id,
        "Rendez-vous annulé",
        "Un utilisateur a annulé sa demande de rendez-vous.",
      ]
    ).catch(() => null);

    return res.json({
      success: true,
      message: "Rendez-vous annulé avec succès.",
    });
  } catch (error) {
    console.error("Erreur cancelMyAppointment:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur annulation rendez-vous.",
      error: error.message,
    });
  }
}

module.exports = {
  createAppointment,
  getMyAppointments,
  getPsychologistAppointments,
  updateAppointmentStatus,
  cancelMyAppointment,
};