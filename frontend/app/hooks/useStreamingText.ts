"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Simule un effet de streaming type ChatGPT pour un texte complet.
 * Le backend renvoie la réponse en une seule fois, mais on l'affiche
 * progressivement caractère par caractère pour l'effet "IA qui écrit".
 *
 * - `fullText` : le texte complet à afficher
 * - `enabled`  : si false, affiche tout immédiatement
 * - `speed`    : ms entre chaque "tick" (par défaut 12ms)
 * - `chunk`    : nb de caractères ajoutés par tick (par défaut 2)
 */
export function useStreamingText(
  fullText: string,
  enabled: boolean = true,
  speed: number = 12,
  chunk: number = 2
) {
  const [displayed, setDisplayed] = useState(enabled ? "" : fullText);
  const [isStreaming, setIsStreaming] = useState(enabled);
  const indexRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Si désactivé, on affiche tout d'un coup
    if (!enabled) {
      setDisplayed(fullText);
      setIsStreaming(false);
      return;
    }

    // Reset à chaque nouveau texte
    indexRef.current = 0;
    setDisplayed("");
    setIsStreaming(true);

    let lastTick = performance.now();

    function step(now: number) {
      if (now - lastTick >= speed) {
        const next = Math.min(indexRef.current + chunk, fullText.length);
        indexRef.current = next;
        setDisplayed(fullText.slice(0, next));
        lastTick = now;

        if (next >= fullText.length) {
          setIsStreaming(false);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [fullText, enabled, speed, chunk]);

  return { displayed, isStreaming };
}
