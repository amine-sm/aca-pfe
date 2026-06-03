"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Eye,
  FileText,
  HeartHandshake,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRoundCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  PlusCircle,
} from "lucide-react";
import { getRiskBadgeClass } from "@/lib/api";
import { getMyQuestionnaires, getMyProfile } from "@/lib/usersApi";
import { deleteConversation, getMyConversations } from "@/lib/conversationsApi";
import { getMyActivePsychologist } from "@/lib/recommendationsApi";
import { useAuthGuard } from "../hooks/useAuthGuard";
import TaskProgressCard from "../components/TaskProgressCard";

// ========== HELPERS ==========
function formatDateLabel(value: any) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ========== MAIN COMPONENT ==========
export default function DashboardPage() {
  const { loading } = useAuthGuard(["USER"]);

  const [user, setUser] = useState<any>(null);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePsy, setActivePsy] = useState<any>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | string | null>(null);

  async function loadDashboard() {
    setError("");
    try {
      const [me, qs, cs, psy] = await Promise.all([
        getMyProfile(),
        getMyQuestionnaires(),
        getMyConversations(),
        getMyActivePsychologist().catch(() => ({ psychologist: null })),
      ]);
      setUser(me.user);
      setQuestionnaires(qs.questionnaires || []);
      setConversations(cs.conversations || []);
      setActivePsy(psy.psychologist);
    } catch (err: any) {
      setError(err.message || "Erreur chargement dashboard");
    }
  }

  async function handleDeleteConversation(id: number | string) {
    if (!window.confirm("Supprimer cette conversation ?")) return;
    setError("");
    setMessage("");
    setDeleteLoadingId(id);
    try {
      const data = await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setMessage(data.message || "Conversation supprimée");
    } catch (err: any) {
      setError(err.message || "Erreur suppression");
    } finally {
      setDeleteLoadingId(null);
    }
  }

  useEffect(() => {
    if (!loading) loadDashboard();
  }, [loading]);



  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
      </div>
    );
  }

  const lastQuestionnaire = questionnaires[0];
  const lastConversation = conversations[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-8 px-4 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 to-cyan-800 p-6 text-white shadow-xl md:p-8"
        >
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur">
                <HeartPulse size={16} /> Espace personnel
              </div>
              <h1 className="mt-4 text-3xl font-bold md:text-4xl">
                Bonjour {user?.full_name || "Utilisateur"}
              </h1>
              <p className="mt-2 max-w-2xl text-teal-100">
                Suivez votre évolution, consultez vos questionnaires, échangez avec l'assistant
                et obtenez un accompagnement adapté.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/questionnaire"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                <FileText size={18} /> Questionnaire
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                <MessageCircle size={18} /> Parler maintenant
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Alerts */}
        {(error || message) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-700">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            {message && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <CheckCircle2 size={18} /> {message}
              </div>
            )}
          </div>
        )}

        {/* Quick support */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 rounded-2xl bg-white/80 p-6 shadow-md backdrop-blur-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Comment vous sentez-vous aujourd'hui ?</h2>
              <p className="text-slate-500">Commencez par un questionnaire ou une conversation.</p>
            </div>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-white transition hover:bg-teal-800"
            >
              <MessageCircle size={18} /> Besoin de parler
            </Link>
          </div>
        </motion.div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      
          <StatCard icon={<FileText size={22} />} label="Questionnaires" value={questionnaires.length} delay={0.15} />
          <StatCard icon={<MessageCircle size={22} />} label="Conversations" value={conversations.length} delay={0.2} />
          <StatCard
            icon={<UserRoundCheck size={22} />}
            label="Psychologue"
            value={activePsy ? "Affecté" : "Non affecté"}
            delay={0.25}
          />
        </div>

        {/* 🆕🆕🆕 TASK PROGRESS CARD (la nouvelle carte !) 🆕🆕🆕 */}
        <TaskProgressCard />

        {/* 3 actions cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <ActionCard
            icon={<FileText size={24} />}
            title="Faire le questionnaire"
            text="Répondez à quelques questions pour évaluer votre état psychologique."
            href="/questionnaire"
            button="Commencer"
            color="teal"
          />
          <ActionCard
            icon={<MessageCircle size={24} />}
            title="Parler avec l'assistant"
            text="Échangez avec notre IA pour un soutien immédiat et une écoute active."
            href="/chat"
            button="Ouvrir"
            color="orange"
          />
          <ActionCard
            icon={<Stethoscope size={24} />}
            title="Trouver un psychologue"
            text="Obtenez des recommandations personnalisées et prenez rendez-vous."
            href="/recommendations"
            button="Voir les recommandations"
            color="slate"
          />
        </div>

        {/* Two-column panels */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <PanelCard title="Votre psychologue" icon={<HeartHandshake size={24} />}>
            {activePsy ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-lg font-bold text-slate-800">{activePsy.full_name}</p>
                <p className="text-sm text-slate-500">{activePsy.specialization || "Psychologue généraliste"}</p>
                <p className="mt-1 text-sm text-slate-600">{activePsy.phone || "Téléphone non disponible"}</p>
                <Link
                  href="/appointments"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm text-white"
                >
                  <CalendarDays size={16} /> Prendre rendez-vous
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <p className="font-medium text-slate-700">Aucun psychologue affecté</p>
                <Link
                  href="/recommendations"
                  className="mt-3 inline-flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-2 text-sm text-white"
                >
                  <Sparkles size={16} /> Générer des recommandations
                </Link>
              </div>
            )}
          </PanelCard>

          <PanelCard title="Dernière activité" icon={<Activity size={24} />}>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">Dernier questionnaire</p>
                <p className="font-semibold text-slate-800">
                  {lastQuestionnaire
                    ? `${lastQuestionnaire.questionnaire_type || "initial"} — ${lastQuestionnaire.total_score ?? "—"} points`
                    : "Aucun questionnaire rempli"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">Dernière conversation</p>
                <p className="font-semibold text-slate-800">
                  {lastConversation ? lastConversation.title || "Conversation sans titre" : "Aucune conversation"}
                </p>
              </div>
            </div>
          </PanelCard>
        </div>

        {/* Conversations table */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle size={22} className="text-teal-700" />
            <h3 className="text-xl font-bold text-slate-800">Mes conversations</h3>
          </div>
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <MessageCircle size={36} className="mx-auto text-slate-400" />
              <p className="mt-2 text-slate-500">Aucune conversation pour le moment</p>
              <Link href="/chat" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-white">
                <PlusCircle size={16} /> Démarrer une conversation
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Titre</th>
        
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Date</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conversations.slice(0, 8).map((conv) => (
                    <tr key={conv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{conv.title || "Conversation"}</td>
                
                      <td className="px-4 py-3 text-slate-500">{formatDateLabel(conv.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/chat?conversation=${conv.id}`}
                            className="rounded-lg border p-1.5 text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeleteConversation(conv.id)}
                            disabled={deleteLoadingId === conv.id}
                            className="rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deleteLoadingId === conv.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Questionnaires table */}
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={22} className="text-teal-700" />
            <h3 className="text-xl font-bold text-slate-800">Mes questionnaires</h3>
          </div>
          {questionnaires.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <FileText size={36} className="mx-auto text-slate-400" />
              <p className="mt-2 text-slate-500">Aucun questionnaire rempli</p>
              <Link href="/questionnaire" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-white">
                <PlusCircle size={16} /> Répondre au questionnaire
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Score</th>
          
                    <th className="px-4 py-3 text-sm font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questionnaires.slice(0, 8).map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800 capitalize">{q.questionnaire_type || "initial"}</td>
                      <td className="px-4 py-3 font-semibold text-teal-700">{q.total_score ?? "—"} pts</td>
                  
                      <td className="px-4 py-3 text-slate-500">{formatDateLabel(q.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ========== REUSABLE SUBCOMPONENTS ==========
function StatCard({ icon, label, value, delay }: { icon: React.ReactNode; label: string; value: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-white p-5 shadow-md"
    >
      <div className="mb-3 inline-flex rounded-xl bg-teal-50 p-2 text-teal-700">{icon}</div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
    </motion.div>
  );
}

function ActionCard({
  icon,
  title,
  text,
  href,
  button,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  button: string;
  color: "teal" | "orange" | "slate";
}) {
  const colorClasses = {
    teal: "bg-teal-50 text-teal-700 hover:bg-teal-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    slate: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  };
  return (
    <Link href={href} className="group block rounded-2xl bg-white p-6 shadow-md transition hover:-translate-y-1">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${colorClasses[color]}`}>{icon}</div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-teal-700">
        {button} <ArrowRight size={14} className="transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function PanelCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-teal-50 p-2 text-teal-700">{icon}</div>
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}