require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

const { testConnection } = require("./database/db");
const { checkPythonService } = require("./services/pythonNlpService");
const { ensureDefaultAdmin } = require("./services/adminSeedService");

// 📦 Routes
const usersRoutes = require("./routes/usersRoutes");
const slotsRoutes = require("./routes/slotsRoutes");
const psychologistsRoutes = require("./routes/psychologistsRoutes");
const conversationsRoutes = require("./routes/conversationsRoutes");
const recommendationsRoutes = require("./routes/recommendationsRoutes");
const appointmentsRoutes = require("./routes/appointmentsRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const paymentMethodsRoutes = require("./routes/paymentMethodsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const qwenOnboardingRoutes = require("./routes/qwenOnboardingRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");

// ✨ DziriBERT + Smart Routing + Tasks
const dziribertRoutes = require("./routes/dziribertRoutes");
const smartChatRoutes = require("./routes/smartChatRoutes");
const tasksRoutes = require("./routes/tasksRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);
app.use(compression());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Fichiers uploadés: preuves de paiement
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ACA Node.js Backend running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await testConnection();

    res.json({
      success: true,
      service: "node-backend",
      database: "connected",
      status: "running",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: "node-backend",
      database: "disconnected",
      message: error.message,
    });
  }
});

app.get("/api/health/python", async (req, res) => {
  try {
    const python = await checkPythonService();

    res.json({
      success: true,
      node: "running",
      python,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "FastAPI Python indisponible",
      error: error.message,
    });
  }
});

// 📦 Routes existantes
app.use("/api/users", usersRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/psychologists", psychologistsRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/payment-methods", paymentMethodsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/qwen-onboarding", qwenOnboardingRoutes);
app.use("/api/onboarding", onboardingRoutes);


// ✅ Nouvelle route créneaux
app.use("/api/slots", slotsRoutes);

// ✨ DziriBERT + Smart Routing + Tasks
app.use("/api/dziri", dziribertRoutes);
app.use("/api/smart", smartChatRoutes);
app.use("/api/tasks", tasksRoutes);

// 404 après toutes les routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable",
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erreur serveur",
  });
});

async function startServer() {
  try {
    await testConnection();
    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`✅ Backend Node.js lancé sur http://localhost:${PORT}`);
      console.log(`🇩🇿 DziriBERT routes: /api/dziri`);
      console.log(`🎯 Smart Chat routes: /api/smart`);
      console.log(`📋 Tasks routes: /api/tasks`);
      console.log(`🕒 Slots routes: /api/slots`);
    });
  } catch (error) {
    console.error("❌ Erreur lancement backend :", error.message);
    process.exit(1);
  }
}

startServer();