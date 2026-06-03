import { apiFetch } from "./api";

export type CreateAppointmentPayload = {
  slot_id: number;
  notes?: string;
};

export function createAppointment(payload: CreateAppointmentPayload) {
  return apiFetch("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyAppointments() {
  return apiFetch("/appointments/me");
}

export function cancelMyAppointment(id: number | string) {
  return apiFetch(`/appointments/${id}/cancel`, {
    method: "PATCH",
  });
}

export function getPsychologistAppointments() {
  return apiFetch("/appointments/psychologist/me");
}

export function updateAppointmentStatus(id: number | string, status: string) {
  return apiFetch(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}