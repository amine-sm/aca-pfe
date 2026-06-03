"use client";

import { motion } from "framer-motion";

/**
 * Heartbeat — Petit indicateur de pulsation cardiaque (ECG style).
 * Idéal en discret en coin pour évoquer le côté médical.
 *
 * Usage:
 *   <Heartbeat />
 *   <Heartbeat label="Suivi actif" />
 */

interface HeartbeatProps {
  label?: string;
  color?: "teal" | "rose" | "mint";
  size?: "sm" | "md";
}

export function Heartbeat({
  label,
  color = "teal",
  size = "sm",
}: HeartbeatProps) {
  const strokeColor =
    color === "rose"
      ? "#EC9DAA"
      : color === "mint"
      ? "#8FD9B0"
      : "#5FBFB8";

  const dotColor =
    color === "rose"
      ? "#E27084"
      : color === "mint"
      ? "#6BC691"
      : "#3FA89F";

  const widthClass = size === "md" ? "w-24" : "w-16";

  return (
    <div className="inline-flex items-center gap-2">
      <svg
        className={`${widthClass} h-6`}
        viewBox="0 0 100 24"
        fill="none"
      >
        {/* Ligne ECG */}
        <path
          d="M0,12 L20,12 L26,4 L32,20 L38,12 L50,12 L56,8 L62,16 L68,12 L100,12"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <animate
            attributeName="stroke-dasharray"
            from="0,120"
            to="120,0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>

        {/* Point qui bat */}
        <motion.circle
          cx="100"
          cy="12"
          r="3"
          fill={dotColor}
          animate={{
            scale: [1, 1.4, 1, 1.4, 1],
            opacity: [1, 0.7, 1, 0.7, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "100px 12px" }}
        />
      </svg>

      {label && (
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: dotColor }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
