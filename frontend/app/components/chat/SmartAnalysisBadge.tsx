"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Activity, Languages, Zap } from "lucide-react";
import type {
  SmartAnalysis,
  LanguageInfo,
  PipelineUsed,
} from "@/lib/smartChatApi";


interface SmartAnalysisBadgeProps {
  language?: LanguageInfo;
  analysis?: SmartAnalysis;
  pipeline?: PipelineUsed;
}


export function SmartAnalysisBadge({
  language,
  analysis,
  pipeline,
}: SmartAnalysisBadgeProps) {
  if (!language && !analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-2 space-y-1.5"
    >
      {/* Ligne 1 : Langue + Pipeline */}
      {language && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            <Languages size={10} />
            {getLanguageLabel(language.language)} ({Math.round(language.confidence * 100)}%)
          </span>

          {pipeline && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                pipeline === "dziribert"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                  : "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
              }`}
            >
              <Zap size={10} />
              {pipeline === "dziribert" ? "DziriBERT" : "NLP classique"}
            </span>
          )}
        </div>
      )}

      {/* Ligne 2 : Analyse détaillée */}
      {analysis && (analysis.sentiment || analysis.addiction_type || analysis.emotions) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {analysis.sentiment && (
            <BadgeItem
              icon={<Activity size={10} />}
              label="Sentiment"
              value={analysis.sentiment.label}
              confidence={analysis.sentiment.confidence}
              colorClass={getSentimentColor(analysis.sentiment.label)}
            />
          )}

          {analysis.addiction_type && (
            <BadgeItem
              icon={<Sparkles size={10} />}
              label="Type"
              value={analysis.addiction_type.label}
              confidence={analysis.addiction_type.confidence}
              colorClass="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
            />
          )}

          {analysis.emotions?.top && (
            <BadgeItem
              icon={<Brain size={10} />}
              label="Émotion"
              value={analysis.emotions.top}
              confidence={analysis.emotions.confidence}
              colorClass="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
            />
          )}
        </div>
      )}
    </motion.div>
  );
}


function BadgeItem({
  icon,
  label,
  value,
  confidence,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  confidence: number;
  colorClass: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${colorClass}`}
      title={`Confiance : ${(confidence * 100).toFixed(0)}%`}
    >
      {icon}
      <span className="opacity-75">{label}:</span>
      <span>{value}</span>
      <span className="opacity-60">({Math.round(confidence * 100)}%)</span>
    </div>
  );
}


function getLanguageLabel(lang: string): string {
  switch (lang) {
    case "darija": return "🇩🇿 Darija";
    case "french": return "🇫🇷 Français";
    case "arabic": return "🇸🇦 Arabe";
    case "mixed": return "🇩🇿🇫🇷 Mixte";
    default: return "❓ Inconnue";
  }
}


function getSentimentColor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("posit")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  }
  if (l.includes("negat")) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
}