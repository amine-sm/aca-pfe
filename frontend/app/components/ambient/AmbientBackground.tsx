"use client";

import { ReactNode } from "react";
import { BrainWaves } from "./BrainWaves";
import { FloatingParticles } from "./FloatingParticles";

/**
 * AmbientBackground — Wrapper magique qui ajoute une ambiance médicale apaisante
 * à n'importe quelle page (gradient + particules + ondes).
 *
 * Usage:
 *   <AmbientBackground>
 *     <YourPageContent />
 *   </AmbientBackground>
 *
 *   <AmbientBackground variant="intense" showWaves={false}>
 *     ...
 *   </AmbientBackground>
 */

interface AmbientBackgroundProps {
  children: ReactNode;
  variant?: "calm" | "medical" | "intense";
  showWaves?: boolean;
  showParticles?: boolean;
  className?: string;
}

export function AmbientBackground({
  children,
  variant = "calm",
  showWaves = true,
  showParticles = true,
  className = "",
}: AmbientBackgroundProps) {
  // Gradient adapté selon la variante
  const bgGradient =
    variant === "intense"
      ? "from-cyan-50 via-teal-50 to-emerald-50 dark:from-slate-900 dark:via-teal-950/30 dark:to-emerald-950/30"
      : variant === "medical"
      ? "from-sky-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-sky-950/40 dark:to-teal-950/30"
      : "from-teal-50/50 via-mint-50/40 to-cyan-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950";

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${bgGradient} ${className}`}
    >
      {/* Halos doux derrière */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/4 h-[480px] w-[480px] rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute top-1/3 right-[-100px] h-[420px] w-[420px] rounded-full bg-sky-200/30 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute bottom-[-100px] left-[-80px] h-[360px] w-[360px] rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-500/10" />
      </div>

      {/* Particules flottantes */}
      {showParticles && (
        <FloatingParticles count={15} variant="mixed" speed="slow" />
      )}

      {/* Ondes EEG bas de page */}
      {showWaves && <BrainWaves position="bottom" intensity="subtle" />}

      {/* Contenu */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
