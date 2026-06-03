"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * FloatingParticles — Particules apaisantes flottant lentement en fond.
 * Effet "calme thérapeutique" sans surcharge visuelle.
 *
 * Usage:
 *   <FloatingParticles />
 *   <FloatingParticles count={20} variant="mint" />
 */

interface FloatingParticlesProps {
  count?: number;
  variant?: "teal" | "mint" | "blue" | "mixed";
  speed?: "slow" | "normal";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  color: string;
}

const COLOR_POOL = {
  teal: ["#5FBFB8", "#7BC4E0"],
  mint: ["#B5EAD7", "#A8E6CF"],
  blue: ["#A7E3F5", "#7BC4E0"],
  mixed: ["#5FBFB8", "#A8E6CF", "#A7E3F5", "#B5EAD7"],
};

export function FloatingParticles({
  count = 15,
  variant = "mixed",
  speed = "slow",
}: FloatingParticlesProps) {
  const particles = useMemo<Particle[]>(() => {
    const colors = COLOR_POOL[variant];
    const baseDuration = speed === "slow" ? 18 : 12;

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      duration: baseDuration + Math.random() * 8,
      delay: Math.random() * 6,
      driftX: -20 + Math.random() * 40,
      color: colors[i % colors.length],
    }));
  }, [count, variant, speed]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}%`,
            y: `${p.y}%`,
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            y: ["0%", "-120%"],
            x: [`${p.x}%`, `${p.x + p.driftX}%`],
            opacity: [0, 0.6, 0.6, 0],
            scale: [0.5, 1, 1, 0.6],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
}
