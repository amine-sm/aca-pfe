const NLP_SERVICE_URL =
  process.env.NLP_SERVICE_URL || "http://127.0.0.1:8000";

// =======================
// CHECK PYTHON SERVICE
// =======================
async function checkPythonService() {
  try {
    const response = await fetch(`${NLP_SERVICE_URL}/`);

    if (!response.ok) {
      throw new Error(`FastAPI indisponible : ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur checkPythonService:", error.message);

    return {
      status: "error",
      message: "FastAPI indisponible",
      url: NLP_SERVICE_URL,
    };
  }
}

// =======================
// CALL PYTHON /nlp
// =======================
async function analyzeMessageWithPython(message, questionnaire = {}) {
  try {
    const response = await fetch(`${NLP_SERVICE_URL}/nlp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        questionnaire: questionnaire || {},
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`FastAPI /nlp error ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur analyzeMessageWithPython:", error.message);

    return {
      emotional_state: "stable",
      risk_level: "faible",
      summary_context: "",
      error: true,
      message:
        "FastAPI /nlp indisponible. Lance le service Python sur http://127.0.0.1:8000",
    };
  }
}

// =======================
// CALL PYTHON /chat
// =======================
async function generateReplyWithPython({
  message,
  summary_context = "",
  emotional_state = "stable",
  risk_level = "faible",
}) {
  try {
    const response = await fetch(`${NLP_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        summary_context,
        emotional_state,
        risk_level,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`FastAPI /chat error ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur generateReplyWithPython:", error.message);

    return {
      reply:
        "Je rencontre un problème technique avec le modèle IA, mais ton message a bien été reçu. Peux-tu continuer à expliquer ce que tu ressens ?",
      error: true,
    };
  }
}

module.exports = {
  checkPythonService,
  analyzeMessageWithPython,
  generateReplyWithPython,
};