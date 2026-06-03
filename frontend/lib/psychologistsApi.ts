import { apiFetch } from "./api";

export function getPublicPsychologists() {
  return apiFetch("/psychologists", {
    auth: false,
  });
}

export function getMyPsychologistProfile() {
  return apiFetch("/psychologists/me");
}

export function getMyPatients() {
  return apiFetch("/psychologists/me/patients");
}