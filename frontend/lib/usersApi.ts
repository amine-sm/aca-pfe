import { apiFetch } from "./api";

export type RegisterUserPayload = {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  city?: string;
  country?: string;
  preferred_language?: string;
  addiction_type?: string;
  consumption_level?: string;
};

export type SubmitFullQuestionnairePayload = {
  title?: string;
  questionnaire_type?: string;
  message?: string;
  questionnaire: Record<string, any>;
};

export function registerUser(payload: RegisterUserPayload) {
  return apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
}

export function getMyProfile() {
  return apiFetch("/users/me");
}

export function getMyQuestionnaires() {
  return apiFetch("/users/questionnaires");
}

export function submitFullQuestionnaire(payload: SubmitFullQuestionnairePayload) {
  return apiFetch("/users/questionnaires/submit-full", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}