const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const { query } = require("../database/db");

// =======================
// HELPERS
// =======================

function buildDateCondition(columnName, from, to) {
  const conditions = [];
  const params = [];

  if (from) {
    conditions.push(`DATE(${columnName}) >= ?`);
    params.push(from);
  }

  if (to) {
    conditions.push(`DATE(${columnName}) <= ?`);
    params.push(to);
  }

  return {
    sql: conditions.length ? ` AND ${conditions.join(" AND ")} ` : "",
    params,
  };
}

function normalizeAdmin(admin) {
  if (!admin) return null;

  return {
    id: admin.id,
    full_name: admin.full_name || admin.name || "Admin",
    email: admin.email,
    role: admin.role || "ADMIN",
    is_active: admin.is_active,
  };
}

// =======================
// ADMIN AUTH
// POST /api/admin/login
// =======================

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe obligatoires.",
      });
    }

    const rows = await query(
      `
      SELECT *
      FROM admins
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides.",
      });
    }

    const admin = rows[0];

    if (admin.is_active === 0 || admin.is_active === false) {
      return res.status(403).json({
        success: false,
        message: "Compte administrateur désactivé.",
      });
    }

    let passwordOk = false;

    if (admin.password_hash) {
      passwordOk = await bcrypt.compare(password, admin.password_hash);
    } else if (admin.password) {
      try {
        passwordOk = await bcrypt.compare(password, admin.password);
      } catch {
        passwordOk = password === admin.password;
      }
    }

    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides.",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        role: admin.role || "ADMIN",
        email: admin.email,
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Connexion admin réussie.",
      token,
      admin: normalizeAdmin(admin),
    });
  } catch (error) {
    console.error("Erreur loginAdmin:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur connexion admin.",
      error: error.message,
    });
  }
}

// =======================
// GET ADMIN PROFILE
// GET /api/admin/me
// =======================

async function getAdminProfile(req, res) {
  try {
    const adminId = req.user?.id;

    const rows = await query(
      `
      SELECT id, full_name, email, role, is_active, created_at
      FROM admins
      WHERE id = ?
      LIMIT 1
      `,
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin introuvable.",
      });
    }

    return res.json({
      success: true,
      admin: normalizeAdmin(rows[0]),
    });
  } catch (error) {
    console.error("Erreur getAdminProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur profil admin.",
      error: error.message,
    });
  }
}

// =======================
// DASHBOARD
// GET /api/admin/dashboard?from=...&to=...&chartMode=day|month|all
// =======================

async function dashboard(req, res) {
  try {
    const { from, to, chartMode = "day" } = req.query;

    const paymentDateFilter = buildDateCondition(
      "COALESCE(p.paid_at, p.created_at)",
      from,
      to
    );

    const userDateFilter = buildDateCondition("u.created_at", from, to);

    const appointmentDateFilter = buildDateCondition(
      "a.appointment_date",
      from,
      to
    );

    const revenueRows = await query(
      `
      SELECT
        COALESCE(SUM(p.amount), 0) AS revenue_total_brut,
        COALESCE(SUM(pp.platform_fee), 0) AS admin_net,
        COALESCE(SUM(pp.net_amount), 0) AS psychologist_amount_to_pay
      FROM payments p
      LEFT JOIN psychologist_payouts pp ON pp.payment_id = p.id
      WHERE p.status = 'paid'
      ${paymentDateFilter.sql}
      `,
      paymentDateFilter.params
    );

    const todayRevenueRows = await query(
      `
      SELECT COALESCE(SUM(amount), 0) AS revenue_today
      FROM payments
      WHERE status = 'paid'
        AND DATE(COALESCE(paid_at, created_at)) = CURDATE()
      `
    );

    const monthRevenueRows = await query(
      `
      SELECT COALESCE(SUM(amount), 0) AS revenue_month
      FROM payments
      WHERE status = 'paid'
        AND YEAR(COALESCE(paid_at, created_at)) = YEAR(CURDATE())
        AND MONTH(COALESCE(paid_at, created_at)) = MONTH(CURDATE())
      `
    );

    const usersRows = await query(
      `
      SELECT COUNT(*) AS total_users
      FROM users u
      WHERE 1 = 1
      ${userDateFilter.sql}
      `,
      userDateFilter.params
    );

    const appointmentsRows = await query(
      `
      SELECT COUNT(*) AS total_appointments
      FROM appointments a
      WHERE 1 = 1
      ${appointmentDateFilter.sql}
      `,
      appointmentDateFilter.params
    );

    const pendingPsychologistsRows = await query(
      `
      SELECT COUNT(*) AS pending_psychologists
      FROM psychologists
      WHERE is_verified = 0 OR is_verified IS NULL
      `
    );

    const pendingPaymentsRows = await query(
      `
      SELECT COUNT(*) AS pending_payments
      FROM payments
      WHERE status = 'pending'
      `
    );

    const criticalAlertsRows = await query(
      `
      SELECT COUNT(*) AS critical_alerts
      FROM risk_alerts
      WHERE status = 'open'
        AND LOWER(risk_level) IN ('critical', 'critique', 'high', 'élevé', 'eleve')
      `
    );

    let chartSelect = "DATE(COALESCE(p.paid_at, p.created_at)) AS label";

    if (chartMode === "month" || chartMode === "all") {
      chartSelect =
        "DATE_FORMAT(COALESCE(p.paid_at, p.created_at), '%Y-%m') AS label";
    }

    const chartRows = await query(
      `
      SELECT
        ${chartSelect},
        COALESCE(SUM(p.amount), 0) AS revenue,
        COUNT(p.id) AS payments_count
      FROM payments p
      WHERE p.status = 'paid'
      ${paymentDateFilter.sql}
      GROUP BY label
      ORDER BY label ASC
      `,
      paymentDateFilter.params
    );

    const recentUsers = await query(
      `
      SELECT id, full_name, email, risk_level, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 8
      `
    );

    const recentAlerts = await query(
      `
      SELECT
        ra.id,
        ra.risk_level,
        ra.status,
        ra.created_at,
        u.full_name,
        u.email
      FROM risk_alerts ra
      LEFT JOIN users u ON u.id = ra.user_id
      ORDER BY ra.created_at DESC
      LIMIT 8
      `
    );

    const revenue = revenueRows[0] || {};

    const stats = {
      revenue_total_brut: Number(revenue.revenue_total_brut || 0),
      admin_net: Number(revenue.admin_net || 0),
      psychologist_amount_to_pay: Number(
        revenue.psychologist_amount_to_pay || 0
      ),
      revenue_today: Number(todayRevenueRows[0]?.revenue_today || 0),
      revenue_month: Number(monthRevenueRows[0]?.revenue_month || 0),
      total_users: Number(usersRows[0]?.total_users || 0),
      total_appointments: Number(
        appointmentsRows[0]?.total_appointments || 0
      ),
      pending_psychologists: Number(
        pendingPsychologistsRows[0]?.pending_psychologists || 0
      ),
      pending_payments: Number(pendingPaymentsRows[0]?.pending_payments || 0),
      critical_alerts: Number(criticalAlertsRows[0]?.critical_alerts || 0),
    };

    return res.json({
      success: true,
      filters: {
        from: from || "",
        to: to || "",
        chartMode,
      },
      stats,
      revenue_chart: chartRows,
      recent_users: recentUsers,
      recent_alerts: recentAlerts,
    });
  } catch (error) {
    console.error("Erreur dashboard:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur dashboard admin.",
      error: error.message,
    });
  }
}

// =======================
// USERS
// =======================

async function listUsers(req, res) {
  try {
    const users = await query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        city,
        country,
        addiction_type,
        consumption_level,
        risk_level,
        is_active,
        created_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Erreur listUsers:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur chargement utilisateurs.",
      error: error.message,
    });
  }
}

async function getUserDetail(req, res) {
  try {
    const { id } = req.params;

    const rows = await query(
      `
      SELECT *
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    return res.json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Erreur getUserDetail:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur détail utilisateur.",
      error: error.message,
    });
  }
}

async function disableUser(req, res) {
  try {
    const { id } = req.params;

    await query(
      `
      UPDATE users
      SET is_active = 0
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Utilisateur désactivé.",
    });
  } catch (error) {
    console.error("Erreur disableUser:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur désactivation utilisateur.",
      error: error.message,
    });
  }
}

async function enableUser(req, res) {
  try {
    const { id } = req.params;

    await query(
      `
      UPDATE users
      SET is_active = 1
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Utilisateur activé.",
    });
  } catch (error) {
    console.error("Erreur enableUser:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur activation utilisateur.",
      error: error.message,
    });
  }
}

// =======================
// PSYCHOLOGISTS
// =======================

async function listPsychologists(req, res) {
  try {
    const psychologists = await query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        city,
        country,
        specialization,
        consultation_price,
        currency,
        is_verified,
        is_active,
        created_at
      FROM psychologists
      ORDER BY created_at DESC
      `
    );

    return res.json({
      success: true,
      psychologists,
    });
  } catch (error) {
    console.error("Erreur listPsychologists:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur chargement psychologues.",
      error: error.message,
    });
  }
}

// =======================
// LIST PSYCHOLOGIST COMMISSIONS
// GET /api/admin/psychologists/commissions?from=2026-05-01&to=2026-05-31
// IMPORTANT : unpaid + pending sont considérés comme "en attente"
// =======================

async function listPsychologistCommissions(req, res) {
  try {
    const { from, to } = req.query;

    const dateFilter = buildDateCondition(
      "COALESCE(p.paid_at, p.created_at)",
      from,
      to
    );

    const commissions = await query(
      `
      SELECT
        ps.id AS psychologist_id,
        ps.full_name AS psychologist_name,
        ps.email AS psychologist_email,
        ps.phone AS psychologist_phone,
        ps.city AS psychologist_city,
        ps.specialization AS psychologist_specialization,

        COUNT(pp.id) AS payouts_count,

        COALESCE(SUM(pp.gross_amount), 0) AS total_gross_amount,
        COALESCE(SUM(pp.platform_fee), 0) AS total_admin_commission,
        COALESCE(SUM(pp.net_amount), 0) AS total_psychologist_net,

        COALESCE(
          SUM(CASE WHEN pp.status IN ('pending', 'unpaid') THEN pp.net_amount ELSE 0 END),
          0
        ) AS pending_psychologist_net,

        COALESCE(
          SUM(CASE WHEN pp.status = 'paid' THEN pp.net_amount ELSE 0 END),
          0
        ) AS paid_psychologist_net,

        CASE
          WHEN COALESCE(SUM(CASE WHEN pp.status = 'paid' THEN pp.net_amount ELSE 0 END), 0) <= 0
               AND COALESCE(SUM(CASE WHEN pp.status IN ('pending', 'unpaid') THEN pp.net_amount ELSE 0 END), 0) > 0
            THEN 'unpaid'

          WHEN COALESCE(SUM(CASE WHEN pp.status = 'paid' THEN pp.net_amount ELSE 0 END), 0) > 0
               AND COALESCE(SUM(CASE WHEN pp.status IN ('pending', 'unpaid') THEN pp.net_amount ELSE 0 END), 0) > 0
            THEN 'partial'

          WHEN COALESCE(SUM(CASE WHEN pp.status = 'paid' THEN pp.net_amount ELSE 0 END), 0) > 0
               AND COALESCE(SUM(CASE WHEN pp.status IN ('pending', 'unpaid') THEN pp.net_amount ELSE 0 END), 0) <= 0
            THEN 'paid'

          ELSE 'unpaid'
        END AS payout_status

      FROM psychologist_payouts pp
      JOIN psychologists ps ON ps.id = pp.psychologist_id
      JOIN payments p ON p.id = pp.payment_id

      WHERE p.status = 'paid'
      ${dateFilter.sql}

      GROUP BY
        ps.id,
        ps.full_name,
        ps.email,
        ps.phone,
        ps.city,
        ps.specialization

      ORDER BY total_psychologist_net DESC
      `,
      dateFilter.params
    );

    const totalsRows = await query(
      `
      SELECT
        COALESCE(SUM(pp.gross_amount), 0) AS total_gross_amount,
        COALESCE(SUM(pp.platform_fee), 0) AS total_admin_commission,
        COALESCE(SUM(pp.net_amount), 0) AS total_psychologist_net,

        COALESCE(
          SUM(CASE WHEN pp.status IN ('pending', 'unpaid') THEN pp.net_amount ELSE 0 END),
          0
        ) AS total_pending_psychologist_net,

        COALESCE(
          SUM(CASE WHEN pp.status = 'paid' THEN pp.net_amount ELSE 0 END),
          0
        ) AS total_paid_psychologist_net,

        COUNT(pp.id) AS total_payouts
      FROM psychologist_payouts pp
      JOIN payments p ON p.id = pp.payment_id
      WHERE p.status = 'paid'
      ${dateFilter.sql}
      `,
      dateFilter.params
    );

    return res.json({
      success: true,
      filters: {
        from: from || "",
        to: to || "",
      },
      totals: totalsRows[0] || {
        total_gross_amount: 0,
        total_admin_commission: 0,
        total_psychologist_net: 0,
        total_pending_psychologist_net: 0,
        total_paid_psychologist_net: 0,
        total_payouts: 0,
      },
      commissions,
    });
  } catch (error) {
    console.error("Erreur listPsychologistCommissions:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur chargement commissions psychologues.",
      error: error.message,
    });
  }
}

// =======================
// MARK PSYCHOLOGIST PAYOUTS PAID / PARTIAL
// PATCH /api/admin/psychologists/:psychologistId/payouts/pay
// body: { from?: "2026-05-01", to?: "2026-05-31", amount?: 1000 }
// IMPORTANT : paye les lignes status 'pending' ou 'unpaid'
// =======================

async function markPsychologistPayoutsPaid(req, res) {
  try {
    const { psychologistId } = req.params;
    const { from, to, amount } = req.body || {};

    console.log("BODY PAYOUT =", req.body);

    const hasAmount =
      amount !== undefined &&
      amount !== null &&
      String(amount).trim() !== "";

    const partialAmount = hasAmount ? Number(amount) : 0;

    if (hasAmount && (Number.isNaN(partialAmount) || partialAmount <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Le montant du payout doit être supérieur à 0.",
      });
    }

    const psychologistRows = await query(
      `
      SELECT id, full_name
      FROM psychologists
      WHERE id = ?
      `,
      [psychologistId]
    );

    if (psychologistRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Psychologue introuvable.",
      });
    }

    const dateFilter = buildDateCondition(
      "COALESCE(p.paid_at, p.created_at)",
      from,
      to
    );

    const payouts = await query(
      `
      SELECT
        pp.id,
        pp.psychologist_id,
        pp.payment_id,
        pp.gross_amount,
        pp.platform_fee,
        pp.net_amount,
        pp.status,
        pp.created_at
      FROM psychologist_payouts pp
      JOIN payments p ON p.id = pp.payment_id
      WHERE pp.psychologist_id = ?
        AND pp.status IN ('pending', 'unpaid')
        AND p.status = 'paid'
      ${dateFilter.sql}
      ORDER BY pp.created_at ASC, pp.id ASC
      `,
      [psychologistId, ...dateFilter.params]
    );

    if (payouts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun payout en attente pour ce psychologue.",
      });
    }

    const totalPending = payouts.reduce((sum, item) => {
      return sum + Number(item.net_amount || 0);
    }, 0);

    if (hasAmount && partialAmount > totalPending) {
      return res.status(400).json({
        success: false,
        message: `Montant trop élevé. Montant disponible en attente : ${totalPending} DZD.`,
      });
    }

    const shouldPayAll = !hasAmount;
    let remainingToPay = shouldPayAll ? totalPending : partialAmount;

    let totalPaid = 0;
    let payoutsCount = 0;

    for (const payout of payouts) {
      if (remainingToPay <= 0) break;

      const currentNet = Number(payout.net_amount || 0);
      const currentGross = Number(payout.gross_amount || 0);
      const currentFee = Number(payout.platform_fee || 0);

      if (currentNet <= 0) continue;

      if (remainingToPay >= currentNet) {
        await query(
          `
          UPDATE psychologist_payouts
          SET status = 'paid',
              paid_at = NOW()
          WHERE id = ?
          `,
          [payout.id]
        );

        remainingToPay -= currentNet;
        totalPaid += currentNet;
        payoutsCount += 1;
      } else {
        const paidNet = remainingToPay;
        const ratio = paidNet / currentNet;

        const paidGross = currentGross * ratio;
        const paidFee = currentFee * ratio;

        const remainingNet = currentNet - paidNet;
        const remainingGross = currentGross - paidGross;
        const remainingFee = currentFee - paidFee;

        await query(
          `
          UPDATE psychologist_payouts
          SET gross_amount = ?,
              platform_fee = ?,
              net_amount = ?,
              status = 'unpaid',
              paid_at = NULL
          WHERE id = ?
          `,
          [remainingGross, remainingFee, remainingNet, payout.id]
        );

        await query(
          `
          INSERT INTO psychologist_payouts (
            psychologist_id,
            payment_id,
            gross_amount,
            platform_fee,
            net_amount,
            status,
            paid_at
          )
          VALUES (?, ?, ?, ?, ?, 'paid', NOW())
          `,
          [
            payout.psychologist_id,
            payout.payment_id,
            paidGross,
            paidFee,
            paidNet,
          ]
        );

        totalPaid += paidNet;
        payoutsCount += 1;
        remainingToPay = 0;
      }
    }

    return res.json({
      success: true,
      message: `Payout effectué avec succès pour ${psychologistRows[0].full_name}.`,
      psychologist_id: Number(psychologistId),
      payouts_count: payoutsCount,
      total_pending_before: totalPending,
      total_paid: totalPaid,
      total_remaining: totalPending - totalPaid,
      is_partial: hasAmount && partialAmount < totalPending,
    });
  } catch (error) {
    console.error("Erreur markPsychologistPayoutsPaid:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors du payout psychologue.",
      error: error.message,
    });
  }
}

async function getPsychologistDetail(req, res) {
  try {
    const { id } = req.params;

    const rows = await query(
      `
      SELECT *
      FROM psychologists
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Psychologue introuvable.",
      });
    }

    return res.json({
      success: true,
      psychologist: rows[0],
    });
  } catch (error) {
    console.error("Erreur getPsychologistDetail:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur détail psychologue.",
      error: error.message,
    });
  }
}

async function verifyPsychologist(req, res) {
  try {
    const { id } = req.params;

    await query(
      `
      UPDATE psychologists
      SET is_verified = 1,
          is_active = 1
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Psychologue vérifié avec succès.",
    });
  } catch (error) {
    console.error("Erreur verifyPsychologist:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur validation psychologue.",
      error: error.message,
    });
  }
}

async function disablePsychologist(req, res) {
  try {
    const { id } = req.params;

    await query(
      `
      UPDATE psychologists
      SET is_active = 0
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Psychologue désactivé.",
    });
  } catch (error) {
    console.error("Erreur disablePsychologist:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur désactivation psychologue.",
      error: error.message,
    });
  }
}

async function enablePsychologist(req, res) {
  try {
    const { id } = req.params;

    await query(
      `
      UPDATE psychologists
      SET is_active = 1
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Psychologue activé.",
    });
  } catch (error) {
    console.error("Erreur enablePsychologist:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur activation psychologue.",
      error: error.message,
    });
  }
}

// =======================
// ALERTS
// =======================

async function listAlerts(req, res) {
  try {
    const alerts = await query(
      `
      SELECT
        ra.id,
        ra.user_id,
        ra.risk_level,
        ra.alert_type,
        ra.message_excerpt,
        ra.status,
        ra.created_at,
        u.full_name,
        u.email
      FROM risk_alerts ra
      LEFT JOIN users u ON u.id = ra.user_id
      ORDER BY ra.created_at DESC
      `
    );

    return res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("Erreur listAlerts:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur chargement alertes.",
      error: error.message,
    });
  }
}

async function closeAlert(req, res) {
  try {
    const { id } = req.params;

    await query(
      `
      UPDATE risk_alerts
      SET status = 'closed',
          closed_at = NOW()
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Alerte fermée.",
    });
  } catch (error) {
    console.error("Erreur closeAlert:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur fermeture alerte.",
      error: error.message,
    });
  }
}

// =======================
// PAYMENTS
// =======================

async function listPayments(req, res) {
  try {
    const payments = await query(
      `
      SELECT
        p.*,
        u.full_name AS user_name,
        u.email AS user_email,
        ps.full_name AS psychologist_name
      FROM payments p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN psychologists ps ON ps.id = p.psychologist_id
      ORDER BY p.created_at DESC
      `
    );

    return res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Erreur listPayments:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur chargement paiements.",
      error: error.message,
    });
  }
}

// =======================
// APPOINTMENTS
// =======================

async function listAppointments(req, res) {
  try {
    const appointments = await query(
      `
      SELECT
        a.*,
        u.full_name AS user_name,
        u.email AS user_email,
        ps.full_name AS psychologist_name
      FROM appointments a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN psychologists ps ON ps.id = a.psychologist_id
      ORDER BY a.appointment_date DESC
      `
    );

    return res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Erreur listAppointments:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur chargement rendez-vous.",
      error: error.message,
    });
  }
}

// =======================
// CONVERSATIONS
// =======================

async function listConversations(req, res) {
  try {
    const conversations = await query(
      `
      SELECT
        c.*,
        u.full_name AS user_name,
        u.email AS user_email
      FROM conversations c
      LEFT JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
      LIMIT 100
      `
    );

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Erreur listConversations:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur chargement conversations.",
      error: error.message,
    });
  }
}

async function getConversationDetailAdmin(req, res) {
  try {
    const { id } = req.params;

    const conversationRows = await query(
      `
      SELECT
        c.*,
        u.full_name AS user_name,
        u.email AS user_email
      FROM conversations c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (conversationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation introuvable.",
      });
    }

    const messages = await query(
      `
      SELECT *
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      `,
      [id]
    );

    return res.json({
      success: true,
      conversation: conversationRows[0],
      messages,
    });
  } catch (error) {
    console.error("Erreur getConversationDetailAdmin:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur détail conversation.",
      error: error.message,
    });
  }
}

module.exports = {
  loginAdmin,
  getAdminProfile,
  dashboard,

  listUsers,
  getUserDetail,
  disableUser,
  enableUser,

  listPsychologists,
  listPsychologistCommissions,
  markPsychologistPayoutsPaid,
  getPsychologistDetail,
  verifyPsychologist,
  disablePsychologist,
  enablePsychologist,

  listAlerts,
  closeAlert,

  listPayments,
  listAppointments,

  listConversations,
  getConversationDetailAdmin,
};