"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Target,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Clock,
  Pause,
  Play,
  Trash2,
  X,
  Activity,
  History as HistoryIcon,
  MessageSquare,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useAuthGuard } from "../../../../hooks/useAuthGuard";
import {
  Task,
  TasksStats,
  TimelinePoint,
  createTask,
  deleteTask,
  getPatientTasks,
  updateTask,
} from "@/lib/tasksApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PatientTasksPage({ params }: PageProps) {
  const { id: patientId } = use(params);
  const router = useRouter();
  const { loading: authLoading } = useAuthGuard([
    "PSYCHOLOGIST",
    "ADMIN",
    "SUPER_ADMIN",
  ]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TasksStats | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getPatientTasks(patientId);
      setTasks(data.tasks);
      setStats(data.stats);
      setTimeline(data.timeline);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, patientId]);

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] pt-20">
        <Loader2 className="animate-spin text-[#1B4F59] dark:text-teal-400" size={26} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-12 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Retour */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-bold text-[var(--text-secondary)] transition hover:border-teal-300 hover:text-[#1B4F59] dark:hover:text-teal-300"
          >
            <ArrowLeft size={14} /> Retour
          </button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#153f47] dark:bg-teal-500 dark:hover:bg-teal-400"
          >
            <Plus size={16} />
            Créer une tâche
          </motion.button>
        </div>

        {/* Header */}
        <header className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--teal-soft)] px-3 py-1.5 text-xs font-bold text-[#1B4F59] dark:text-teal-300">
            <Target size={12} />
            Suivi thérapeutique
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">
            Exercices du patient #{patientId}
          </h1>
          <p className="mt-2 text-base text-[var(--muted)]">
            Créez des exercices, suivez leur réalisation et l&apos;évolution du
            ressenti.
          </p>
        </header>

        {/* Erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPIs */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPI
              icon={<Target size={18} />}
              label="Actives"
              value={stats.active}
              tone="teal"
            />
            <KPI
              icon={<AlertTriangle size={18} />}
              label="En retard"
              value={stats.late}
              tone={stats.late > 0 ? "red" : "muted"}
            />
            <KPI
              icon={<CheckCircle2 size={18} />}
              label="Terminées"
              value={stats.completed}
              tone="emerald"
            />
            <KPI
              icon={<Activity size={18} />}
              label="Validations"
              value={stats.total_completions}
              tone="muted"
            />
          </div>
        )}

        {/* Graphique progression */}
        {timeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#1B4F59] dark:text-teal-400" />
                <h3 className="text-base font-black text-[var(--text)]">
                  Évolution du ressenti
                </h3>
              </div>
              <span className="text-xs font-medium text-[var(--muted)]">
                8 dernières semaines
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatWeek}
                    stroke="var(--muted)"
                    fontSize={11}
                  />
                  <YAxis
                    domain={[0, 10]}
                    stroke="var(--muted)"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "var(--text)",
                    }}
                    labelFormatter={formatWeek}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_feeling"
                    name="Ressenti moyen"
                    stroke="#1B4F59"
                    strokeWidth={3}
                    dot={{ fill: "#1B4F59", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nb_completions"
                    name="Validations"
                    stroke="#FE5737"
                    strokeWidth={2}
                    dot={{ fill: "#FE5737", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Liste tasks */}
        {tasks.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <PsyTaskCard
                key={task.id}
                task={task}
                isOpen={openTaskId === task.id}
                onToggle={() =>
                  setOpenTaskId((p) => (p === task.id ? null : task.id))
                }
                onReload={load}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal création */}
      <AnimatePresence>
        {showCreate && (
          <CreateTaskModal
            patientId={Number(patientId)}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}


// ============================================
// Carte task (vue psy)
// ============================================
function PsyTaskCard({
  task,
  isOpen,
  onToggle,
  onReload,
}: {
  task: Task;
  isOpen: boolean;
  onToggle: () => void;
  onReload: () => void;
}) {
  const [acting, setActing] = useState(false);

  async function handleStatusToggle() {
    setActing(true);
    try {
      const newStatus = task.status === "active" ? "paused" : "active";
      await updateTask(task.id, { status: newStatus });
      onReload();
    } catch (err: any) {
      alert(err.message || "Erreur");
    } finally {
      setActing(false);
    }
  }

  async function handleArchive() {
    if (!confirm("Archiver cette tâche ?")) return;
    setActing(true);
    try {
      await deleteTask(task.id);
      onReload();
    } catch (err: any) {
      alert(err.message || "Erreur");
    } finally {
      setActing(false);
    }
  }

  async function handleComplete() {
    setActing(true);
    try {
      await updateTask(task.id, { status: "completed" });
      onReload();
    } catch (err: any) {
      alert(err.message || "Erreur");
    } finally {
      setActing(false);
    }
  }

  const dueLabel = formatDueLabel(task.due_at);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-3xl border bg-[var(--bg-elevated)] shadow-sm ${
        task.is_late
          ? "border-red-200 dark:border-red-500/30"
          : "border-[var(--border)]"
      }`}
    >
      <header className="flex items-start justify-between gap-3 p-5">
        <div className="flex flex-1 items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              task.is_late
                ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                : task.status === "completed"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : task.status === "paused"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                : "bg-[var(--teal-soft)] text-[#1B4F59] dark:text-teal-300"
            }`}
          >
            {task.is_late ? (
              <AlertTriangle size={20} />
            ) : task.status === "completed" ? (
              <CheckCircle2 size={20} />
            ) : task.status === "paused" ? (
              <Pause size={20} />
            ) : (
              <Target size={20} />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-black text-[var(--text)]">
              {task.title}
            </h3>
            {task.objective && (
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {task.objective}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--sidebar)] px-2.5 py-1 text-[var(--text-secondary)]">
                <Calendar size={11} />
                {task.frequency === "daily" ? "Quotidien" : "Hebdomadaire"}
              </span>
              {dueLabel && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                    task.is_late
                      ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                      : "bg-[var(--sidebar)] text-[var(--text-secondary)]"
                  }`}
                >
                  <Clock size={11} /> {dueLabel}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                  task.status === "active"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : task.status === "paused"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                    : task.status === "completed"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-[var(--sidebar)] text-[var(--text-secondary)]"
                }`}
              >
                {task.status}
              </span>
              {task.completion_count !== undefined && task.completion_count > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--teal-soft)] px-2.5 py-1 text-[#1B4F59] dark:text-teal-300">
                  <Activity size={11} /> {task.completion_count} validation(s)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {task.status === "active" && (
            <button
              onClick={handleStatusToggle}
              disabled={acting}
              title="Mettre en pause"
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-amber-600 transition hover:border-amber-300 dark:text-amber-300"
            >
              <Pause size={14} />
            </button>
          )}
          {task.status === "paused" && (
            <button
              onClick={handleStatusToggle}
              disabled={acting}
              title="Reprendre"
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-emerald-600 transition hover:border-emerald-300 dark:text-emerald-300"
            >
              <Play size={14} />
            </button>
          )}
          {task.status !== "completed" && (
            <button
              onClick={handleComplete}
              disabled={acting}
              title="Marquer terminée"
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-emerald-600 transition hover:border-emerald-300 dark:text-emerald-300"
            >
              <CheckCircle2 size={14} />
            </button>
          )}
          <button
            onClick={handleArchive}
            disabled={acting}
            title="Archiver"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 text-red-600 transition hover:border-red-300 dark:text-red-300"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onToggle}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition hover:border-teal-300 hover:text-[#1B4F59] dark:hover:text-teal-300"
          >
            <HistoryIcon size={12} className="inline align-text-bottom" />{" "}
            {isOpen ? "Fermer" : "Détails"}
          </button>
        </div>
      </header>

      {task.description && (
        <div className="border-t border-[var(--border)] bg-[var(--sidebar)] px-5 py-3">
          <p className="text-sm leading-7 text-[var(--text-secondary)]">
            {task.description}
          </p>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--border)] bg-[var(--sidebar)]"
          >
            <div className="space-y-3 p-5">
              {task.reflection_question_1 && (
                <div className="rounded-2xl bg-[var(--bg-elevated)] p-3 text-xs">
                  <p className="font-bold text-[var(--text)]">
                    Question 1 : {task.reflection_question_1}
                  </p>
                </div>
              )}
              {task.reflection_question_2 && (
                <div className="rounded-2xl bg-[var(--bg-elevated)] p-3 text-xs">
                  <p className="font-bold text-[var(--text)]">
                    Question 2 : {task.reflection_question_2}
                  </p>
                </div>
              )}

              <p className="mt-3 text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                Validations du patient
              </p>
              {task.completions && task.completions.length > 0 ? (
                task.completions.map((c) => (
                  <PsyCompletionRow
                    key={c.id}
                    completion={c}
                    question1={task.reflection_question_1}
                    question2={task.reflection_question_2}
                  />
                ))
              ) : (
                <p className="text-sm italic text-[var(--muted)]">
                  Le patient n&apos;a pas encore validé cette tâche
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}


function PsyCompletionRow({
  completion,
  question1,
  question2,
}: {
  completion: any;
  question1: string | null;
  question2: string | null;
}) {
  const tone =
    completion.feeling_score >= 7
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : completion.feeling_score >= 4
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-bold text-[var(--text-secondary)]">
          {formatDateTime(completion.completed_at)}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${tone}`}
        >
          Ressenti {completion.feeling_score}/10
        </span>
      </div>
      {completion.reflection_answer_1 && (
        <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
          <span className="font-bold">{question1 || "Q1"} :</span>{" "}
          {completion.reflection_answer_1}
        </p>
      )}
      {completion.reflection_answer_2 && (
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
          <span className="font-bold">{question2 || "Q2"} :</span>{" "}
          {completion.reflection_answer_2}
        </p>
      )}
    </div>
  );
}


// ============================================
// Modal création
// ============================================
function CreateTaskModal({
  patientId,
  onClose,
  onCreated,
}: {
  patientId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [q1, setQ1] = useState("Comment vous êtes-vous senti pendant cet exercice ?");
  const [q2, setQ2] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createTask({
        user_id: patientId,
        title: title.trim(),
        objective: objective.trim() || undefined,
        description: description.trim() || undefined,
        reflection_question_1: q1.trim() || undefined,
        reflection_question_2: q2.trim() || undefined,
        frequency,
      });
      onCreated();
    } catch (err: any) {
      setError(err.message || "Erreur création");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 shadow-2xl"
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--text)]">
              Nouvel exercice
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Créez un exercice pour ce patient.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--sidebar)]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4">
          <Field label="Titre *" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Respiration 5 min avant de dormir"
              className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#1B4F59] dark:focus:border-teal-400"
            />
          </Field>

          <Field label="Objectif">
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex : Réduire l'anxiété du soir"
              className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#1B4F59] dark:focus:border-teal-400"
            />
          </Field>

          <Field label="Description / consigne détaillée">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Allongez-vous, inspirez 4s, retenez 4s, expirez 4s…"
              rows={3}
              className="w-full resize-y rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm leading-6 text-[var(--text)] outline-none focus:border-[#1B4F59] dark:focus:border-teal-400"
            />
          </Field>

          <Field label="Fréquence">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFrequency("daily")}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                  frequency === "daily"
                    ? "border-[#1B4F59] bg-[#1B4F59] text-white dark:border-teal-500 dark:bg-teal-500"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                }`}
              >
                Quotidien
              </button>
              <button
                onClick={() => setFrequency("weekly")}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                  frequency === "weekly"
                    ? "border-[#1B4F59] bg-[#1B4F59] text-white dark:border-teal-500 dark:bg-teal-500"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                }`}
              >
                Hebdomadaire
              </button>
            </div>
          </Field>

          <Field
            label="Question de réflexion 1"
            hint="Question courte à laquelle le patient répondra après chaque validation"
          >
            <input
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#1B4F59] dark:focus:border-teal-400"
            />
          </Field>

          <Field
            label="Question de réflexion 2 (optionnelle)"
            hint="Une seconde question pour aller plus loin"
          >
            <input
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              placeholder="Ex : Qu'est-ce qui a été le plus difficile ?"
              className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#1B4F59] dark:focus:border-teal-400"
            />
          </Field>

          {error && (
            <p className="text-sm font-semibold text-red-600 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
            <button
              onClick={onClose}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-2.5 text-sm font-bold text-[var(--text-secondary)]"
            >
              Annuler
            </button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-400"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Création…
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Créer la tâche
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-black text-[var(--text)]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {hint && (
        <p className="mb-2 text-xs text-[var(--muted)]">{hint}</p>
      )}
      {children}
    </div>
  );
}


function KPI({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "teal" | "red" | "emerald" | "muted";
}) {
  const c =
    tone === "red"
      ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300"
      : tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300"
      : tone === "muted"
      ? "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--muted)]"
      : "bg-teal-50/60 border-teal-200/70 text-[#1B4F59] dark:bg-teal-500/10 dark:border-teal-500/30 dark:text-teal-300";

  return (
    <div className={`rounded-2xl border p-4 ${c}`}>
      <div className="mb-2">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[var(--text)]">{value}</p>
    </div>
  );
}


function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-10 text-center shadow-sm"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--teal-soft)] text-[#1B4F59] dark:text-teal-300">
        <Target size={26} />
      </div>
      <h3 className="text-lg font-black text-[var(--text)]">
        Aucun exercice pour ce patient
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
        Créez votre première tâche pour commencer le suivi thérapeutique.
      </p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#153f47] dark:bg-teal-500 dark:hover:bg-teal-400"
      >
        <Plus size={14} />
        Créer une tâche
      </button>
    </motion.div>
  );
}


// ============================================
// Helpers
// ============================================
function formatDueLabel(dueAt: string | null) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (isNaN(due.getTime())) return null;
  const now = Date.now();
  const diffDays = Math.round((due.getTime() - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `En retard de ${Math.abs(diffDays)}j`;
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  return `Dans ${diffDays}j`;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWeek(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
