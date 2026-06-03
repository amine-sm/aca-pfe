"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function api(path: string, options: RequestInit = {}): Promise<any> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("aca_token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Erreur ${res.status}`);
  }

  return data;
}

interface Patient {
  id: number;
  full_name: string;
  email: string;
}

interface Task {
  id: number;
  user_id: number;
  psychologist_id: number;
  patient_name?: string;
  patient_email?: string;
  title: string;
  description?: string;
  objective?: string;
  reflection_question_1?: string;
  reflection_question_2?: string;
  frequency: "daily" | "weekly";
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  completions_count?: number;
  last_score?: number;
}

const softEase = [0.22, 1, 0.36, 1] as const;

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PsychologistTasksPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!localStorage.getItem("aca_token")) {
      router.replace("/login");
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  async function loadData() {
    setIsLoading(true);
    setRefreshing(true);
    setError("");

    try {
      const [pRes, tRes] = await Promise.all([
        api("/tasks/my-patients"),
        api("/tasks/psychologist/all"),
      ]);

      setPatients(pRes.patients || []);
      setTasks(tRes.tasks || []);
    } catch (e: any) {
      setError(e.message || "Erreur chargement des tâches");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette tâche ?")) return;

    try {
      await api(`/tasks/${id}`, { method: "DELETE" });
      setTasks((items) => items.filter((task) => task.id !== id));
    } catch (e: any) {
      setError(e.message || "Erreur suppression tâche");
    }
  }

  const stats = useMemo(() => {
    const completions = tasks.reduce(
      (sum, task) => sum + (task.completions_count || 0),
      0
    );

    const active = tasks.filter((task) => task.status === "active").length;

    return {
      tasks: tasks.length,
      patients: patients.length,
      completions,
      active,
    };
  }, [tasks, patients]);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-3 rounded-[24px] border border-slate-100 bg-white px-6 py-5 shadow-xl shadow-slate-200/60">
          <Loader2 className="animate-spin text-[#1B4F59]" size={26} />
          <p className="font-black text-slate-700">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white pt-20 text-slate-900">
      <BackgroundDecor />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <HeaderCard
          patientsCount={patients.length}
          refreshing={refreshing}
          onRefresh={loadData}
          onCreate={() => setCreateOpen(true)}
          createDisabled={patients.length === 0}
        />

        <motion.section
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.07,
              },
            },
          }}
          className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <Stat
            icon={<Target size={22} />}
            label="Tâches"
            value={stats.tasks}
            helper="Total créé"
          />

          <Stat
            icon={<User size={22} />}
            label="Patients"
            value={stats.patients}
            helper="Suivi actif"
          />

          <Stat
            icon={<CheckCircle2 size={22} />}
            label="Complétions"
            value={stats.completions}
            helper="Validations"
          />

          <Stat
            icon={<TrendingUp size={22} />}
            label="Actives"
            value={stats.active}
            helper="En cours"
          />
        </motion.section>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className="mb-6 flex items-start gap-3 rounded-[22px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-sm"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-full p-1 transition hover:bg-red-100"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {patients.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-6 rounded-[26px] border border-amber-100 bg-amber-50 p-5 shadow-sm"
            >
              <p className="font-black text-amber-900">Aucun patient assigné</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                Tu dois avoir des patients assignés avant de créer des tâches.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {tasks.length === 0 ? (
          <EmptyTasksState
            disabled={patients.length === 0}
            onCreate={() => setCreateOpen(true)}
          />
        ) : (
          <motion.section
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.06,
                },
              },
            }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onDelete={handleDelete}
              />
            ))}
          </motion.section>
        )}
      </div>

      <AnimatePresence>
        {createOpen && (
          <CreateModal
            patients={patients}
            onClose={() => setCreateOpen(false)}
            onCreated={(newTask) => {
              setTasks((items) => [newTask, ...items]);
              setCreateOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-teal-100/70 blur-3xl" />
      <div className="absolute left-[-170px] top-72 h-[460px] w-[460px] rounded-full bg-cyan-100/60 blur-3xl" />
      <div className="absolute bottom-[-190px] right-1/3 h-[380px] w-[380px] rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-50" />
    </div>
  );
}

function HeaderCard({
  patientsCount,
  refreshing,
  onRefresh,
  onCreate,
  createDisabled,
}: {
  patientsCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  createDisabled: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.62, ease: softEase }}
      className="mb-8 overflow-hidden rounded-[34px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/70"
    >
      <div className="relative">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-100/80 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-100/70 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-[#1B4F59]">
              <Sparkles size={16} />
              Suivi thérapeutique
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#1B4F59] text-white shadow-xl shadow-teal-900/20">
                <ListChecks size={27} />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Gestion des tâches
                </h1>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {patientsCount} patient(s) suivi(s)
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
              Créez, suivez et organisez les exercices thérapeutiques assignés
              aux patients avec une interface claire et professionnelle.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <motion.button
              type="button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-lg shadow-slate-200/60 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {refreshing ? (
                <Loader2 size={18} className="animate-spin text-[#1B4F59]" />
              ) : (
                <TrendingUp size={18} className="text-[#1B4F59]" />
              )}
              Actualiser
            </motion.button>

            <motion.button
              type="button"
              whileHover={createDisabled ? undefined : { y: -3 }}
              whileTap={createDisabled ? undefined : { scale: 0.97 }}
              onClick={onCreate}
              disabled={createDisabled}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-3 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Nouvelle tâche
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Stat({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 22, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1 },
      }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="group relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/60"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-100/70 blur-2xl transition duration-500 group-hover:scale-125" />

      <div className="relative z-10">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B4F59] text-white shadow-lg shadow-teal-900/20">
          {icon}
        </div>

        <p className="text-3xl font-black text-slate-950">{value}</p>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-xs font-bold text-slate-500">{helper}</p>
      </div>
    </motion.div>
  );
}

function TaskCard({
  task,
  index,
  onDelete,
}: {
  task: Task;
  index: number;
  onDelete: (id: number) => void;
}) {
  const frequencyLabel =
    task.frequency === "daily" ? "📅 Quotidienne" : "📆 Hebdomadaire";

  const isActive = task.status === "active";

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 26, scale: 0.97 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            delay: 0.025 * index,
            duration: 0.45,
            ease: softEase,
          },
        },
      }}
      whileHover={{ y: -7, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[30px] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/60 transition hover:shadow-2xl hover:shadow-teal-900/10"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-teal-100/70 blur-2xl transition duration-500 group-hover:scale-125" />

      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">
              Patient
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-black text-slate-800">
              👤 {task.patient_name || `#${task.user_id}`}
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onDelete(task.id)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-red-100"
          >
            <Trash2 size={15} />
          </motion.button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-[11px] font-black text-[#1B4F59]">
            {frequencyLabel}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isActive ? "Active" : task.status || "—"}
          </span>
        </div>

        <h3 className="text-lg font-black leading-tight text-slate-950">
          {task.title}
        </h3>

        {task.description && (
          <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-500">
            {task.description}
          </p>
        )}

        {task.objective && (
          <div className="mt-4 rounded-[20px] border border-teal-100 bg-teal-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#1B4F59]">
              Objectif
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-teal-900">
              🎯 {task.objective}
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniInfo label="Début" value={formatDate(task.start_date)} />
          <MiniInfo
            label="Validations"
            value={`${task.completions_count || 0}`}
          />
        </div>
      </div>
    </motion.article>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function EmptyTasksState({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: softEase }}
      className="rounded-[34px] border border-dashed border-slate-200 bg-white p-12 text-center shadow-xl shadow-slate-200/60"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-teal-50 text-[#1B4F59]"
      >
        <Sparkles size={34} />
      </motion.div>

      <h2 className="text-2xl font-black text-slate-950">Aucune tâche</h2>

      <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-slate-500">
        Crée ta première tâche pour aider tes patients avec des exercices
        structurés.
      </p>

      <motion.button
        type="button"
        whileHover={disabled ? undefined : { y: -3 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        onClick={onCreate}
        disabled={disabled}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-6 py-3 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={18} />
        Nouvelle tâche
      </motion.button>
    </motion.div>
  );
}

function CreateModal({
  patients,
  onClose,
  onCreated,
}: {
  patients: Patient[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [userId, setUserId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [reflectionQ1, setReflectionQ1] = useState("");
  const [reflectionQ2, setReflectionQ2] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userId || !title.trim()) {
      setErr("Patient et titre obligatoires");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      const data: any = await api("/tasks", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          objective: objective.trim() || null,
          reflection_question_1: reflectionQ1.trim() || null,
          reflection_question_2: reflectionQ2.trim() || null,
          frequency,
          start_date: startDate,
        }),
      });

      const patient = patients.find((item) => item.id === userId);

      onCreated({
        ...data.task,
        patient_name: patient?.full_name,
        completions_count: 0,
      });
    } catch (e: any) {
      setErr(e.message || "Erreur création tâche");
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
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.35, ease: softEase }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 px-4"
      >
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-[34px] border border-slate-100 bg-white shadow-2xl shadow-slate-950/20"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[#1B4F59]">
                Nouvelle tâche
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Créer une tâche patient
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[68vh] space-y-4 overflow-y-auto bg-white p-6">
            <AnimatePresence>
              {err && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                >
                  {err}
                </motion.div>
              )}
            </AnimatePresence>

            <FormSelectPatient
              value={userId}
              patients={patients}
              onChange={setUserId}
            />

            <FormInput
              label="Titre *"
              value={title}
              onChange={setTitle}
              placeholder="Ex : Marcher 30 min"
              required
            />

            <FormTextarea
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Comment réaliser la tâche..."
            />

            <FormInput
              label="Objectif"
              value={objective}
              onChange={setObjective}
              placeholder="Ex : Réduire l'anxiété"
            />

            <FormInput
              label="Question réflexion 1"
              value={reflectionQ1}
              onChange={setReflectionQ1}
              placeholder="Ex : Comment t'es-tu senti ?"
            />

            <FormInput
              label="Question réflexion 2"
              value={reflectionQ2}
              onChange={setReflectionQ2}
              placeholder="Ex : Qu'as-tu appris ?"
            />

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Fréquence
              </label>

              <div className="grid grid-cols-2 gap-2">
                <FrequencyButton
                  active={frequency === "daily"}
                  onClick={() => setFrequency("daily")}
                >
                  📅 Quotidienne
                </FrequencyButton>

                <FrequencyButton
                  active={frequency === "weekly"}
                  onClick={() => setFrequency("weekly")}
                >
                  📆 Hebdomadaire
                </FrequencyButton>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Date début *
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-100 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Annuler
            </button>

            <motion.button
              type="submit"
              whileHover={submitting ? undefined : { y: -2 }}
              whileTap={submitting ? undefined : { scale: 0.97 }}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-2.5 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              Créer
            </motion.button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function FormSelectPatient({
  value,
  patients,
  onChange,
}: {
  value: number | "";
  patients: Patient[];
  onChange: (value: number | "") => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        Patient *
      </label>

      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        required
        className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
      >
        <option value="">— Choisir un patient —</option>
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>
            {patient.full_name} ({patient.email})
          </option>
        ))}
      </select>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </label>

      <input
        type="text"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </div>
  );
}

function FrequencyButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${
        active
          ? "border-[#1B4F59] bg-teal-50 text-[#1B4F59] shadow-sm"
          : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
