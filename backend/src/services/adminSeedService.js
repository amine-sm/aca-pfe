const bcrypt = require("bcryptjs");
const { query } = require("../database/db");

// =======================
// CREATE DEFAULT ADMIN AUTO
// =======================
async function ensureDefaultAdmin() {
  try {
    const adminsCount = await query(
      `
      SELECT COUNT(*) AS total
      FROM admins
      `
    );

    if (adminsCount[0].total > 0) {
      console.log("✅ Admin déjà existant");
      return;
    }

    const fullName = process.env.ADMIN_FULL_NAME || "Super Admin ACA";
    const email = process.env.ADMIN_EMAIL || "admin@aca.com";
    const password = process.env.ADMIN_PASSWORD || "admin123456";

    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      `
      INSERT INTO admins (
        full_name,
        email,
        password_hash,
        role,
        permissions,
        is_active
      )
      VALUES (?, ?, ?, 'SUPER_ADMIN', ?, TRUE)
      `,
      [
        fullName,
        email,
        passwordHash,
        JSON.stringify({
          users_view: true,
          users_manage: true,

          psychologists_view: true,
          psychologists_verify: true,
          psychologists_manage: true,

          appointments_view: true,
          appointments_manage: true,

          payments_view: true,
          payments_manage: true,

          alerts_view: true,
          alerts_manage: true,

          conversations_view: true,

          dashboard_view: true,
        }),
      ]
    );

    console.log("✅ Admin créé automatiquement");
    console.log(`📧 Email admin: ${email}`);
    console.log(`🔑 Password admin: ${password}`);
  } catch (error) {
    console.error("❌ Erreur création admin automatique:", error.message);
    throw error;
  }
}

module.exports = {
  ensureDefaultAdmin,
};