import { apiFetch } from "./api";

export interface QwenQuestionOption {
  value: string;
  label: string;
  severity: "low" | "medium" | "high";
}

export interface QwenQuestion {
  id: string;
  title: string;
  question: string;
  type: "single_choice";
  options: QwenQuestionOption[];
  source: "qwen" | "fallback";
}

export interface QwenAnswer {
  question_id: string;
  title: string;
  question: string;
  value: string;
  label: string;
  severity: "low" | "medium" | "high";
}

export interface QwenNlp {
  sentiment: string;
  top_emotions: string[];
  intent: string;
}

export interface QwenGenerateResponse {
  success: boolean;
  nlp: QwenNlp;
  questions: QwenQuestion[];
  total: number;
}

export interface QwenProfile {
  risk: { level: string; score: number; max_score: number };
  nlp: { sentiment: string; dominant_emotions: string[]; intent: string };
  answers_summary: { total: number; high_severity: number; medium_severity: number };
  orientation: {
    type: string;
    title: string;
    message: string;
    actions: string[];
  };
  recommendations: string[];
  raw_answers: QwenAnswer[];
}

/**
 * Étape 1 : envoie le texte libre, reçoit 10 questions de Qwen
 */
export function generateQwenQuestions(payload: {
  free_text: string;
  nb_questions?: number;
}) {
  return apiFetch<QwenGenerateResponse>("/qwen-onboarding/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Étape 2 : envoie les réponses, reçoit le profil final
 */
export function finishQwenOnboarding(payload: {
  free_text: string;
  answers: QwenAnswer[];
}) {
  return apiFetch<{
    success: boolean;
    profile_id: number | null;
    profile: QwenProfile;
  }>("/qwen-onboarding/finish", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
