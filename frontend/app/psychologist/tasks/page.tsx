"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Trash2, User, CheckCircle2, Loader2, X, AlertCircle, TrendingUp, ListChecks, Sparkles } from "lucide-react";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function api(path: string, options: RequestInit = {}): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aca_token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
  return data;
}


interface Patient { id: number; full_name: string; email: string; }
interface Task {
  id: number; user_id: number; psychologist_id: number;
  patient_name?: string; patient_email?: string;
  title: string; description?: string; objective?: string;
  reflection_question_1?: string; reflection_question_2?: string;
  frequency: "daily" | "weekly";
  start_date: string; end_date?: string;
  status: string; created_at: string;
  completions_count?: number; last_score?: number;
}


export default function PsychologistTasksPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("aca_token")) { router.replace("/login"); return; }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError("");
    try {
      const [pRes, tRes] = await Promise.all([
        api("/tasks/my-patients"),
        api("/tasks/psychologist/all"),
      ]);
      setPatients(pRes.patients || []);
      setTasks(tRes.tasks || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ?")) return;
    try {
      await api(`/tasks/${id}`, { method: "DELETE" });
      setTasks(t => t.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-teal-500" size={32} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 pt-20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-lg dark:from-teal-500 dark:to-teal-600">
                <ListChecks size={20} />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                Gestion des tâches
              </h1>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {patients.length} patient(s) suivi(s)
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            disabled={patients.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-50 dark:bg-teal-500"
          >
            <Plus size={18} />
            Nouvelle tâche
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={<Target size={20} />} label="Tâches" value={tasks.length} />
          <Stat icon={<User size={20} />} label="Patients" value={patients.length} />
          <Stat icon={<CheckCircle2 size={20} />} label="Complétions" value={tasks.reduce((s, t) => s + (t.completions_count || 0), 0)} />
          <Stat icon={<TrendingUp size={20} />} label="Actives" value={tasks.filter(t => t.status === "active").length} />
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")}><X size={14} /></button>
          </div>
        )}

        {patients.length === 0 && (
          <div className="mb-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="font-bold text-amber-900 dark:text-amber-300">Aucun patient assigné</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-200">Tu dois avoir des patients assignés avant de créer des tâches.</p>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
              <Sparkles size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-950 dark:text-slate-50">Aucune tâche</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">Crée ta première tâche pour aider tes patients.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    👤 {task.patient_name || `#${task.user_id}`}
                  </p>
                  <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
                <span className="mb-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {task.frequency === "daily" ? "📅 Quotidienne" : "📆 Hebdomadaire"}
                </span>
                <h3 className="text-base font-black text-slate-950 dark:text-slate-50">{task.title}</h3>
                {task.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{task.description}</p>}
                {task.objective && (
                  <div className="mt-3 rounded-lg bg-teal-50 px-3 py-2 dark:bg-teal-500/10">
                    <p className="text-xs text-teal-900 dark:text-teal-100">🎯 {task.objective}</p>
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  ✓ {task.completions_count || 0} validation(s)
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {createOpen && (
          <CreateModal
            patients={patients}
            onClose={() => setCreateOpen(false)}
            onCreated={(newTask) => {
              setTasks(t => [newTask, ...t]);
              setCreateOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}


function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md">
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}


function CreateModal({ patients, onClose, onCreated }: { patients: Patient[]; onClose: () => void; onCreated: (t: Task) => void }) {
  const [userId, setUserId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [reflectionQ1, setReflectionQ1] = useState("");
  const [reflectionQ2, setReflectionQ2] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !title.trim()) { setErr("Patient et titre obligatoires"); return; }
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
      const patient = patients.find(p => p.id === userId);
      onCreated({ ...data.task, patient_name: patient?.full_name, completions_count: 0 });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4">
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-50">Nouvelle tâche</h2>
            <button type="button" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
            {err && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{err}</div>}

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Patient *</label>
              <select value={userId} onChange={e => setUserId(Number(e.target.value))} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">— Choisir un patient —</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Titre *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex : Marcher 30 min" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Comment réaliser…" className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Objectif</label>
              <input type="text" value={objective} onChange={e => setObjective(e.target.value)} placeholder="Ex : Réduire l'anxiété" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Question réflexion 1</label>
              <input type="text" value={reflectionQ1} onChange={e => setReflectionQ1(e.target.value)} placeholder="Ex : Comment t'es-tu senti ?" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Question réflexion 2</label>
              <input type="text" value={reflectionQ2} onChange={e => setReflectionQ2(e.target.value)} placeholder="Ex : Qu'as-tu appris ?" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Fréquence</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setFrequency("daily")} className={`rounded-xl border px-3 py-2 text-sm font-bold ${frequency === "daily" ? "border-[#1B4F59] bg-teal-50 text-[#1B4F59] dark:border-teal-400 dark:bg-teal-500/10 dark:text-teal-300" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>📅 Quotidienne</button>
                <button type="button" onClick={() => setFrequency("weekly")} className={`rounded-xl border px-3 py-2 text-sm font-bold ${frequency === "weekly" ? "border-[#1B4F59] bg-teal-50 text-[#1B4F59] dark:border-teal-400 dark:bg-teal-500/10 dark:text-teal-300" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>📆 Hebdomadaire</button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Date début *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Annuler</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-[#1B4F59] px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:bg-teal-500">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Créer
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}