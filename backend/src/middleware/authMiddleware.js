const { verifyToken } = require("../utils/jwt");
const { query } = require("../database/db");

async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token manquant",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    req.auth = decoded;

    if (decoded.role === "USER") {
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
        WHERE id = ? AND is_active = TRUE
        `,
        [decoded.id]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur introuvable",
        });
      }

      req.user = users[0];
    }

    if (decoded.role === "PSYCHOLOGIST") {
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
        WHERE id = ? AND is_active = TRUE
        `,
        [decoded.id]
      );

      if (psychologists.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Psychologue introuvable",
        });
      }

      req.psychologist = psychologists[0];
    }

    if (decoded.role === "ADMIN" || decoded.role === "SUPER_ADMIN") {
      const admins = await query(
        `
        SELECT 
          id,
          full_name,
          email,
          role,
          permissions,
          is_active,
          created_at,
          updated_at
        FROM admins
        WHERE id = ? AND is_active = TRUE
        `,
        [decoded.id]
      );

      if (admins.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Admin introuvable",
        });
      }

      req.admin = admins[0];
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token expiré ou invalide",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
    }

    next();
  };
}

module.exports = {
  authRequired,
  requireRole,
};