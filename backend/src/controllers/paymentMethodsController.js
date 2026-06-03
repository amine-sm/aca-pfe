const { query } = require("../database/db");

function normalizeBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return defaultValue;
}

function cleanMethod(row) {
  if (!row) return null;

  return {
    id: row.id,
    method_type: row.method_type,
    name: row.name,
    account_holder: row.account_holder,
    ccp_number: row.ccp_number,
    rip_key: row.rip_key,
    bank_name: row.bank_name,
    phone_number: row.phone_number,
    instructions: row.instructions,
    is_active: row.is_active === 1 || row.is_active === true,
    sort_order: Number(row.sort_order || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// =======================
// PUBLIC / USER
// GET /api/payment-methods/active
// =======================
async function listActivePaymentMethods(req, res) {
  try {
    const methods = await query(
      `
      SELECT *
      FROM payment_methods
      WHERE is_active = 1
      ORDER BY sort_order ASC, id DESC
      `
    );

    return res.json({
      success: true,
      methods: methods.map(cleanMethod),
    });
  } catch (error) {
    console.error("Erreur listActivePaymentMethods:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération méthodes de paiement.",
      error: error.message,
    });
  }
}

// =======================
// ADMIN
// GET /api/payment-methods/admin
// =======================
async function listPaymentMethodsAdmin(req, res) {
  try {
    const methods = await query(
      `
      SELECT *
      FROM payment_methods
      ORDER BY sort_order ASC, id DESC
      `
    );

    return res.json({
      success: true,
      methods: methods.map(cleanMethod),
    });
  } catch (error) {
    console.error("Erreur listPaymentMethodsAdmin:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur récupération méthodes admin.",
      error: error.message,
    });
  }
}

// =======================
// ADMIN CREATE
// POST /api/payment-methods/admin
// =======================
async function createPaymentMethodAdmin(req, res) {
  try {
    const {
      method_type = "ccp",
      name,
      account_holder,
      ccp_number,
      rip_key,
      bank_name,
      phone_number,
      instructions,
      is_active,
      sort_order,
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Nom de la méthode obligatoire.",
      });
    }

    if (String(method_type).toLowerCase() === "ccp" && !ccp_number) {
      return res.status(400).json({
        success: false,
        message: "Numéro CCP obligatoire pour une méthode CCP.",
      });
    }

    const result = await query(
      `
      INSERT INTO payment_methods (
        method_type,
        name,
        account_holder,
        ccp_number,
        rip_key,
        bank_name,
        phone_number,
        instructions,
        is_active,
        sort_order,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        String(method_type || "ccp").trim().toLowerCase(),
        String(name).trim(),
        account_holder || null,
        ccp_number || null,
        rip_key || null,
        bank_name || null,
        phone_number || null,
        instructions || null,
        normalizeBoolean(is_active, true) ? 1 : 0,
        Number(sort_order || 0),
        req.auth?.id || null,
      ]
    );

    const rows = await query("SELECT * FROM payment_methods WHERE id = ?", [
      result.insertId,
    ]);

    return res.status(201).json({
      success: true,
      message: "Méthode de paiement ajoutée avec succès.",
      method: cleanMethod(rows[0]),
    });
  } catch (error) {
    console.error("Erreur createPaymentMethodAdmin:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur création méthode de paiement.",
      error: error.message,
    });
  }
}

// =======================
// ADMIN UPDATE
// PATCH /api/payment-methods/admin/:id
// =======================
async function updatePaymentMethodAdmin(req, res) {
  try {
    const { id } = req.params;

    const rows = await query("SELECT * FROM payment_methods WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Méthode introuvable.",
      });
    }

    const current = rows[0];
    const body = req.body || {};

    const methodType =
      body.method_type !== undefined
        ? String(body.method_type || "ccp").trim().toLowerCase()
        : current.method_type;

    const name =
      body.name !== undefined ? String(body.name || "").trim() : current.name;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Nom de la méthode obligatoire.",
      });
    }

    await query(
      `
      UPDATE payment_methods
      SET method_type = ?,
          name = ?,
          account_holder = ?,
          ccp_number = ?,
          rip_key = ?,
          bank_name = ?,
          phone_number = ?,
          instructions = ?,
          is_active = ?,
          sort_order = ?
      WHERE id = ?
      `,
      [
        methodType,
        name,
        body.account_holder !== undefined
          ? body.account_holder || null
          : current.account_holder,
        body.ccp_number !== undefined ? body.ccp_number || null : current.ccp_number,
        body.rip_key !== undefined ? body.rip_key || null : current.rip_key,
        body.bank_name !== undefined ? body.bank_name || null : current.bank_name,
        body.phone_number !== undefined
          ? body.phone_number || null
          : current.phone_number,
        body.instructions !== undefined
          ? body.instructions || null
          : current.instructions,
        normalizeBoolean(body.is_active, current.is_active === 1) ? 1 : 0,
        body.sort_order !== undefined
          ? Number(body.sort_order || 0)
          : Number(current.sort_order || 0),
        id,
      ]
    );

    const updated = await query("SELECT * FROM payment_methods WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: "Méthode de paiement modifiée avec succès.",
      method: cleanMethod(updated[0]),
    });
  } catch (error) {
    console.error("Erreur updatePaymentMethodAdmin:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur modification méthode de paiement.",
      error: error.message,
    });
  }
}

// =======================
// ADMIN DELETE / DISABLE
// DELETE /api/payment-methods/admin/:id
// =======================
async function deletePaymentMethodAdmin(req, res) {
  try {
    const { id } = req.params;

    await query(
      `
      UPDATE payment_methods
      SET is_active = 0
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Méthode désactivée avec succès.",
    });
  } catch (error) {
    console.error("Erreur deletePaymentMethodAdmin:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur désactivation méthode de paiement.",
      error: error.message,
    });
  }
}

module.exports = {
  listActivePaymentMethods,
  listPaymentMethodsAdmin,
  createPaymentMethodAdmin,
  updatePaymentMethodAdmin,
  deletePaymentMethodAdmin,
};
