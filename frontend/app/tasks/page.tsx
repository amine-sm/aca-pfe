"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { apiFetch } from "@/lib/api";


interface Task {
  id: number;
  title: string;
  description?: string;
  objective?: string;
  reflection_question_1?: string;
  reflection_question_2?: string;
  frequency: "daily" | "weekly";
  status: string;
  completions_count?: number;
  last_score?: number;
}


export default function MyTasksPage() {
  const { loading: authLoading } = useAuthGuard(["USER"]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [completeTask, setCompleteTask] = useState<Task | null>(null);

  useEffect(() => {
    if (authLoading) return;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function loadTasks() {
    setIsLoading(true);
    try {
      const data: any = await apiFetch("/tasks/mine");
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[#1B4F59] dark:text-teal-400" size={24} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 pt-20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-lg dark:from-teal-500 dark:to-teal-600">
              <Target size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-slate-50">Mes tâches</h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Tâches recommandées par ton psychologue
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")}><X size={14} /></button>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
              <Sparkles size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-950 dark:text-slate-50">
              Aucune tâche pour le moment
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Ton psychologue n&apos;a pas encore créé de tâches pour toi.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="mb-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {task.frequency === "daily" ? "📅 Quotidienne" : "📆 Hebdomadaire"}
                    </span>
                    <h3 className="text-lg font-black text-slate-950 dark:text-slate-50">
                      {task.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setCompleteTask(task)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1B4F59] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#153f47] dark:bg-teal-500 dark:hover:bg-teal-400"
                  >
                    <CheckCircle2 size={14} />
                    Compléter
                  </button>
                </div>

                {task.description && (
                  <p className="mb-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {task.description}
                  </p>
                )}

                {task.objective && (
                  <div className="mb-3 rounded-lg bg-teal-50 px-3 py-2 dark:bg-teal-500/10">
                    <p className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      🎯 Objectif
                    </p>
                    <p className="mt-0.5 text-sm text-teal-900 dark:text-teal-100">
                      {task.objective}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <span className="flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={11} />
                    {task.completions_count || 0} validations
                  </span>
                  {task.last_score && (
                    <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp size={11} />
                      Score : {task.last_score}/10
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {completeTask && (
          <CompleteModal
            task={completeTask}
            onClose={() => setCompleteTask(null)}
            onDone={() => {
              loadTasks();
              setCompleteTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}


function CompleteModal({
  task,
  onClose,
  onDone,
}: {
  task: Task;
  onClose: () => void;
  onDone: () => void;
}) {
  const [score, setScore] = useState(7);
  const [reflection, setReflection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr("");
    try {
      await apiFetch(`/tasks/${task.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ score, reflection: reflection.trim() || null }),
      });
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4"
      >
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-slate-50">Valider</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{task.title}</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-5 p-6">
            {err && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Score (1 = très mal, 10 = excellent)
              </label>
              <div className="mb-2 flex flex-wrap justify-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    className={`h-10 w-10 rounded-xl text-sm font-bold transition ${
                      score === n
                        ? "bg-[#1B4F59] text-white shadow-md dark:bg-teal-500"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-center text-2xl font-black text-[#1B4F59] dark:text-teal-400">
                {score}/10
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Réflexion (optionnel)
              </label>
              {task.reflection_question_1 && (
                <p className="mb-2 text-sm italic text-slate-600 dark:text-slate-400">
                  💭 {task.reflection_question_1}
                </p>
              )}
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={3}
                placeholder="Comment t'es-tu senti(e) ?"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1B4F59] focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B4F59] px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:bg-teal-500"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Valider
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}