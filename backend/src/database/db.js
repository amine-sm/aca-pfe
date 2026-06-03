const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "aca_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

// =======================
// TEST CONNECTION
// =======================
async function testConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log("✅ MySQL connecté : true");
    return true;
  } finally {
    connection.release();
  }
}

// =======================
// SIMPLE QUERY
// =======================
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// =======================
// TRANSACTION
// =======================
async function transaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  testConnection,
  transaction,
};