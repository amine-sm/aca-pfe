import { apiFetch } from "./api";


export type DetectedLanguage = "darija" | "french" | "arabic" | "mixed" | "unknown";
export type PipelineUsed = "dziribert" | "classic_nlp";
export type PipelineForce = "dziribert" | "classic_nlp" | null;

export interface LanguageInfo {
  language: DetectedLanguage;
  confidence: number;
  scores: {
    darija: number;
    french: number;
    arabic: number;
  };
  should_use_dziribert: boolean;
  details?: unknown;
}

export interface SmartAnalysis {
  crisis?: {
    label: string;
    confidence: number;
    severity: "low" | "moderate" | "high" | "critical";
  };
  sentiment?: {
    label: string;
    confidence: number;
  } | null;
  addiction_type?: {
    label: string;
    confidence: number;
  } | null;
  emotions?: {
    top: string;
    confidence: number;
    all_top_3?: string[];
  } | null;
  intent?: string;
}

export interface EmergencyInfo {
  title: string;
  message_fr: string;
  message_ar: string;
  emergency_contact: {
    name: string;
    phone: string;
    label: string;
  };
  additional_resources: Array<{ name: string; info: string }>;
}

export interface SmartChatResponse {
  success: boolean;
  is_crisis: boolean;
  response_text: string;
  language: LanguageInfo;
  pipeline_used: PipelineUsed;
  analysis?: SmartAnalysis;
  emergency_info?: EmergencyInfo;
  conversation_id?: number;
  should_block_chat?: boolean;
}


export function smartChat(payload: {
  message: string;
  conversation_id?: number;
  country?: string;
  force_pipeline?: PipelineForce;
}) {
  return apiFetch<SmartChatResponse>("/smart/chat", {
    method: "POST",
    body: JSON.stringify({
      country: "DZ",
      force_pipeline: null,
      ...payload,
    }),
  });
}


export function detectMessageLanguage(message: string) {
  return apiFetch<{
    success: boolean;
    input: string;
    result: LanguageInfo;
  }>("/smart/detect-language", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}