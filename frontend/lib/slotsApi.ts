import { apiFetch } from "./api";

export type SlotMode = "online" | "in_person";

export type CreateSlotPayload = {
  slot_date: string;
  start_time: string;
  end_time: string;
  mode?: SlotMode;
};

export function createSlot(payload: CreateSlotPayload) {
  return apiFetch("/slots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMySlots() {
  return apiFetch("/slots/psychologist/me");
}

export function getAvailableSlots(psychologistId: number | string) {
  return apiFetch(`/slots/available/${psychologistId}`);
}

export function deleteSlot(id: number | string) {
  return apiFetch(`/slots/${id}`, {
    method: "DELETE",
  });
}