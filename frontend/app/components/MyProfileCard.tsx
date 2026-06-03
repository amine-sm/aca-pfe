"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HeartHandshake,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";

import { getMyOnboardingProfile, PatientProfile } from "@/lib/onboardingApi";

/**
 * Carte profil PATIENT à insérer dans le dashboard utilisateur.
 *
 * Affiche UNIQUEMENT :
 *  - Le type d'accompagnement (addiction)
 *  - Un statut bienveillant (sans niveau "critique" explicite)
 *  - Le message d'orientation
 *  - Les actions recommandées
 *  - Les recommandations personnalisées
 *
 * N'affiche PAS :
 *  - Le score chiffré (ex: 18/24)
 *  - Le niveau de risque brut (ex: "critique")
 *  - Les sévérités, émotions cliniques, intent, mots-clés
 *  - Les réponses brutes
 */
export function MyProfileCard() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOnboardingProfile()
      .then((res) => setProfile(res.profile))
      .catch((err) => setError(err.message || "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-sm">
        <Loader2 className="animate-spin text-[#1B4F59] dark:text-teal-400" size={20} />
        <span className="text-sm font-semibold text-[var(--muted)]">
          Chargement de votre suivi…
        </span>
      </div>
    );
  }

  // Pas encore d'évaluation : on invite à la faire
  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-cyan-50 p-7 shadow-sm dark:border-teal-500/30 dark:from-teal-500/10 dark:to-cyan-500/10"
      >
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[#1B4F59] backdrop-blur dark:bg-slate-800/80 dark:text-teal-300">
          <Sparkles size={12} />
          Évaluation initiale
        </div>

        <h3 className="text-xl font-black text-[var(--text)]">
          Faisons connaissance
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
          Quelques minutes suffisent pour construire votre parcours
          d&apos;accompagnement personnalisé.
        </p>

        <Link
          href="/onboarding"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:bg-[#153f47] dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          Commencer l&apos;évaluation
          <ArrowRight size={16} />
        </Link>
      </motion.div>
    );
  }

  const toneClasses = getToneClasses(profile.status.tone);
  const dateLabel = formatDate(profile.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm"
    >
      {/* Bandeau coloré selon le ton */}
      <div className={`px-7 py-5 ${toneClasses.banner}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses.iconBg}`}>
              <HeartHandshake size={20} className={toneClasses.iconText} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${toneClasses.subtitle}`}>
                Votre accompagnement
              </p>
              <p className={`text-base font-black ${toneClasses.title}`}>
                {profile.status.label}
              </p>
            </div>
          </div>

          {profile.addiction && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${toneClasses.badge}`}>
              {profile.addiction.label}
            </span>
          )}
        </div>
      </div>

      {/* Corps */}
      <div className="space-y-6 px-7 pb-7 pt-5">
        {profile.orientation && (
          <div>
            <h4 className="text-sm font-black text-[var(--text)]">
              {profile.orientation.title}
            </h4>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              {profile.orientation.message}
            </p>

            {profile.orientation.actions.length > 0 && (
              <ul className="mt-4 space-y-2">
                {profile.orientation.actions.slice(0, 4).map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0 text-[#1B4F59] dark:text-teal-400"
                    />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {profile.recommendations.length > 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--sidebar)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              <p className="text-sm font-black text-[var(--text)]">
                Suggestions pour vous
              </p>
            </div>
            <ul className="space-y-2">
              {profile.recommendations.slice(0, 3).map((reco, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--teal-soft)] text-[10px] font-black text-[#1B4F59] dark:text-teal-300">
                    {i + 1}
                  </span>
                  <span>{reco}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 text-xs font-medium text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {profile.answers_summary && (
              <span className="inline-flex items-center gap-1.5">
                <ClipboardCheck size={12} />
                {profile.answers_summary.total} questions répondues
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} />
              Confidentiel
            </span>
          </div>
          <span>Évalué le {dateLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}


function getToneClasses(tone: "positive" | "neutral" | "support") {
  if (tone === "support") {
    return {
      banner:
        "bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-500/10 dark:to-orange-500/10",
      iconBg: "bg-white shadow-sm dark:bg-rose-500/20",
      iconText: "text-rose-600 dark:text-rose-300",
      title: "text-rose-900 dark:text-rose-100",
      subtitle: "text-rose-700/70 dark:text-rose-300/70",
      badge:
        "bg-white/80 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    };
  }
  if (tone === "neutral") {
    return {
      banner:
        "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10",
      iconBg: "bg-white shadow-sm dark:bg-amber-500/20",
      iconText: "text-amber-600 dark:text-amber-300",
      title: "text-amber-900 dark:text-amber-100",
      subtitle: "text-amber-700/70 dark:text-amber-300/70",
      badge:
        "bg-white/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    };
  }
  return {
    banner:
      "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10",
    iconBg: "bg-white shadow-sm dark:bg-emerald-500/20",
    iconText: "text-emerald-600 dark:text-emerald-300",
    title: "text-emerald-900 dark:text-emerald-100",
    subtitle: "text-emerald-700/70 dark:text-emerald-300/70",
    badge:
      "bg-white/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  };
}


function formatDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
