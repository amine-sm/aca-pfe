"use client";

/**
 * BrainWaves — Ondes cérébrales (EEG style) animées.
 * Effet visuel apaisant en arrière-plan.
 *
 * Usage:
 *   <BrainWaves position="top" />
 *   <BrainWaves position="bottom" intensity="subtle" />
 */

interface BrainWavesProps {
  position?: "top" | "bottom" | "center";
  intensity?: "subtle" | "normal" | "strong";
  color?: "teal" | "blue" | "mint";
}

export function BrainWaves({
  position = "bottom",
  intensity = "normal",
  color = "teal",
}: BrainWavesProps) {
  const opacity =
    intensity === "subtle" ? 0.15 : intensity === "strong" ? 0.5 : 0.3;

  const strokeColor =
    color === "blue"
      ? "#7BC4E0"
      : color === "mint"
      ? "#A8E6CF"
      : "#5FBFB8";

  const positionStyle =
    position === "top"
      ? { top: 0 }
      : position === "center"
      ? { top: "50%", transform: "translateY(-50%)" }
      : { bottom: 0 };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 right-0 z-0"
      style={positionStyle}
    >
      <svg
        viewBox="0 0 1200 200"
        className="w-full h-32 md:h-48"
        preserveAspectRatio="none"
        style={{ opacity }}
      >
        <defs>
          <linearGradient id="brain-wave-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0" />
            <stop offset="50%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Onde principale (EEG) */}
        <path
          d="M0,100 Q50,90 100,100 T200,100 Q220,70 240,100 Q260,140 280,100 Q300,80 320,100 T420,100 Q450,70 480,100 T600,100 Q620,60 640,100 Q660,140 680,100 T800,100 Q830,80 860,100 T1000,100 Q1050,90 1100,100 T1200,100"
          fill="none"
          stroke="url(#brain-wave-grad)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            dur="6s"
            repeatCount="indefinite"
            values="
              M0,100 Q50,90 100,100 T200,100 Q220,70 240,100 Q260,140 280,100 Q300,80 320,100 T420,100 Q450,70 480,100 T600,100 Q620,60 640,100 Q660,140 680,100 T800,100 Q830,80 860,100 T1000,100 Q1050,90 1100,100 T1200,100;
              M0,100 Q50,110 100,100 T200,100 Q220,130 240,100 Q260,60 280,100 Q300,120 320,100 T420,100 Q450,130 480,100 T600,100 Q620,140 640,100 Q660,60 680,100 T800,100 Q830,120 860,100 T1000,100 Q1050,110 1100,100 T1200,100;
              M0,100 Q50,90 100,100 T200,100 Q220,70 240,100 Q260,140 280,100 Q300,80 320,100 T420,100 Q450,70 480,100 T600,100 Q620,60 640,100 Q660,140 680,100 T800,100 Q830,80 860,100 T1000,100 Q1050,90 1100,100 T1200,100
            "
          />
        </path>

        {/* Onde secondaire plus douce */}
        <path
          d="M0,100 Q100,95 200,100 T400,100 T600,100 T800,100 T1000,100 T1200,100"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          strokeOpacity="0.5"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            dur="9s"
            repeatCount="indefinite"
            values="
              M0,100 Q100,95 200,100 T400,100 T600,100 T800,100 T1000,100 T1200,100;
              M0,100 Q100,105 200,100 T400,100 T600,100 T800,100 T1000,100 T1200,100;
              M0,100 Q100,95 200,100 T400,100 T600,100 T800,100 T1000,100 T1200,100
            "
          />
        </path>
      </svg>
    </div>
  );
}
