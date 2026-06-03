import { apiFetch } from "./api";

export interface AddictionType {
  value: string;
  label: string;
  icon: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  severity: "low" | "medium" | "high";
}

export interface OnboardingQuestion {
  id: string;
  title: string;
  question: string;
  type: "single_choice" | "scale";
  options: QuestionOption[];
  source: "keyword" | "emotion" | "generic" | "qwen";
  trigger?: string;
}

export interface OnboardingAnswer {
  question_id: string;
  title: string;
  question: string;
  value: string;
  label: string;
  severity: "low" | "medium" | "high";
  source?: string;
}

export interface OnboardingProgress {
  answered: number;
  min: number;
  max: number;
  estimated_remaining: number;
}

export interface OnboardingNlp {
  sentiment: string;
  top_emotions: string[];
  intent: string;
}

export interface OnboardingStepResponse {
  success: boolean;
  nlp: OnboardingNlp;
  next_question: OnboardingQuestion | null;
  progress: OnboardingProgress;
  should_continue: boolean;
}

// ====================================
// Vue PATIENT (sanitisée) — utilisée par /dashboard
// ====================================
export interface PatientProfile {
  id: number;
  created_at: string;
  addiction: { value: string; label: string } | null;
  status: {
    label: string;
    tone: "positive" | "neutral" | "support";
  };
  orientation: {
    title: string;
    message: string;
    actions: string[];
  } | null;
  recommendations: string[];
  answers_summary: { total: number } | null;
}

// ====================================
// Vue PSYCHOLOGUE (clinique complète) — utilisée par /psychologist/patient/[id]
// ====================================
export interface ClinicalProfile {
  id: number;
  created_at: string;
  updated_at: string;
  addiction_type: string;
  free_text: string;
  risk_level: string;
  risk_score: number;
  orientation_type: string;
  sentiment: string;
  dominant_emotions: string[];
  recommendations: string[];
  answers: OnboardingAnswer[];
  full_profile: any;
}

export interface ClinicalPatientFull {
  patient: {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
    gender?: string;
    birth_date?: string;
    city?: string;
    country?: string;
    addiction_type?: string;
    risk_level?: string;
    created_at: string;
  };
  latest_profile: ClinicalProfile | null;
  profile_history: Array<{
    id: number;
    addiction_type: string;
    risk_level: string;
    risk_score: number;
    orientation_type: string;
    created_at: string;
  }>;
}

export interface FullOnboardingProfile {
  addiction: { value: string; label: string };
  risk: { level: string; score: number; max_score: number };
  nlp: {
    sentiment: string;
    dominant_emotions: string[];
    intent: string;
  };
  answers_summary: {
    total: number;
    high_severity: number;
    medium_severity: number;
  };
  orientation: {
    type: string;
    title: string;
    message: string;
    actions: string[];
  };
  recommendations: string[];
  raw_answers: OnboardingAnswer[];
}


// ====================================
// API calls
// ====================================
export function getAddictions() {
  return apiFetch<{ success: boolean; addictions: AddictionType[] }>(
    "/onboarding/addictions",
    { auth: false }
  );
}

export function startOnboarding(payload: {
  addiction_type: string;
  free_text: string;
}) {
  return apiFetch<OnboardingStepResponse>("/onboarding/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function nextOnboardingQuestion(payload: {
  addiction_type: string;
  free_text: string;
  previous_answers: OnboardingAnswer[];
  use_qwen?: boolean;
}) {
  return apiFetch<OnboardingStepResponse>("/onboarding/next", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function finishOnboarding(payload: {
  addiction_type: string;
  free_text: string;
  answers: OnboardingAnswer[];
}) {
  return apiFetch<{
    success: boolean;
    profile_id: number | null;
    profile: FullOnboardingProfile;
  }>("/onboarding/finish", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Vue PATIENT (sanitisée)
export function getMyOnboardingProfile() {
  return apiFetch<{ success: boolean; profile: PatientProfile | null }>(
    "/onboarding/me"
  );
}

// Vue PSYCHOLOGUE/ADMIN (clinique complète)
export function getPatientClinicalProfile(userId: number | string) {
  return apiFetch<{ success: boolean } & ClinicalPatientFull>(
    `/onboarding/patient/${userId}`
  );
}
