"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  X,
  CalendarDays,
  ClipboardCheck,
  RefreshCcw,
  Trophy,
  Clock3,
  MessageSquareText,
  CheckSquare,
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
    setError("");

    try {
      const data: any = await apiFetch("/tasks/mine");
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message || "Erreur chargement des tâches");
    } finally {
      setIsLoading(false);
    }
  }

  const dailyTasks = useMemo(
    () => tasks.filter((task) => task.frequency === "daily").length,
    [tasks]
  );

  const weeklyTasks = useMemo(
    () => tasks.filter((task) => task.frequency === "weekly").length,
    [tasks]
  );

  const completedTotal = useMemo(
    () =>
      tasks.reduce((total, task) => total + Number(task.completions_count || 0), 0),
    [tasks]
  );

  const averageScore = useMemo(() => {
    const scores = tasks
      .map((task) => Number(task.last_score || 0))
      .filter((score) => score > 0);

    if (scores.length === 0) return 0;

    return Math.round(
      scores.reduce((total, score) => total + score, 0) / scores.length
    );
  }, [tasks]);

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
          <p className="text-sm font-black text-slate-700">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1B4F59] text-white shadow-sm">
                <Target size={27} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-black text-[#1B4F59]">
                  <Sparkles size={14} />
                  Suivi thérapeutique
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  Mes tâches
                </h1>

                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Suivez les tâches recommandées par votre psychologue, validez vos
                  progrès et gardez une trace de votre évolution.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadTasks}
              disabled={isLoading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <RefreshCcw size={17} />
              )}
              Actualiser
            </button>
          </div>
        </section>

        {error && (
          <AlertMessage
            message={error}
            onClose={() => setError("")}
          />
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ClipboardCheck size={22} />}
            label="Total tâches"
            value={tasks.length}
            helper="Assignées"
          />
          <StatCard
            icon={<CalendarDays size={22} />}
            label="Quotidiennes"
            value={dailyTasks}
            helper="À suivre chaque jour"
          />
          <StatCard
            icon={<Clock3 size={22} />}
            label="Hebdomadaires"
            value={weeklyTasks}
            helper="À suivre par semaine"
          />
          <StatCard
            icon={<Trophy size={22} />}
            label="Score moyen"
            value={averageScore ? `${averageScore}/10` : "—"}
            helper={`${completedTotal} validation(s)`}
          />
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Tâches recommandées
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Complétez les tâches une par une et ajoutez une petite réflexion.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-600">
              <CheckSquare size={15} className="text-[#1B4F59]" />
              {tasks.length} tâche(s)
            </div>
          </div>

          {tasks.length === 0 ? (
            <EmptyTasks />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onComplete={() => setCompleteTask(task)}
                />
              ))}
            </div>
          )}
        </section>
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

function TaskCard({
  task,
  index,
  onComplete,
}: {
  task: Task;
  index: number;
  onComplete: () => void;
}) {
  const score = Number(task.last_score || 0);
  const completions = Number(task.completions_count || 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-black text-[#1B4F59]">
            {task.frequency === "daily" ? (
              <>
                <CalendarDays size={13} />
                Quotidienne
              </>
            ) : (
              <>
                <Clock3 size={13} />
                Hebdomadaire
              </>
            )}
          </span>

          <h3 className="mt-3 text-xl font-black leading-snug text-slate-950">
            {task.title}
          </h3>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[#1B4F59] ring-1 ring-slate-100">
          <Target size={22} />
        </div>
      </div>

      {task.description && (
        <p className="text-sm font-semibold leading-6 text-slate-600">
          {task.description}
        </p>
      )}

      {task.objective && (
        <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1B4F59]">
            Objectif
          </p>
          <p className="text-sm font-bold leading-6 text-slate-700">
            {task.objective}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniInfo
          icon={<CheckCircle2 size={16} />}
          label="Validations"
          value={completions}
        />

        <MiniInfo
          icon={<TrendingUp size={16} />}
          label="Dernier score"
          value={score ? `${score}/10` : "—"}
        />
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#153f47]"
      >
        <CheckCircle2 size={17} />
        Compléter
      </button>
    </motion.article>
  );
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-[#1B4F59]">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 inline-flex rounded-2xl bg-teal-50 p-3 text-[#1B4F59]">
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
      <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
    </div>
  );
}

function EmptyTasks() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="max-w-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#1B4F59] shadow-sm">
          <Sparkles size={30} />
        </div>

        <h2 className="text-2xl font-black text-slate-950">
          Aucune tâche pour le moment
        </h2>

        <p className="mx-auto mt-3 text-sm font-semibold leading-6 text-slate-500">
          Votre psychologue n&apos;a pas encore créé de tâches pour vous. Elles
          apparaîtront ici dès qu&apos;elles seront disponibles.
        </p>
      </div>
    </div>
  );
}

function AlertMessage({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-red-100"
      >
        <X size={15} />
      </button>
    </div>
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
      setErr(e.message || "Erreur validation");
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
        className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 px-4"
      >
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1B4F59] text-white">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Valider la tâche
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {task.title}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
            >
              <X size={17} />
            </button>
          </div>

          <div className="space-y-5 p-6">
            {err && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Score de ressenti
              </label>

              <div className="mb-4 flex flex-wrap justify-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    className={`h-10 w-10 rounded-xl text-sm font-black transition ${
                      score === n
                        ? "bg-[#1B4F59] text-white shadow-sm"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <p className="text-center text-2xl font-black text-[#1B4F59]">
                {score}/10
              </p>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <MessageSquareText size={15} />
                Réflexion
              </label>

              {task.reflection_question_1 && (
                <p className="mb-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold italic leading-6 text-slate-600">
                  💭 {task.reflection_question_1}
                </p>
              )}

              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={4}
                placeholder="Comment vous êtes-vous senti(e) ?"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1B4F59] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Valider
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
