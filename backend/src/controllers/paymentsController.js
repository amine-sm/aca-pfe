const { query, transaction } = require("../database/db");

function getPaymentProofFromFile(req) {
  if (!req.file) return null;

  return {
    proof_file_url: `/uploads/payments/${req.file.filename}`,
    proof_file_name: req.file.filename,
    proof_original_name: req.file.originalname,
    proof_mime_type: req.file.mimetype,
    proof_size: req.file.size,
    proof_uploaded_at: new Date().toISOString(),
  };
}
function mergeMetadata(base, extra) {
  return JSON.stringify({
    ...(base || {}),
    ...(extra || {}),
  });
}

// =======================
// GET PLANS
// =======================
async function getPlans(req, res) {
  try {
    const plans = await query(
      `
      SELECT *
      FROM plans
      WHERE is_active = TRUE
      ORDER BY price ASC
      `
    );

    return res.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Erreur getPlans:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération plans",
      error: error.message,
    });
  }
}

// =======================
// CREATE CHECKOUT
// Paiement manuel pour appointment ou plan
// =======================
async function createCheckout(req, res) {
  try {
    const userId = req.auth.id;

    const {
      appointment_id,
      plan_id,
      provider,
      payment_method,
      payment_method_id,
      proof_reference,
      notes,
    } = req.body;

    let amount = 0;
    let psychologistId = null;
    let finalAppointmentId = appointment_id || null;
    let finalPlanId = plan_id || null;
    let description = "";

    // =======================
    // Paiement rendez-vous
    // =======================
    if (appointment_id) {
      const appointments = await query(
        `
        SELECT *
        FROM appointments
        WHERE id = ?
          AND user_id = ?
        `,
        [appointment_id, userId]
      );

      if (appointments.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Rendez-vous introuvable",
        });
      }

      const appointment = appointments[0];

      if (appointment.payment_status === "paid") {
        return res.status(409).json({
          success: false,
          message: "Ce rendez-vous est déjà payé",
        });
      }

      const existingPendingPayments = await query(
        `
        SELECT id, status
        FROM payments
        WHERE appointment_id = ?
          AND user_id = ?
          AND status = 'pending'
        ORDER BY id DESC
        LIMIT 1
        `,
        [appointment_id, userId]
      );

      if (existingPendingPayments.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Un paiement en attente existe déjà pour ce rendez-vous. Attendez la validation admin ou contactez l'administration.",
          payment_id: existingPendingPayments[0].id,
        });
      }

      amount = Number(appointment.price || 0);
      psychologistId = appointment.psychologist_id;
      description = `Paiement rendez-vous #${appointment.id}`;
    }

    // =======================
    // Paiement plan
    // =======================
    else if (plan_id) {
      const plans = await query(
        `
        SELECT *
        FROM plans
        WHERE id = ?
          AND is_active = TRUE
        `,
        [plan_id]
      );

      if (plans.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Plan introuvable",
        });
      }

      const plan = plans[0];

      amount = Number(plan.price || 0);
      description = `Paiement plan : ${plan.name}`;
    } else {
      return res.status(400).json({
        success: false,
        message: "appointment_id ou plan_id obligatoire",
      });
    }

    const selectedProvider = provider || process.env.PAYMENT_PROVIDER || "manual";

    let selectedPaymentMethod = null;

    if (payment_method_id) {
      const methods = await query(
        `
        SELECT *
        FROM payment_methods
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
        `,
        [payment_method_id]
      );

      if (methods.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Méthode de paiement introuvable ou inactive.",
        });
      }

      selectedPaymentMethod = methods[0];
    }

    const selectedMethod =
      payment_method ||
      selectedPaymentMethod?.method_type ||
      selectedPaymentMethod?.name ||
      "manual";

    const proofFile = getPaymentProofFromFile(req);

    const providerPaymentId = `${selectedProvider}_${Date.now()}_${userId}`;

    const checkoutUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/payment/manual/${providerPaymentId}`;

    const result = await query(
      `
      INSERT INTO payments (
        user_id,
        psychologist_id,
        appointment_id,
        plan_id,
        provider,
        provider_payment_id,
        provider_checkout_url,
        amount,
        currency,
        status,
        payment_method,
        metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DZD', 'pending', ?, ?)
      `,
      [
        userId,
        psychologistId,
        finalAppointmentId,
        finalPlanId,
        selectedProvider,
        providerPaymentId,
        checkoutUrl,
        amount,
        selectedMethod,
        mergeMetadata(
          {
            description,
            proof_reference: proof_reference || null,
            notes: notes || null,
            source: appointment_id ? "appointment" : "plan",
            payment_method_id: selectedPaymentMethod?.id || payment_method_id || null,
            payment_method_name: selectedPaymentMethod?.name || selectedMethod,
            payment_method_type: selectedPaymentMethod?.method_type || selectedMethod,
            payment_method_account_holder: selectedPaymentMethod?.account_holder || null,
            payment_method_ccp_number: selectedPaymentMethod?.ccp_number || null,
            payment_method_rip_key: selectedPaymentMethod?.rip_key || null,
          },
          proofFile
        ),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Paiement créé avec succès",
      payment: {
        id: result.insertId,
        provider: selectedProvider,
        provider_payment_id: providerPaymentId,
        checkout_url: checkoutUrl,
        amount,
        currency: "DZD",
        status: "pending",
        payment_method: selectedMethod,
        payment_method_id: selectedPaymentMethod?.id || payment_method_id || null,
        payment_method_name: selectedPaymentMethod?.name || selectedMethod,
        description,
      },
    });
  } catch (error) {
    console.error("Erreur createCheckout:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur création paiement",
      error: error.message,
    });
  }
}

// =======================
// GET MY PAYMENTS
// =======================
async function getMyPayments(req, res) {
  try {
    const payments = await query(
      `
      SELECT
        p.*,
        a.appointment_date,
        a.mode AS appointment_mode,
        a.status AS appointment_status,
        a.payment_status AS appointment_payment_status,
        psy.full_name AS psychologist_name,
        pl.name AS plan_name
      FROM payments p
      LEFT JOIN appointments a ON a.id = p.appointment_id
      LEFT JOIN psychologists psy ON psy.id = p.psychologist_id
      LEFT JOIN plans pl ON pl.id = p.plan_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      `,
      [req.auth.id]
    );

    return res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Erreur getMyPayments:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération paiements",
      error: error.message,
    });
  }
}

// =======================
// GET PAYMENT BY ID USER
// =======================
async function getMyPaymentById(req, res) {
  try {
    const userId = req.auth.id;
    const { id } = req.params;

    const payments = await query(
      `
      SELECT
        p.*,
        a.appointment_date,
        a.mode AS appointment_mode,
        a.status AS appointment_status,
        a.payment_status AS appointment_payment_status,
        psy.full_name AS psychologist_name,
        pl.name AS plan_name
      FROM payments p
      LEFT JOIN appointments a ON a.id = p.appointment_id
      LEFT JOIN psychologists psy ON psy.id = p.psychologist_id
      LEFT JOIN plans pl ON pl.id = p.plan_id
      WHERE p.id = ?
        AND p.user_id = ?
      `,
      [id, userId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    return res.json({
      success: true,
      payment: payments[0],
    });
  } catch (error) {
    console.error("Erreur getMyPaymentById:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération paiement",
      error: error.message,
    });
  }
}

// =======================
// GET MY INVOICES
// =======================
async function getMyInvoices(req, res) {
  try {
    const invoices = await query(
      `
      SELECT
        i.*,
        p.provider,
        p.payment_method,
        p.status AS payment_status
      FROM invoices i
      LEFT JOIN payments p ON p.id = i.payment_id
      WHERE i.user_id = ?
      ORDER BY i.issued_at DESC
      `,
      [req.auth.id]
    );

    return res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error("Erreur getMyInvoices:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération factures",
      error: error.message,
    });
  }
}

// =======================
// USER UPLOAD / REPLACE PAYMENT PROOF
// =======================
async function uploadPaymentProof(req, res) {
  try {
    const userId = req.auth.id;
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Veuillez envoyer une preuve de paiement PNG, JPG, JPEG ou PDF.",
      });
    }

    const payments = await query(
      `
      SELECT *
      FROM payments
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    const payment = payments[0];

    if (payment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Ce paiement est déjà validé. Impossible de modifier la preuve.",
      });
    }

    const currentMetadata = (() => {
      try {
        if (!payment.metadata) return {};
        if (typeof payment.metadata === "object") return payment.metadata;
        return JSON.parse(payment.metadata);
      } catch {
        return {};
      }
    })();

    const proofFile = getPaymentProofFromFile(req);

    await query(
      `
      UPDATE payments
      SET metadata = ?,
          status = 'pending',
          updated_at = NOW()
      WHERE id = ?
      `,
      [mergeMetadata(currentMetadata, proofFile), id]
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
      VALUES ('admin', 1, ?, ?, 'payment', FALSE)
      `,
      [
        "Nouvelle preuve de paiement",
        `Le patient a envoyé une preuve pour le paiement #${id}.`,
      ]
    ).catch(() => null);

    return res.json({
      success: true,
      message: "Preuve de paiement envoyée avec succès. En attente de validation admin.",
      proof: proofFile,
    });
  } catch (error) {
    console.error("Erreur uploadPaymentProof:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur upload preuve paiement",
      error: error.message,
    });
  }
}

// =======================
// ADMIN VALIDATE MANUAL PAYMENT
// =======================
async function markManualPaid(req, res) {
  try {
    const { id } = req.params;

    const result = await transaction(async (connection) => {
      const [payments] = await connection.execute(
        `
        SELECT *
        FROM payments
        WHERE id = ?
        `,
        [id]
      );

      if (payments.length === 0) {
        return {
          statusCode: 404,
          success: false,
          message: "Paiement introuvable",
        };
      }

      const payment = payments[0];

      if (payment.status === "paid") {
        return {
          statusCode: 409,
          success: false,
          message: "Ce paiement est déjà payé",
        };
      }

      if (payment.status === "failed") {
        return {
          statusCode: 400,
          success: false,
          message: "Impossible de valider un paiement déjà refusé",
        };
      }

      // 1. Paiement payé
      await connection.execute(
        `
        UPDATE payments
        SET status = 'paid',
            paid_at = NOW()
        WHERE id = ?
        `,
        [id]
      );

      // 2. Si paiement rendez-vous => confirmer rendez-vous
      if (payment.appointment_id) {
        await connection.execute(
          `
          UPDATE appointments
          SET status = 'confirmed',
              payment_status = 'paid'
          WHERE id = ?
          `,
          [payment.appointment_id]
        );
      }

      // 3. Créer facture seulement si elle n'existe pas déjà
      const [existingInvoices] = await connection.execute(
        `
        SELECT id, invoice_number
        FROM invoices
        WHERE payment_id = ?
        LIMIT 1
        `,
        [payment.id]
      );

      let invoiceNumber = null;

      if (existingInvoices.length > 0) {
        invoiceNumber = existingInvoices[0].invoice_number;
      } else {
        invoiceNumber = `INV-${Date.now()}-${payment.id}`;

        await connection.execute(
          `
          INSERT INTO invoices (
            user_id,
            payment_id,
            invoice_number,
            amount,
            currency,
            status
          )
          VALUES (?, ?, ?, ?, ?, 'paid')
          `,
          [
            payment.user_id,
            payment.id,
            invoiceNumber,
            payment.amount,
            payment.currency || "DZD",
          ]
        );
      }

      // 4. Créer payout seulement s'il n'existe pas déjà
      if (payment.psychologist_id) {
        const [existingPayouts] = await connection.execute(
          `
          SELECT id
          FROM psychologist_payouts
          WHERE payment_id = ?
          LIMIT 1
          `,
          [payment.id]
        );

        if (existingPayouts.length === 0) {
          const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 15);
          const grossAmount = Number(payment.amount || 0);
          const platformFee = (grossAmount * feePercent) / 100;
          const netAmount = grossAmount - platformFee;

          await connection.execute(
            `
            INSERT INTO psychologist_payouts (
              psychologist_id,
              payment_id,
              gross_amount,
              platform_fee,
              net_amount,
              status
            )
            VALUES (?, ?, ?, ?, ?, 'pending')
            `,
            [
              payment.psychologist_id,
              payment.id,
              grossAmount,
              platformFee,
              netAmount,
            ]
          );
        }
      }

      // 5. Notification user
      await connection.execute(
        `
        INSERT INTO notifications (
          receiver_type,
          receiver_id,
          title,
          message,
          type,
          is_read
        )
        VALUES ('user', ?, ?, ?, 'payment', FALSE)
        `,
        [
          payment.user_id,
          "Paiement validé",
          "Votre paiement a été validé avec succès.",
        ]
      );

      // 6. Notification psychologue si existe
      if (payment.psychologist_id) {
        await connection.execute(
          `
          INSERT INTO notifications (
            receiver_type,
            receiver_id,
            title,
            message,
            type,
            is_read
          )
          VALUES ('psychologist', ?, ?, ?, 'payment', FALSE)
          `,
          [
            payment.psychologist_id,
            "Paiement reçu",
            "Un paiement lié à un rendez-vous a été validé.",
          ]
        );
      }

      return {
        statusCode: 200,
        success: true,
        message: "Paiement validé manuellement avec succès",
        invoice_number: invoiceNumber,
      };
    });

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    console.error("Erreur markManualPaid:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur validation paiement",
      error: error.message,
    });
  }
}

// =======================
// ADMIN REJECT PAYMENT
// =======================
async function rejectPayment(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payments = await query(
      `
      SELECT *
      FROM payments
      WHERE id = ?
      `,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    const payment = payments[0];

    if (payment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Impossible de refuser un paiement déjà payé",
      });
    }

    if (payment.status === "failed") {
      return res.status(409).json({
        success: false,
        message: "Ce paiement est déjà refusé",
      });
    }

    await query(
      `
      UPDATE payments
      SET status = 'failed',
          metadata = JSON_SET(
            COALESCE(metadata, JSON_OBJECT()),
            '$.reject_reason',
            ?
          )
      WHERE id = ?
      `,
      [reason || "Paiement refusé par admin", id]
    );

    if (payment.appointment_id) {
      await query(
        `
        UPDATE appointments
        SET payment_status = 'unpaid'
        WHERE id = ?
          AND payment_status <> 'paid'
        `,
        [payment.appointment_id]
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
      VALUES ('user', ?, ?, ?, 'payment', FALSE)
      `,
      [
        payment.user_id,
        "Paiement refusé",
        reason || "Votre paiement a été refusé.",
      ]
    );

    return res.json({
      success: true,
      message: "Paiement refusé",
    });
  } catch (error) {
    console.error("Erreur rejectPayment:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur refus paiement",
      error: error.message,
    });
  }
}

// =======================
// ADMIN GET ALL PAYMENTS
// =======================
async function getAllPaymentsAdmin(req, res) {
  try {
    const payments = await query(
      `
      SELECT
        p.*,
        u.full_name AS user_name,
        u.email AS user_email,
        psy.full_name AS psychologist_name,
        pl.name AS plan_name
      FROM payments p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN psychologists psy ON psy.id = p.psychologist_id
      LEFT JOIN plans pl ON pl.id = p.plan_id
      ORDER BY p.created_at DESC
      `
    );

    return res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Erreur getAllPaymentsAdmin:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération paiements admin",
      error: error.message,
    });
  }
}

// =======================
// PSYCHOLOGIST GET MY PAYOUTS
// =======================
async function getMyPayouts(req, res) {
  try {
    const payouts = await query(
      `
      SELECT
        pp.*,
        p.amount AS payment_amount,
        p.status AS payment_status,
        p.created_at AS payment_created_at
      FROM psychologist_payouts pp
      JOIN payments p ON p.id = pp.payment_id
      WHERE pp.psychologist_id = ?
      ORDER BY pp.created_at DESC
      `,
      [req.auth.id]
    );

    return res.json({
      success: true,
      payouts,
    });
  } catch (error) {
    console.error("Erreur getMyPayouts:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération revenus psychologue",
      error: error.message,
    });
  }
}

// =======================
// PAYMENT WEBHOOK
// Pour plus tard : Chargily / Stripe / autre
// =======================
async function webhookPayment(req, res) {
  try {
    const { provider } = req.params;
    const payload = req.body || {};

    await query(
      `
      INSERT INTO payment_webhooks (
        provider,
        event_type,
        provider_payment_id,
        payload,
        processed
      )
      VALUES (?, ?, ?, ?, FALSE)
      `,
      [
        provider,
        payload.type || payload.event || "payment_event",
        payload.id || payload.payment_id || payload.checkout_id || null,
        JSON.stringify(payload),
      ]
    );

    return res.json({
      success: true,
      message: "Webhook paiement reçu",
    });
  } catch (error) {
    console.error("Erreur webhookPayment:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur webhook paiement",
      error: error.message,
    });
  }
}

module.exports = {
  getPlans,
  createCheckout,
  getMyPayments,
  getMyPaymentById,
  getMyInvoices,
  uploadPaymentProof,
  markManualPaid,
  rejectPayment,
  getAllPaymentsAdmin,
  getMyPayouts,
  webhookPayment,
};