import { apiFetch } from "./api";

export function startConversation(payload?: { title?: string }) {
  return apiFetch("/conversations/start", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export function sendConversationMessage(payload: {
  conversation_id: number;
  message: string;
  questionnaire?: Record<string, any>;
}) {
  return apiFetch("/conversations/message", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyConversations() {
  return apiFetch("/conversations");
}

export function getConversationById(id: number | string) {
  return apiFetch(`/conversations/${id}`);
}

export function deleteConversation(id: number | string) {
  return apiFetch(`/conversations/${id}`, {
    method: "DELETE",
  });
}