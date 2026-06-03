const { query } = require("../database/db");

// =======================
// HELPERS
// =======================
function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

// =======================
// GET LATEST NLP ANALYSIS
// Dernier résultat Python sauvegardé dans nlp_analyses
// =======================
async function getLatestNlpAnalysis(userId) {
  const analyses = await query(
    `
    SELECT *
    FROM nlp_analyses
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId]
  );

  if (analyses.length === 0) {
    return null;
  }

  const analysis = analyses[0];

  try {
    analysis.raw_result_parsed =
      typeof analysis.raw_result === "string"
        ? JSON.parse(analysis.raw_result)
        : analysis.raw_result;
  } catch {
    analysis.raw_result_parsed = null;
  }

  try {
    analysis.detected_keywords_parsed =
      typeof analysis.detected_keywords === "string"
        ? JSON.parse(analysis.detected_keywords)
        : analysis.detected_keywords;
  } catch {
    analysis.detected_keywords_parsed = [];
  }

  return analysis;
}

// =======================
// SCORE SELON USER PROFILE
// =======================
function scoreUserCompatibility(user, psychologist) {
  let score = 0;

  const userCity = normalizeText(user.city);
  const userLanguage = normalizeText(user.preferred_language);
  const userAddictionType = normalizeText(user.addiction_type);
  const userRiskLevel = normalizeText(user.risk_level);

  const psychologistCity = normalizeText(psychologist.city);
  const specialization = normalizeText(psychologist.specialization);
  const languages = normalizeText(psychologist.languages);

  const experience = safeNumber(psychologist.experience_years);
  const price = safeNumber(psychologist.consultation_price);
  const currentCases = safeNumber(psychologist.current_active_cases);
  const maxCases = safeNumber(psychologist.max_active_cases, 20);
  const rating = safeNumber(psychologist.rating);

  // Spécialité addiction / toxicomanie
  if (
    specialization.includes("addiction") ||
    specialization.includes("toxicomanie") ||
    specialization.includes("drogue") ||
    specialization.includes("substance")
  ) {
    score += 30;
  }

  // Spécialité proche du type d’addiction user
  if (userAddictionType && specialization.includes(userAddictionType)) {
    score += 20;
  }

  // Même ville
  if (userCity && psychologistCity && userCity === psychologistCity) {
    score += 15;
  }

  // Langue préférée
  if (userLanguage && languages.includes(userLanguage)) {
    score += 15;
  }

  // Consultation en ligne
  if (psychologist.accepts_online) {
    score += 10;
  }

  // Consultation présentielle
  if (psychologist.accepts_in_person) {
    score += 5;
  }

  // Expérience
  if (experience >= 10) {
    score += 15;
  } else if (experience >= 5) {
    score += 10;
  } else if (experience >= 2) {
    score += 5;
  }

  // Disponibilité
  if (currentCases < maxCases) {
    score += 10;
  } else {
    score -= 20;
  }

  // Si risque user élevé, favoriser expérience
  if (
    (userRiskLevel === "eleve" ||
      userRiskLevel === "élevé" ||
      userRiskLevel === "critique") &&
    experience >= 5
  ) {
    score += 15;
  }

  // Prix raisonnable
  if (price > 0 && price <= 3000) {
    score += 5;
  }

  // Rating
  if (rating >= 4.5) {
    score += 8;
  } else if (rating >= 4) {
    score += 5;
  }

  return score;
}

// =======================
// SCORE SELON PYTHON NLP
// =======================
function scoreByPythonNlp(latestNlp, psychologist) {
  if (!latestNlp) {
    return 0;
  }

  let score = 0;

  const raw = latestNlp.raw_result_parsed || {};

  const riskLevel = normalizeText(
    raw?.diagnostic?.risk_level || latestNlp.risk_level
  );

  const priority = normalizeText(raw?.diagnostic?.priority);
  const orientation = normalizeText(raw?.diagnostic?.orientation);

  const emotionalState = normalizeText(raw?.analysis?.emotional_state);
  const vulnerability = normalizeText(raw?.analysis?.vulnerability);
  const needsHelp = Boolean(raw?.analysis?.needs_help);
  const relapseSuspected = Boolean(raw?.analysis?.relapse_suspected);

  const intent = normalizeText(raw?.nlp?.intent?.label || latestNlp.intent);
  const globalScore = safeNumber(
    raw?.scores?.global_score || latestNlp.risk_score
  );

  const dominantEmotions = Array.isArray(raw?.analysis?.dominant_emotions)
    ? raw.analysis.dominant_emotions.map(normalizeText)
    : [];

  const specialization = normalizeText(psychologist.specialization);
  const experience = safeNumber(psychologist.experience_years);
  const acceptsOnline = Boolean(psychologist.accepts_online);

  // Risque élevé / critique => psychologue expérimenté
  if (riskLevel === "critique") {
    if (experience >= 8) {
      score += 35;
    } else if (experience >= 5) {
      score += 25;
    } else {
      score += 10;
    }
  } else if (
    riskLevel === "eleve" ||
    riskLevel === "élevé" ||
    riskLevel === "haute"
  ) {
    if (experience >= 5) {
      score += 25;
    } else if (experience >= 2) {
      score += 15;
    }
  } else if (
    riskLevel === "moyen" ||
    riskLevel === "modere" ||
    riskLevel === "modéré"
  ) {
    if (experience >= 2) {
      score += 10;
    }
  }

  // Priorité Python
  if (priority === "haute") {
    score += 15;
  }

  // Orientation Python
  if (orientation === "redirection_humaine") {
    score += 30;

    if (acceptsOnline) {
      score += 10;
    }
  }

  if (orientation === "surveillance_renforcee") {
    score += 20;
  }

  if (orientation === "accompagnement_personnalise") {
    score += 12;
  }

  // Besoin d’aide
  if (needsHelp) {
    score += 15;
  }

  // Rechute suspectée
  if (relapseSuspected) {
    if (
      specialization.includes("addiction") ||
      specialization.includes("toxicomanie") ||
      specialization.includes("rechute") ||
      specialization.includes("substance")
    ) {
      score += 30;
    } else {
      score += 10;
    }
  }

  // Intent Python
  if (intent === "risk of relapse") {
    score += 20;
  }

  if (intent === "need help") {
    score += 15;
  }

  if (intent === "emotional distress") {
    score += 12;
  }

  // État émotionnel
  if (emotionalState === "fragile") {
    score += 12;
  }

  if (emotionalState === "vulnerable") {
    score += 10;
  }

  // Vulnérabilité
  if (vulnerability === "tres_elevee" || vulnerability === "très élevée") {
    score += 25;
  } else if (vulnerability === "elevee" || vulnerability === "élevée") {
    score += 18;
  } else if (vulnerability === "moyenne" || vulnerability === "moderee") {
    score += 8;
  }

  // Émotions dominantes
  if (
    dominantEmotions.includes("fear") ||
    dominantEmotions.includes("nervousness") ||
    dominantEmotions.includes("peur") ||
    dominantEmotions.includes("stress")
  ) {
    if (
      specialization.includes("anxiete") ||
      specialization.includes("anxiété") ||
      specialization.includes("stress")
    ) {
      score += 15;
    }
  }

  if (
    dominantEmotions.includes("sadness") ||
    dominantEmotions.includes("grief") ||
    dominantEmotions.includes("tristesse")
  ) {
    if (
      specialization.includes("depression") ||
      specialization.includes("dépression") ||
      specialization.includes("trauma")
    ) {
      score += 15;
    }
  }

  if (dominantEmotions.includes("anger") || dominantEmotions.includes("colere")) {
    if (
      specialization.includes("colere") ||
      specialization.includes("colère") ||
      specialization.includes("gestion emotion")
    ) {
      score += 12;
    }
  }

  // Score global Python
  if (globalScore >= 12) {
    score += 15;
  } else if (globalScore >= 8) {
    score += 10;
  } else if (globalScore >= 4) {
    score += 5;
  }

  return score;
}

// =======================
// BUILD REASON
// =======================
function buildRecommendationReason(user, psychologist, latestNlp, score) {
  const reasons = [];

  const raw = latestNlp?.raw_result_parsed || {};

  const riskLevel = normalizeText(
    raw?.diagnostic?.risk_level || latestNlp?.risk_level || user.risk_level
  );

  const orientation = normalizeText(raw?.diagnostic?.orientation);
  const vulnerability = normalizeText(raw?.analysis?.vulnerability);
  const needsHelp = Boolean(raw?.analysis?.needs_help);
  const relapseSuspected = Boolean(raw?.analysis?.relapse_suspected);

  const userCity = normalizeText(user.city);
  const psychologistCity = normalizeText(psychologist.city);
  const userLanguage = normalizeText(user.preferred_language);
  const languages = normalizeText(psychologist.languages);
  const specialization = normalizeText(psychologist.specialization);

  if (riskLevel) {
    reasons.push(`niveau de risque ${riskLevel} détecté par l’IA`);
  }

  if (orientation) {
    reasons.push(`orientation IA : ${orientation}`);
  }

  if (
    vulnerability === "elevee" ||
    vulnerability === "élevée" ||
    vulnerability === "tres_elevee"
  ) {
    reasons.push("vulnérabilité élevée détectée");
  }

  if (needsHelp) {
    reasons.push("besoin d’aide identifié");
  }

  if (relapseSuspected) {
    reasons.push("risque de rechute suspecté");
  }

  if (
    specialization.includes("addiction") ||
    specialization.includes("toxicomanie") ||
    specialization.includes("drogue")
  ) {
    reasons.push("psychologue spécialisé en addiction");
  }

  if (userCity && psychologistCity && userCity === psychologistCity) {
    reasons.push("même ville");
  }

  if (userLanguage && languages.includes(userLanguage)) {
    reasons.push("langue compatible");
  }

  if (psychologist.accepts_online) {
    reasons.push("consultation en ligne disponible");
  }

  if (safeNumber(psychologist.experience_years) >= 5) {
    reasons.push("expérience adaptée");
  }

  if (reasons.length === 0) {
    reasons.push("profil compatible avec les besoins de l’utilisateur");
  }

  return `Score ${score}/100 : ${reasons.join(", ")}.`;
}

// =======================
// GENERATE RECOMMENDATIONS
// =======================
async function generateRecommendationsForUser(userId, limit = 3) {
  const users = await query(
    `
    SELECT *
    FROM users
    WHERE id = ?
      AND is_active = TRUE
    `,
    [userId]
  );

  if (users.length === 0) {
    throw new Error("Utilisateur introuvable");
  }

  const user = users[0];

  const latestNlp = await getLatestNlpAnalysis(userId);

  const psychologists = await query(
    `
    SELECT *
    FROM psychologists
    WHERE is_active = TRUE
      AND is_verified = TRUE
    `
  );

  if (psychologists.length === 0) {
    return [];
  }

  const scoredPsychologists = psychologists
    .map((psychologist) => {
      const userScore = scoreUserCompatibility(user, psychologist);
      const nlpScore = scoreByPythonNlp(latestNlp, psychologist);

      let finalScore = userScore + nlpScore;

      // Normaliser score entre 0 et 100
      finalScore = Math.min(100, Math.max(0, finalScore));

      return {
        psychologist,
        score: finalScore,
        userScore,
        nlpScore,
        reason: buildRecommendationReason(
          user,
          psychologist,
          latestNlp,
          finalScore
        ),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Supprimer anciennes recommandations suggested pour éviter doublons
  await query(
    `
    DELETE FROM psychologist_recommendations
    WHERE user_id = ?
      AND status = 'suggested'
    `,
    [userId]
  );

  // Sauvegarder nouvelles recommandations
  for (const item of scoredPsychologists) {
    await query(
      `
      INSERT INTO psychologist_recommendations (
        user_id,
        psychologist_id,
        recommendation_score,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, 'suggested')
      `,
      [
        userId,
        item.psychologist.id,
        item.score,
        item.reason,
      ]
    );
  }

  return scoredPsychologists.map((item) => ({
    psychologist_id: item.psychologist.id,
    full_name: item.psychologist.full_name,
    email: item.psychologist.email,
    phone: item.psychologist.phone,
    specialization: item.psychologist.specialization,
    experience_years: item.psychologist.experience_years,
    city: item.psychologist.city,
    country: item.psychologist.country,
    languages: item.psychologist.languages,
    accepts_online: item.psychologist.accepts_online,
    accepts_in_person: item.psychologist.accepts_in_person,
    consultation_price: item.psychologist.consultation_price,
    currency: item.psychologist.currency,
    rating: item.psychologist.rating,
    recommendation_score: item.score,
    user_score: item.userScore,
    nlp_score: item.nlpScore,
    reason: item.reason,
    latest_nlp: latestNlp
      ? {
          risk_level:
            latestNlp.raw_result_parsed?.diagnostic?.risk_level ||
            latestNlp.risk_level,
          priority: latestNlp.raw_result_parsed?.diagnostic?.priority,
          orientation: latestNlp.raw_result_parsed?.diagnostic?.orientation,
          emotional_state:
            latestNlp.raw_result_parsed?.analysis?.emotional_state,
          vulnerability:
            latestNlp.raw_result_parsed?.analysis?.vulnerability,
          needs_help:
            latestNlp.raw_result_parsed?.analysis?.needs_help,
          relapse_suspected:
            latestNlp.raw_result_parsed?.analysis?.relapse_suspected,
          dominant_emotions:
            latestNlp.raw_result_parsed?.analysis?.dominant_emotions,
          global_score:
            latestNlp.raw_result_parsed?.scores?.global_score,
        }
      : null,
  }));
}

module.exports = {
  getLatestNlpAnalysis,
  scoreUserCompatibility,
  scoreByPythonNlp,
  generateRecommendationsForUser,
};