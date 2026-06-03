"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, Heart, X, ExternalLink } from "lucide-react";
import type { EmergencyInfo } from "@/lib/dziribertApi";


interface CrisisModalProps {
  isOpen: boolean;
  emergencyInfo: EmergencyInfo | null;
  responseText?: string;
  onClose?: () => void;
}


/**
 * 🚨 Modal d'urgence
 * ==================
 *
 * S'affiche en plein écran (impossible à ignorer) quand DziriBERT
 * détecte un signal de crise/suicide.
 *
 * Comportement :
 * - Bloque l'arrière-plan
 * - Affiche les numéros d'urgence
 * - Bouton "appeler" cliquable
 * - Bouton "fermer" optionnel (à n'utiliser qu'après avoir vu)
 */
export function CrisisModal({
  isOpen,
  emergencyInfo,
  responseText,
  onClose,
}: CrisisModalProps) {
  if (!emergencyInfo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay sombre */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Modal centré */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            >
              {/* Bande rouge en haut */}
              <div className="relative bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-6 text-white">
                {onClose && (
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full bg-white/20 p-2 transition hover:bg-white/30"
                    aria-label="Fermer"
                  >
                    <X size={18} />
                  </button>
                )}

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"
                >
                  <AlertTriangle size={28} />
                </motion.div>

                <h2 className="text-2xl font-black tracking-tight">
                  {emergencyInfo.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/95">
                  {emergencyInfo.message_fr}
                </p>
                {emergencyInfo.message_ar && (
                  <p
                    className="mt-2 text-sm leading-relaxed text-white/90"
                    dir="rtl"
                    lang="ar"
                  >
                    {emergencyInfo.message_ar}
                  </p>
                )}
              </div>

              {/* Numéro d'urgence principal */}
              <div className="p-6">
                <div className="mb-4 rounded-2xl border-2 border-red-200 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                    Contacte maintenant
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {emergencyInfo.emergency_contact.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {emergencyInfo.emergency_contact.name}
                  </p>
                  <a
                    href={`tel:${emergencyInfo.emergency_contact.phone.replace(/\s/g, "")}`}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600 active:scale-95"
                  >
                    <Phone size={18} />
                    {emergencyInfo.emergency_contact.phone}
                  </a>
                </div>

                {/* Autres ressources */}
                {emergencyInfo.additional_resources?.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Autres ressources
                    </p>
                    <div className="space-y-2">
                      {emergencyInfo.additional_resources.map((resource, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                        >
                          <Heart
                            size={16}
                            className="mt-0.5 shrink-0 text-rose-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {resource.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {resource.info}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message de réassurance */}
                <div className="mt-5 rounded-xl bg-teal-50 p-4 text-center dark:bg-teal-500/10">
                  <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">
                    💚 Tu n'es pas seul(e). Ton appel peut tout changer.
                  </p>
                </div>

                {/* Footer */}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    J'ai compris, fermer
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
