"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * BreathingCircle — Cercle qui se gonfle et dégonfle pour guider la respiration.
 * Cycle : Inhale 4s → Hold 2s → Exhale 4s → Pause 2s
 *
 * Usage:
 *   <BreathingCircle />
 *   <BreathingCircle size={200} showLabel />
 */

interface BreathingCircleProps {
  size?: number;
  showLabel?: boolean;
  color?: "teal" | "mint" | "blue";
  ariaLabel?: string;
}

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out";

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Inspirez",
  "hold-in": "Retenez",
  exhale: "Expirez",
  "hold-out": "Détendez",
};

const PHASE_DURATIONS: Record<Phase, number> = {
  inhale: 4000,
  "hold-in": 2000,
  exhale: 4000,
  "hold-out": 2000,
};

const NEXT_PHASE: Record<Phase, Phase> = {
  inhale: "hold-in",
  "hold-in": "exhale",
  exhale: "hold-out",
  "hold-out": "inhale",
};

export function BreathingCircle({
  size = 180,
  showLabel = false,
  color = "teal",
  ariaLabel = "Cercle de respiration",
}: BreathingCircleProps) {
  const [phase, setPhase] = useState<Phase>("inhale");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPhase((p) => NEXT_PHASE[p]);
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timeout);
  }, [phase]);

  const scale = phase === "inhale" || phase === "hold-in" ? 1 : 0.55;
  const duration =
    phase === "inhale"
      ? 4
      : phase === "exhale"
      ? 4
      : 0;

  const gradientColors =
    color === "blue"
      ? ["#A7E3F5", "#7BC4E0"]
      : color === "mint"
      ? ["#C8F4D8", "#8FD9B0"]
      : ["#B5EAD7", "#5FBFB8"];

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Halo externe */}
      <motion.div
        animate={{ scale: scale * 1.3, opacity: 0.15 }}
        transition={{ duration, ease: [0.45, 0, 0.55, 1] }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${gradientColors[0]} 0%, transparent 70%)`,
        }}
      />

      {/* Halo moyen */}
      <motion.div
        animate={{ scale: scale * 1.1, opacity: 0.25 }}
        transition={{ duration, ease: [0.45, 0, 0.55, 1] }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${gradientColors[0]} 0%, transparent 60%)`,
        }}
      />

      {/* Cercle principal */}
      <motion.div
        animate={{ scale }}
        transition={{ duration, ease: [0.45, 0, 0.55, 1] }}
        className="absolute rounded-full shadow-2xl"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
          boxShadow: `0 0 60px ${gradientColors[0]}80`,
        }}
      />

      {/* Cercle intérieur translucide */}
      <motion.div
        animate={{ scale: scale * 0.8 }}
        transition={{ duration, ease: [0.45, 0, 0.55, 1] }}
        className="absolute rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(4px)",
        }}
      />

      {showLabel && (
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="relative z-10 text-sm font-bold uppercase tracking-widest text-white drop-shadow-md"
        >
          {PHASE_LABELS[phase]}
        </motion.p>
      )}
    </div>
  );
}
