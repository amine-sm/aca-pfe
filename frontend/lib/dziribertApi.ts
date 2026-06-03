/**
 * 🇩🇿 Client API pour DziriBERT
 * ==============================
 *
 * Wrappers TypeScript autour des endpoints backend Node.
 */

import { apiFetch } from "./api";


// ============================================================
// TYPES
// ============================================================

export type CrisisSeverity = "low" | "moderate" | "high" | "critical";

export interface DziriAnalysis {
  crisis: {
    label: string;
    confidence: number;
    severity: CrisisSeverity;
  };
  sentiment: {
    label: string;
    confidence: number;
    all_scores?: Record<string, number>;
  } | null;
  addiction_type: {
    label: string;
    confidence: number;
    all_scores?: Record<string, number>;
  } | null;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  label: string;
}

export interface EmergencyInfo {
  title: string;
  message_fr: string;
  message_ar: string;
  emergency_contact: EmergencyContact;
  additional_resources: Array<{ name: string; info: string }>;
}

export interface DziriChatResponse {
  success: boolean;
  is_crisis: boolean;
  response_text: string;
  analysis: DziriAnalysis;
  emergency_info?: EmergencyInfo;
  conversation_id?: number;
  user_message_id?: number;
  assistant_message_id?: number;
  pipeline?: string;
  should_block_chat?: boolean;
}

export interface DziriAnalyzeResponse {
  success: boolean;
  is_crisis: boolean;
  should_block_chat: boolean;
  crisis: DziriAnalysis["crisis"];
  sentiment: DziriAnalysis["sentiment"];
  addiction_type: DziriAnalysis["addiction_type"];
  emergency_response?: EmergencyInfo;
}

export interface CrisisAlert {
  id: number;
  user_id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  message: string;
  severity: CrisisSeverity;
  confidence: number;
  created_at: string;
  acknowledged: boolean;
}


// ============================================================
// FONCTIONS API
// ============================================================

/**
 * 💬 Chat principal avec DziriBERT + Qwen
 */
export function dziriChat(payload: {
  message: string;
  conversation_id?: number;
  response_language?: "darija" | "fr" | "ar";
  country?: string;
}) {
  return apiFetch<DziriChatResponse>("/dziri/chat", {
    method: "POST",
    body: JSON.stringify({
      response_language: "darija",
      country: "DZ",
      ...payload,
    }),
  });
}


/**
 * 🔬 Analyse seule (sans génération Qwen)
 */
export function dziriAnalyze(payload: {
  message: string;
  country?: string;
}) {
  return apiFetch<DziriAnalyzeResponse>("/dziri/analyze", {
    method: "POST",
    body: JSON.stringify({
      country: "DZ",
      ...payload,
    }),
  });
}


/**
 * ℹ️ Infos sur les modèles chargés
 */
export function dziriInfo() {
  return apiFetch<{
    success: boolean;
    device: string;
    models_loaded: string[];
    models_details: Record<string, {
      labels: string[];
      num_labels: number;
      architecture: string;
    }>;
  }>("/dziri/info");
}


/**
 * 🚨 Récupère les alertes de crise (psychologue/admin)
 */
export function getCrisisAlerts() {
  return apiFetch<{
    success: boolean;
    total: number;
    alerts: CrisisAlert[];
  }>("/dziri/crisis-alerts");
}
