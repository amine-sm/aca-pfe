import { apiFetch } from "./api";

export function generateRecommendations() {
  return apiFetch("/recommendations/generate", {
    method: "POST",
  });
}

export function getMyRecommendations() {
  return apiFetch("/recommendations/me");
}

export function getMyActivePsychologist() {
  return apiFetch("/recommendations/me/active-psychologist");
}

export function acceptRecommendation(id: number | string) {
  return apiFetch(`/recommendations/${id}/accept`, {
    method: "POST",
  });
}

export function rejectRecommendation(id: number | string) {
  return apiFetch(`/recommendations/${id}/reject`, {
    method: "POST",
  });
}