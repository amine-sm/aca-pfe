"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  Clock,
  Languages,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  UserCheck,
  XCircle,
  AlertCircle,
  CalendarCheck,
  HeartPulse,
  ArrowRight,
  BadgeCheck,
  UsersRound,
} from "lucide-react";

import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  acceptRecommendation,
  generateRecommendations,
  getMyActivePsychologist,
  getMyRecommendations,
  rejectRecommendation,
} from "@/lib/recommendationsApi";

export default function RecommendationsPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuthGuard(["USER"]);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activePsychologist, setActivePsychologist] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setError("");
    setLoading(true);

    try {
      const [recommendationsData, activeData] = await Promise.all([
        getMyRecommendations(),
        getMyActivePsychologist().catch(() => ({ psychologist: null })),
      ]);

      setRecommendations((recommendationsData as any).recommendations || []);
      setActivePsychologist((activeData as any).psychologist || null);
    } catch (err: any) {
      setError(err.message || "Erreur chargement recommandations");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setError("");
    setMessage("");
    setGenerating(true);

    try {
      const data: any = await generateRecommendations();

      setMessage(
        data.message ||
          "Recommandations générées avec succès selon votre situation."
      );

      await loadData();
    } catch (err: any) {
      setError(err.message || "Erreur génération recommandations");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAccept(recommendationId: number | string) {
    setError("");
    setMessage("");
    setActionLoadingId(recommendationId);

    try {
      const data: any = await acceptRecommendation(recommendationId);

      setMessage(data.message || "Recommandation acceptée avec succès.");

      await loadData();
    } catch (err: any) {
      setError(err.message || "Erreur acceptation recommandation");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(recommendationId: number | string) {
    setError("");
    setMessage("");
    setActionLoadingId(recommendationId);

    try {
      const data: any = await rejectRecommendation(recommendationId);

      setMessage(data.message || "Recommandation refusée.");

      await loadData();
    } catch (err: any) {
      setError(err.message || "Erreur refus recommandation");
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const acceptedCount = recommendations.filter(
    (item) => item.status === "accepted"
  ).length;

  const suggestedCount = recommendations.filter(
    (item) => item.status === "suggested"
  ).length;

  const rejectedCount = recommendations.filter(
    (item) => item.status === "rejected"
  ).length;

  if (authLoading) {
    return (
      <main className="relative min-h-screen bg-[#F7FAFB]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="rounded-[28px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/70">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
              <p className="font-bold text-slate-700">Chargement...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7FAFB] text-slate-900">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute right-[-180px] top-40 h-[460px] w-[460px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 overflow-hidden rounded-[34px] bg-[#1B4F59] p-7 text-white shadow-2xl shadow-teal-900/20 md:p-10"
        >
          <div className="relative">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                  <Sparkles size={16} />
                  Orientation personnalisée
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
                  Psychologues recommandés
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50/85">
                  Retrouvez les spécialistes les plus adaptés à votre situation.
                  Vous pouvez accepter une recommandation pour commencer un
                  accompagnement plus structuré.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#1B4F59] shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {generating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  {generating ? "Génération..." : "Générer"}
                </button>

                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCcw size={18} />
                  )}
                  Actualiser
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  <MessageCircle size={18} />
                  Soutien
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Alerts */}
        {error && <AlertMessage type="error" message={error} />}
        {message && <AlertMessage type="success" message={message} />}

        {/* Stats */}
        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon={<Stethoscope size={24} />}
            label="Recommandations"
            value={recommendations.length}
            delay={0.1}
          />

          <StatBox
            icon={<Clock size={24} />}
            label="Suggérées"
            value={suggestedCount}
            delay={0.15}
          />

          <StatBox
            icon={<CheckCircle2 size={24} />}
            label="Acceptées"
            value={acceptedCount}
            delay={0.2}
          />

          <StatBox
            icon={<XCircle size={24} />}
            label="Refusées"
            value={rejectedCount}
            delay={0.25}
          />
        </section>

        {/* Active psychologist */}
        {activePsychologist && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="mb-8 overflow-hidden rounded-[34px] border border-emerald-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8"
          >
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                  <UserCheck size={34} />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                    <BadgeCheck size={16} />
                    Psychologue actif
                  </div>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                    {activePsychologist.full_name}
                  </h2>

                  <p className="mt-2 text-base font-semibold text-slate-500">
                    {activePsychologist.specialization ||
                      "Spécialité non définie"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/appointments")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-6 py-4 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47]"
              >
                <CalendarCheck size={18} />
                Prendre rendez-vous
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <InfoCard
                label="Ville"
                value={activePsychologist.city || "—"}
                icon={<MapPin size={20} />}
              />

              <InfoCard
                label="Langues"
                value={activePsychologist.languages || "—"}
                icon={<Languages size={20} />}
              />

              <InfoCard
                label="Consultation"
                value={`${activePsychologist.consultation_price || 0} ${
                  activePsychologist.currency || "DZD"
                }`}
                icon={<Star size={20} />}
              />
            </div>
          </motion.section>
        )}

        {/* Main content */}
        <section className="rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <SectionHeader
            icon={<UsersRound size={28} />}
            badge="Liste"
            title="Liste des recommandations"
            text="Choisissez le psychologue qui vous convient le mieux. Une recommandation acceptée sera associée à votre profil."
          />

          {loading && (
            <div className="mt-8 flex items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50 p-10">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
                <p className="font-bold text-slate-600">
                  Chargement des recommandations...
                </p>
              </div>
            </div>
          )}

          {!loading && recommendations.length === 0 && (
            <EmptyRecommendationState
              generating={generating}
              onGenerate={handleGenerate}
            />
          )}

          {!loading && recommendations.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {recommendations.map((item, index) => (
                <RecommendationCard
                  key={item.recommendation_id || item.psychologist_id || index}
                  item={item}
                  index={index}
                  actionLoadingId={actionLoadingId}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function RecommendationCard({
  item,
  index,
  actionLoadingId,
  onAccept,
  onReject,
}: {
  item: any;
  index: number;
  actionLoadingId: number | string | null;
  onAccept: (id: number | string) => void;
  onReject: (id: number | string) => void;
}) {
  const recommendationId = item.recommendation_id || item.id;
  const isLoading = actionLoadingId === recommendationId;

  const status = item.status || "suggested";
  const disabled = isLoading || status === "accepted" || status === "rejected";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.05 * index, duration: 0.45 }}
      whileHover={{ y: -6 }}
      className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-xl shadow-slate-200/60 transition hover:shadow-2xl"
    >
      <div className="relative bg-gradient-to-br from-[#1B4F59] to-teal-700 p-6 text-white">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <StatusBadge status={status} />

            <h3 className="mt-4 text-2xl font-black leading-tight">
              {item.full_name || "Psychologue"}
            </h3>

            <p className="mt-2 text-sm font-semibold text-teal-50/80">
              {item.specialization || "Spécialité non définie"}
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-center backdrop-blur">
            <div>
              <p className="text-2xl font-black">
                {Number(item.recommendation_score || 0)}
              </p>
              <p className="text-[10px] font-bold uppercase text-white/60">
                Score
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="grid gap-3">
          <InfoLine
            icon={<MapPin size={17} />}
            label="Ville"
            value={item.city || "—"}
          />

          <InfoLine
            icon={<Languages size={17} />}
            label="Langues"
            value={item.languages || "—"}
          />

          <InfoLine
            icon={<Star size={17} />}
            label="Expérience"
            value={`${item.experience_years || 0} ans`}
          />

          <InfoLine
            icon={<Stethoscope size={17} />}
            label="Consultation"
            value={`${item.consultation_price || 0} ${
              item.currency || "DZD"
            }`}
          />
        </div>

        {item.reason && (
          <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#1B4F59]">
              <Sparkles size={16} />
              Pourquoi ce choix ?
            </div>

            <p className="text-sm font-semibold leading-7 text-slate-600">
              {item.reason}
            </p>
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAccept(recommendationId)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={17} />
              )}
              Accepter
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onReject(recommendationId)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle size={17} />
              Refuser
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function EmptyRecommendationState({
  generating,
  onGenerate,
}: {
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="mt-8 flex min-h-[360px] items-center justify-center rounded-[30px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="max-w-2xl">
        <div className="mx-auto mb-6 inline-flex rounded-3xl bg-white p-5 text-[#1B4F59] shadow-sm">
          <Brain size={42} />
        </div>

        <h3 className="text-2xl font-black text-slate-950">
          Aucune recommandation pour le moment
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-7 text-slate-500">
          Lancez la génération après avoir complété votre questionnaire. La
          plateforme vous proposera des spécialistes adaptés à votre situation.
        </p>

        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-6 py-4 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {generating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          {generating ? "Génération..." : "Générer maintenant"}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  badge,
  title,
  text,
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
          {badge}
        </div>

        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl leading-7 text-slate-500">{text}</p>
      </div>

      <div className="hidden rounded-3xl bg-teal-50 p-4 text-[#1B4F59] md:block">
        {icon}
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur"
    >
      <div className="mb-5 inline-flex rounded-2xl bg-teal-50 p-4 text-[#1B4F59]">
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>

      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
    </motion.div>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1B4F59] shadow-sm">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="mt-1 font-black text-slate-950">{String(value)}</p>
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="inline-flex items-center gap-2 text-sm font-black text-slate-500">
        <span className="text-[#1B4F59]">{icon}</span>
        {label}
      </span>

      <span className="text-right text-sm font-black text-slate-900">
        {String(value)}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-100 ring-1 ring-emerald-300/20">
        <CheckCircle2 size={14} />
        Acceptée
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-400/20 px-3 py-1 text-xs font-black text-red-100 ring-1 ring-red-300/20">
        <XCircle size={14} />
        Refusée
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-orange-400/20 px-3 py-1 text-xs font-black text-orange-100 ring-1 ring-orange-300/20">
      <Clock size={14} />
      Suggérée
    </span>
  );
}

function AlertMessage({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-sm ${
        type === "error"
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700"
      }`}
    >
      {type === "error" ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      )}

      <span>{message}</span>
    </motion.div>
  );
}