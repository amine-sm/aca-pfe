"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Activity } from "lucide-react";
import type { DziriAnalysis } from "@/lib/dziribertApi";


interface DziriAnalysisBadgeProps {
  analysis: DziriAnalysis | undefined;
  compact?: boolean;
}


/**
 * 🇩🇿 Badge d'analyse DziriBERT
 * =============================
 *
 * Affiche les résultats de l'analyse sous chaque message du patient :
 * - Sentiment détecté
 * - Type d'addiction
 * - Niveau de crise (si non nul)
 *
 * Cela MONTRE au jury que DziriBERT travaille en temps réel.
 */
export function DziriAnalysisBadge({
  analysis,
  compact = false,
}: DziriAnalysisBadgeProps) {
  if (!analysis || (!analysis.sentiment && !analysis.addiction_type)) {
    return null;
  }

  const sentimentColor = getSentimentColor(analysis.sentiment?.label);
  const crisisColor = getCrisisColor(analysis.crisis?.severity);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]"
      >
        {analysis.sentiment && (
          <span className={`rounded-full px-2 py-0.5 font-bold ${sentimentColor}`}>
            🇩🇿 {analysis.sentiment.label}
          </span>
        )}
        {analysis.addiction_type && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
            {analysis.addiction_type.label}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-2 rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50/50 to-teal-50/50 p-2.5 dark:border-slate-700 dark:from-purple-500/5 dark:to-teal-500/5"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300">
          <Brain size={11} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          🇩🇿 Analyse DziriBERT
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {/* Sentiment */}
        {analysis.sentiment && (
          <BadgeItem
            icon={<Activity size={10} />}
            label="Sentiment"
            value={analysis.sentiment.label}
            confidence={analysis.sentiment.confidence}
            colorClass={sentimentColor}
          />
        )}

        {/* Addiction type */}
        {analysis.addiction_type && (
          <BadgeItem
            icon={<Sparkles size={10} />}
            label="Type"
            value={analysis.addiction_type.label}
            confidence={analysis.addiction_type.confidence}
            colorClass="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
          />
        )}

        {/* Crisis (seulement si confidence significative) */}
        {analysis.crisis && analysis.crisis.confidence > 0.3 && (
          <BadgeItem
            icon={<Activity size={10} />}
            label="Crisis"
            value={analysis.crisis.severity}
            confidence={analysis.crisis.confidence}
            colorClass={crisisColor}
          />
        )}
      </div>
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
      <span className="opacity-60">({(confidence * 100).toFixed(0)}%)</span>
    </div>
  );
}


// ============================================================
// HELPERS
// ============================================================

function getSentimentColor(label?: string): string {
  if (!label) return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  const l = label.toLowerCase();
  if (l.includes("posit") || l.includes("positif")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  }
  if (l.includes("negat") || l.includes("négatif")) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
}


function getCrisisColor(severity?: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500 text-white";
    case "high":
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    case "moderate":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    default:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  }
}
