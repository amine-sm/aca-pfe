"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  HeartHandshake,
  Loader2,
  MessageCircle,
  PlusCircle,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRoundCheck,
} from "lucide-react";

import {
  getMyProfile,
  getMyQuestionnaires,
} from "@/lib/usersApi";

import {
  deleteConversation,
  getMyConversations,
} from "@/lib/conversationsApi";

import { getMyActivePsychologist } from "@/lib/recommendationsApi";
import { useAuthGuard } from "../hooks/useAuthGuard";
import TaskProgressCard from "../components/TaskProgressCard";

/* =========================================================
   TYPES
========================================================= */

type DashboardUser = {
  id?: number | string;
  full_name?: string;
  email?: string;
};

type Questionnaire = {
  id: number | string;
  questionnaire_type?: string;
  total_score?: number;
  created_at?: string;
};

type Conversation = {
  id: number | string;
  title?: string;
  created_at?: string;
};

type Psychologist = {
  id?: number | string;
  full_name?: string;
  specialization?: string;
  phone?: string;
};

/* =========================================================
   FONCTIONS UTILITAIRES
========================================================= */

function formatDateLabel(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getErrorMessage(
  error: unknown,
  defaultMessage: string,
) {
  return error instanceof Error
    ? error.message
    : defaultMessage;
}

/* =========================================================
   PAGE PRINCIPALE
========================================================= */

export default function DashboardPage() {
  const { loading } = useAuthGuard(["USER"]);

  const [user, setUser] =
    useState<DashboardUser | null>(null);

  const [questionnaires, setQuestionnaires] = useState<
    Questionnaire[]
  >([]);

  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [activePsy, setActivePsy] =
    useState<Psychologist | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [deleteLoadingId, setDeleteLoadingId] = useState<
    number | string | null
  >(null);

  /* =======================================================
     CHARGEMENT DU DASHBOARD
  ======================================================= */

  async function loadDashboard() {
    setError("");

    try {
      const [profileResponse, questionnairesResponse, conversationsResponse, psychologistResponse] =
        await Promise.all([
          getMyProfile(),

          getMyQuestionnaires(),

          getMyConversations(),

          getMyActivePsychologist().catch(() => ({
            psychologist: null,
          })),
        ]);

      setUser(profileResponse?.user ?? null);

      setQuestionnaires(
        questionnairesResponse?.questionnaires ?? [],
      );

      setConversations(
        conversationsResponse?.conversations ?? [],
      );

      setActivePsy(
        psychologistResponse?.psychologist ?? null,
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Erreur pendant le chargement du tableau de bord.",
        ),
      );
    }
  }

  /* =======================================================
     SUPPRESSION D’UNE CONVERSATION
  ======================================================= */

  async function handleDeleteConversation(
    id: number | string,
  ) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette conversation ?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");
    setDeleteLoadingId(id);

    try {
      const response = await deleteConversation(id);

      setConversations((previousConversations) =>
        previousConversations.filter(
          (conversation) => conversation.id !== id,
        ),
      );

      setMessage(
        response?.message ||
          "La conversation a été supprimée.",
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Erreur pendant la suppression de la conversation.",
        ),
      );
    } finally {
      setDeleteLoadingId(null);
    }
  }

  useEffect(() => {
    if (!loading) {
      void loadDashboard();
    }
  }, [loading]);

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7FAFB]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-xl shadow-teal-900/10">
            <Image
              src="/logo.png"
              alt="Logo EL MOUSANID AI"
              width={80}
              height={80}
              priority
              className="h-full w-full object-contain"
            />
          </div>

          <Loader2 className="h-8 w-8 animate-spin text-[#1B4F59]" />

          <p className="text-sm font-bold text-slate-500">
            Chargement de votre espace...
          </p>
        </div>
      </main>
    );
  }

  const lastQuestionnaire = questionnaires[0];
  const lastConversation = conversations[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            EN-TÊTE
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
          }}
          className="relative mb-8 overflow-hidden rounded-[30px] bg-gradient-to-r from-[#1B4F59] via-teal-800 to-cyan-800 p-6 text-white shadow-2xl shadow-teal-900/20 md:p-8"
        >
          {/* Décorations */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* LOGO */}
              <Link
                href="/"
                aria-label="Retour à l’accueil"
                className="shrink-0"
              >
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    rotate: 2,
                  }}
                  whileTap={{
                    scale: 0.96,
                  }}
                  className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-white p-2 shadow-xl"
                >
                  <Image
                    src="/logo.png"
                    alt="Logo EL MOUSANID AI"
                    width={96}
                    height={96}
                    priority
                    className="h-full w-full object-contain"
                  />
                </motion.div>
              </Link>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                  <UserRoundCheck size={17} />
                  Espace personnel
                </div>

                <p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-teal-100/80">
                  EL MOUSANID AI
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
                  Bonjour {user?.full_name || "Utilisateur"}
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-teal-50/85">
                  Suivez votre évolution, consultez vos
                  questionnaires, échangez avec l’assistant et
                  bénéficiez d’un accompagnement adapté.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/questionnaire"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FE5737] px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-[#e94a2c]"
              >
                <FileText size={18} />
                Questionnaire
              </Link>

              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/15 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25"
              >
                <MessageCircle size={18} />
                Parler maintenant
              </Link>
            </div>
          </div>
        </motion.section>

        {/* =================================================
            ALERTES
        ================================================= */}

        {(error || message) && (
          <div className="mb-6 space-y-3">
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"
              >
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
              >
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <span>{message}</span>
              </motion.div>
            )}
          </div>
        )}

        {/* =================================================
            SOUTIEN RAPIDE
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.05,
          }}
          className="mb-8 rounded-[26px] border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200/60 backdrop-blur"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Comment vous sentez-vous aujourd’hui ?
              </h2>

              <p className="mt-1 leading-7 text-slate-500">
                Commencez par un questionnaire ou une conversation
                avec l’assistant.
              </p>
            </div>

            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#153F47]"
            >
              <MessageCircle size={18} />
              Besoin de parler
            </Link>
          </div>
        </motion.section>

        {/* =================================================
            STATISTIQUES
        ================================================= */}

        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<FileText size={23} />}
            label="Questionnaires"
            value={questionnaires.length}
            delay={0.15}
          />

          <StatCard
            icon={<MessageCircle size={23} />}
            label="Conversations"
            value={conversations.length}
            delay={0.2}
          />

          <StatCard
            icon={<UserRoundCheck size={23} />}
            label="Psychologue"
            value={activePsy ? "Affecté" : "Non affecté"}
            delay={0.25}
          />
        </section>

        {/* =================================================
            PROGRESSION DES TÂCHES
        ================================================= */}

        <div className="mb-8">
          <TaskProgressCard />
        </div>

        {/* =================================================
            ACTIONS PRINCIPALES
        ================================================= */}

        <section className="mb-8 grid gap-6 md:grid-cols-3">
          <ActionCard
            icon={<FileText size={25} />}
            title="Faire le questionnaire"
            text="Répondez à quelques questions pour évaluer votre situation et obtenir une orientation."
            href="/questionnaire"
            button="Commencer"
            color="teal"
          />

          <ActionCard
            icon={<MessageCircle size={25} />}
            title="Parler avec l’assistant"
            text="Échangez avec notre assistant intelligent pour obtenir une écoute et un soutien immédiats."
            href="/chat"
            button="Ouvrir la conversation"
            color="orange"
          />

          <ActionCard
            icon={<Stethoscope size={25} />}
            title="Trouver un psychologue"
            text="Consultez les recommandations personnalisées et choisissez un professionnel."
            href="/recommendations"
            button="Voir les recommandations"
            color="slate"
          />
        </section>

        {/* =================================================
            PSYCHOLOGUE ET DERNIÈRE ACTIVITÉ
        ================================================= */}

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <PanelCard
            title="Votre psychologue"
            icon={<HeartHandshake size={24} />}
          >
            {activePsy ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-[#1B4F59]">
                    <Stethoscope size={23} />
                  </div>

                  <div>
                    <p className="text-lg font-black text-slate-900">
                      {activePsy.full_name ||
                        "Psychologue affecté"}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {activePsy.specialization ||
                        "Psychologue généraliste"}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {activePsy.phone ||
                        "Téléphone non disponible"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/appointments"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1B4F59] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#153F47]"
                >
                  <CalendarDays size={17} />
                  Prendre rendez-vous
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FE5737]">
                  <Stethoscope size={27} />
                </div>

                <p className="mt-4 font-bold text-slate-700">
                  Aucun psychologue affecté
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Générez des recommandations pour trouver un
                  professionnel adapté.
                </p>

                <Link
                  href="/recommendations"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FE5737] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e94a2c]"
                >
                  <Sparkles size={17} />
                  Voir les recommandations
                </Link>
              </div>
            )}
          </PanelCard>

          <PanelCard
            title="Dernière activité"
            icon={<Activity size={24} />}
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-teal-100 p-2 text-[#1B4F59]">
                    <FileText size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Dernier questionnaire
                    </p>

                    <p className="mt-1 font-bold text-slate-800">
                      {lastQuestionnaire
                        ? `${
                            lastQuestionnaire.questionnaire_type ||
                            "Initial"
                          } — ${
                            lastQuestionnaire.total_score ?? "—"
                          } points`
                        : "Aucun questionnaire rempli"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-orange-100 p-2 text-[#FE5737]">
                    <MessageCircle size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Dernière conversation
                    </p>

                    <p className="mt-1 font-bold text-slate-800">
                      {lastConversation
                        ? lastConversation.title ||
                          "Conversation sans titre"
                        : "Aucune conversation"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </PanelCard>
        </section>

        {/* =================================================
            CONVERSATIONS
        ================================================= */}

        <section className="mb-8 overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-50 p-3 text-[#1B4F59]">
                <MessageCircle size={23} />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Mes conversations
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Retrouvez vos échanges avec l’assistant.
                </p>
              </div>
            </div>

            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4F59] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#153F47]"
            >
              <PlusCircle size={17} />
              Nouvelle conversation
            </Link>
          </div>

          <div className="p-6">
            {conversations.length === 0 ? (
              <EmptyState
                icon={<MessageCircle size={37} />}
                title="Aucune conversation"
                description="Vous n’avez encore démarré aucune conversation."
                href="/chat"
                button="Démarrer une conversation"
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3.5 text-sm font-bold text-slate-600">
                        Titre
                      </th>

                      <th className="px-4 py-3.5 text-sm font-bold text-slate-600">
                        Date
                      </th>

                      <th className="px-4 py-3.5 text-sm font-bold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {conversations
                      .slice(0, 8)
                      .map((conversation) => (
                        <tr
                          key={conversation.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            {conversation.title ||
                              "Conversation"}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-500">
                            {formatDateLabel(
                              conversation.created_at,
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/chat?conversation=${conversation.id}`}
                                aria-label="Ouvrir la conversation"
                                title="Ouvrir"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-[#1B4F59]"
                              >
                                <Eye size={17} />
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteConversation(
                                    conversation.id,
                                  )
                                }
                                disabled={
                                  deleteLoadingId ===
                                  conversation.id
                                }
                                aria-label="Supprimer la conversation"
                                title="Supprimer"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deleteLoadingId ===
                                conversation.id ? (
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={17} />
                                )}
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
        </section>

        {/* =================================================
            QUESTIONNAIRES
        ================================================= */}

        <section className="overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-50 p-3 text-[#1B4F59]">
                <FileText size={23} />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Mes questionnaires
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Consultez vos évaluations précédentes.
                </p>
              </div>
            </div>

            <Link
              href="/questionnaire"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4F59] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#153F47]"
            >
              <PlusCircle size={17} />
              Nouveau questionnaire
            </Link>
          </div>

          <div className="p-6">
            {questionnaires.length === 0 ? (
              <EmptyState
                icon={<FileText size={37} />}
                title="Aucun questionnaire"
                description="Vous n’avez encore rempli aucun questionnaire."
                href="/questionnaire"
                button="Répondre au questionnaire"
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3.5 text-sm font-bold text-slate-600">
                        Type
                      </th>

                      <th className="px-4 py-3.5 text-sm font-bold text-slate-600">
                        Score
                      </th>

                      <th className="px-4 py-3.5 text-sm font-bold text-slate-600">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {questionnaires
                      .slice(0, 8)
                      .map((questionnaire) => (
                        <tr
                          key={questionnaire.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 font-semibold capitalize text-slate-800">
                            {questionnaire.questionnaire_type ||
                              "Initial"}
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-black text-[#1B4F59]">
                              {questionnaire.total_score ??
                                "—"}{" "}
                              pts
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-500">
                            {formatDateLabel(
                              questionnaire.created_at,
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   COMPOSANTS RÉUTILISABLES
========================================================= */

function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay,
      }}
      whileHover={{
        y: -4,
      }}
      className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition"
    >
      <div className="mb-4 inline-flex rounded-2xl bg-teal-50 p-3 text-[#1B4F59]">
        {icon}
      </div>

      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <div className="mt-1 text-2xl font-black text-slate-900">
        {value}
      </div>
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
  icon: ReactNode;
  title: string;
  text: string;
  href: string;
  button: string;
  color: "teal" | "orange" | "slate";
}) {
  const colorClasses = {
    teal: {
      icon: "bg-teal-50 text-[#1B4F59] group-hover:bg-[#1B4F59] group-hover:text-white",
      button: "text-[#1B4F59]",
    },

    orange: {
      icon: "bg-orange-50 text-[#FE5737] group-hover:bg-[#FE5737] group-hover:text-white",
      button: "text-[#FE5737]",
    },

    slate: {
      icon: "bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white",
      button: "text-slate-700",
    },
  };

  return (
    <Link
      href={href}
      className="group block rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        className={[
          "mb-5 inline-flex rounded-2xl p-3 transition",
          colorClasses[color].icon,
        ].join(" ")}
      >
        {icon}
      </div>

      <h3 className="text-lg font-black text-slate-900">
        {title}
      </h3>

      <p className="mt-2 min-h-[66px] text-sm leading-6 text-slate-500">
        {text}
      </p>

      <div
        className={[
          "mt-5 flex items-center gap-2 text-sm font-black",
          colorClasses[color].button,
        ].join(" ")}
      >
        {button}

        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}

function PanelCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-teal-50 p-3 text-[#1B4F59]">
          {icon}
        </div>

        <h3 className="text-xl font-black text-slate-900">
          {title}
        </h3>
      </div>

      {children}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  href,
  button,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  button: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        {icon}
      </div>

      <p className="mt-4 text-lg font-black text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1B4F59] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#153F47]"
      >
        <PlusCircle size={17} />
        {button}
      </Link>
    </div>
  );
}