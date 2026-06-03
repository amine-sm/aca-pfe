"use client";

import { use, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Brain,
  TrendingUp,
  ClipboardList,
  Stethoscope,
  HeartPulse,
  History,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  FileText,
  Download,
} from "lucide-react";

import { useAuthGuard } from "../../../hooks/useAuthGuard";
import {
  ClinicalPatientFull,
  getPatientClinicalProfile,
  OnboardingAnswer,
} from "@/lib/onboardingApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PatientClinicalPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const { loading: authLoading } = useAuthGuard([
    "PSYCHOLOGIST",
    "ADMIN",
    "SUPER_ADMIN",
  ]);

  const [data, setData] = useState<ClinicalPatientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    setError("");

    getPatientClinicalProfile(id)
      .then((res) => setData(res))
      .catch((err) =>
        setError(err.message || "Erreur de chargement du dossier")
      )
      .finally(() => setLoading(false));
  }, [authLoading, id]);

  async function handleDownloadPdf() {
    try {
      if (!data) return;

      setPdfLoading(true);

      const { patient, latest_profile, profile_history } = data;
      const fullProfile = latest_profile?.full_profile;

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      let y = 18;

      function checkPage(extraHeight = 10) {
        if (y + extraHeight > pageHeight - 18) {
          pdf.addPage();
          y = 18;
        }
      }

      function writeLine(
        text: string,
        options?: {
          size?: number;
          bold?: boolean;
          color?: [number, number, number];
          gap?: number;
        }
      ) {
        const size = options?.size || 10;
        const gap = options?.gap || 6;
        const color = options?.color || [15, 23, 42];

        pdf.setFont("helvetica", options?.bold ? "bold" : "normal");
        pdf.setFontSize(size);
        pdf.setTextColor(color[0], color[1], color[2]);

        const lines = pdf.splitTextToSize(text || "—", contentWidth);

        lines.forEach((line: string) => {
          checkPage(gap);
          pdf.text(line, margin, y);
          y += gap;
        });
      }

      function sectionTitle(title: string) {
        checkPage(18);

        y += 4;

        pdf.setFillColor(27, 79, 89);
        pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text(title, margin + 4, y + 6.8);

        y += 16;
      }

      function field(label: string, value?: string | number | null) {
        if (!value && value !== 0) return;

        checkPage(8);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(27, 79, 89);
        pdf.text(`${label} :`, margin, y);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(15, 23, 42);

        const valueLines = pdf.splitTextToSize(String(value), contentWidth - 42);
        pdf.text(valueLines, margin + 42, y);

        y += Math.max(6, valueLines.length * 5);
      }

      pdf.setFillColor(27, 79, 89);
      pdf.roundedRect(margin, y, contentWidth, 32, 4, 4, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Dossier patient", margin + 6, y + 11);

      pdf.setFontSize(12);
      pdf.text(patient?.full_name || "Patient", margin + 6, y + 21);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(220, 252, 231);
      pdf.text(
        `Généré le : ${new Date().toLocaleDateString("fr-FR")}`,
        margin + 6,
        y + 27
      );

      y += 44;

      sectionTitle("Informations du patient");

      field("Nom", patient?.full_name);
      field("Email", patient?.email);
      field("Téléphone", patient?.phone);
      field("Ville", patient?.city);
      field("Pays", patient?.country);
      field("Type addiction", patient?.addiction_type);
      field("Niveau consommation", patient?.consumption_level);
      field("Risque patient", patient?.risk_level);

      if (!latest_profile) {
        sectionTitle("Évaluation initiale");

        writeLine("Aucune évaluation initiale réalisée par ce patient.", {
          size: 11,
          bold: true,
        });

        addFooter(pdf, pageWidth, pageHeight, margin);

        const patientName = patient?.full_name
          ? patient.full_name.replace(/\s+/g, "_")
          : "patient";

        pdf.save(`dossier_patient_${patientName}.pdf`);
        return;
      }

      sectionTitle("Résumé clinique");

      field("Niveau de risque", latest_profile.risk_level);
      field(
        "Score clinique",
        fullProfile?.risk
          ? `${fullProfile.risk.score} / ${fullProfile.risk.max_score}`
          : latest_profile.risk_score || 0
      );
      field("Sentiment NLP", latest_profile.sentiment);
      field(
        "Orientation",
        mapOrientationLabel(latest_profile.orientation_type || "")
      );
      field("Date évaluation", formatDate(latest_profile.created_at));

      if (latest_profile.free_text) {
        sectionTitle("Message libre du patient");

        writeLine(`"${latest_profile.free_text}"`, {
          size: 10,
          color: [51, 65, 85],
        });
      }

      if (latest_profile.dominant_emotions?.length > 0) {
        sectionTitle("Émotions dominantes détectées");

        writeLine(latest_profile.dominant_emotions.join(", "), {
          size: 10,
          bold: true,
          color: [27, 79, 89],
        });
      }

      if (latest_profile.answers?.length > 0) {
        sectionTitle("Détail des réponses");

        latest_profile.answers.forEach(
          (answer: OnboardingAnswer, index: number) => {
            checkPage(26);

            pdf.setFillColor(248, 250, 252);
            pdf.roundedRect(margin, y, contentWidth, 9, 2, 2, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(15, 23, 42);
            pdf.text(
              `${index + 1}. ${answer.title || "Question"}`,
              margin + 3,
              y + 6
            );

            y += 13;

            writeLine(`Question : ${answer.question || "—"}`, {
              size: 9,
              color: [51, 65, 85],
              gap: 5,
            });

            writeLine(`Réponse : ${answer.label || answer.value || "—"}`, {
              size: 9,
              bold: true,
              color: [15, 23, 42],
              gap: 5,
            });

            writeLine(`Sévérité : ${answer.severity || "low"}`, {
              size: 8,
              color: [100, 116, 139],
              gap: 5,
            });

            if (answer.source) {
              writeLine(`Source : ${answer.source}`, {
                size: 8,
                color: [100, 116, 139],
                gap: 5,
              });
            }

            y += 3;
          }
        );
      }

      if (latest_profile.recommendations?.length > 0) {
        sectionTitle("Recommandations générées par l’IA");

        latest_profile.recommendations.forEach(
          (recommendation: string, index: number) => {
            writeLine(`${index + 1}. ${recommendation}`, {
              size: 9,
              color: [51, 65, 85],
              gap: 5,
            });

            y += 2;
          }
        );
      }

      if (fullProfile?.orientation) {
        sectionTitle("Orientation suggérée par le système");

        field("Type", mapOrientationLabel(fullProfile.orientation.type));

        if (fullProfile.orientation.message) {
          writeLine(fullProfile.orientation.message, {
            size: 10,
            color: [51, 65, 85],
          });
        }

        if (fullProfile.orientation.actions?.length > 0) {
          y += 2;

          writeLine("Actions recommandées :", {
            size: 10,
            bold: true,
            color: [27, 79, 89],
          });

          fullProfile.orientation.actions.forEach(
            (action: string, index: number) => {
              writeLine(`${index + 1}. ${action}`, {
                size: 9,
                color: [51, 65, 85],
                gap: 5,
              });
            }
          );
        }
      }

      if (profile_history && profile_history.length > 1) {
        sectionTitle("Historique des évaluations");

        profile_history.forEach((profile) => {
          checkPage(22);

          field("Date", formatDate(profile.created_at));
          field("Risque", profile.risk_level);
          field("Score", profile.risk_score);
          field("Type", profile.addiction_type);

          y += 3;
        });
      }

      addFooter(pdf, pageWidth, pageHeight, margin);

      const patientName = patient?.full_name
        ? patient.full_name.replace(/\s+/g, "_")
        : "patient";

      pdf.save(`dossier_patient_${patientName}.pdf`);
    } catch (err) {
      console.error("Erreur PDF:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7FAFB] px-4 pt-20 text-[#0F172A]">
        <BackgroundDecor />

        <div className="relative z-10 flex items-center gap-3 rounded-3xl border border-[#E2E8F0] bg-white px-7 py-5 shadow-2xl">
          <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
          <p className="font-bold text-[#334155]">
            Chargement du dossier patient…
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F7FAFB] pt-28 text-[#0F172A]">
        <BackgroundDecor />

        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <div className="flex items-start gap-4 rounded-3xl border border-[#FECACA] bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#DC2626]">
              <AlertCircle size={22} />
            </div>

            <div>
              <p className="text-lg font-black text-[#B91C1C]">Erreur</p>
              <p className="mt-1 text-sm leading-6 text-[#DC2626]">{error}</p>

              <button
                onClick={() => router.push("/psychologist/patients")}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#163f47]"
              >
                <ArrowLeft size={15} className="text-white" />
                <span className="text-white">Retour aux patients</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { patient, latest_profile, profile_history } = data;
  const fullProfile = latest_profile?.full_profile;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7FAFB] pb-14 pt-24 text-[#0F172A]">
      <BackgroundDecor />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push("/psychologist/patients")}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-black text-[#475569] shadow-lg transition hover:-translate-y-0.5 hover:border-[#5EEAD4] hover:text-[#1B4F59]"
          >
            <ArrowLeft size={15} />
            Retour aux patients
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#163f47] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pdfLoading ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <Download size={16} className="text-white" />
            )}
            <span className="text-white">Télécharger PDF</span>
          </button>
        </div>

        <div ref={pdfRef} className="rounded-[32px] bg-[#F7FAFB] p-1">
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative mb-7 overflow-hidden rounded-[36px] bg-gradient-to-br from-[#1B4F59] via-[#236876] to-[#2E6F7E] p-7 text-white shadow-2xl md:p-9"
          >
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#67E8F9]/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-white/15 bg-white/15 text-white shadow-xl backdrop-blur">
                  <User size={34} className="text-white" />
                </div>

                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                    <FileText size={13} className="text-white" />
                    <span className="text-white">Dossier patient</span>
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                    {patient.full_name || "Patient"}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-2.5 text-sm font-semibold text-white/90">
                    {patient.email && (
                      <InfoPill
                        icon={<Mail size={14} />}
                        text={patient.email}
                      />
                    )}

                    {patient.phone && (
                      <InfoPill
                        icon={<Phone size={14} />}
                        text={patient.phone}
                      />
                    )}

                    {patient.city && (
                      <InfoPill
                        icon={<MapPin size={14} />}
                        text={`${patient.city}${
                          patient.country ? `, ${patient.country}` : ""
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {patient.risk_level && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider shadow-lg ${riskPill(
                      patient.risk_level
                    )}`}
                  >
                    <Activity size={14} />
                    Risque : {patient.risk_level}
                  </span>
                )}

                {patient.addiction_type && (
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/15 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg backdrop-blur">
                    <ShieldCheck size={14} className="text-white" />
                    <span className="text-white">{patient.addiction_type}</span>
                  </span>
                )}
              </div>
            </div>
          </motion.section>

          {!latest_profile && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-[#E2E8F0] bg-white p-10 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#ECFDF5] text-[#1B4F59]">
                <ClipboardList size={34} />
              </div>

              <p className="text-xl font-black text-[#0F172A]">
                Aucune évaluation initiale réalisée par ce patient.
              </p>

              <p className="mt-2 text-sm font-medium text-[#64748B]">
                Le patient n&apos;a pas encore complété son questionnaire.
              </p>
            </motion.div>
          )}

          {latest_profile && (
            <>
              <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ClinicalKPI
                  icon={<TrendingUp size={19} />}
                  label="Niveau de risque"
                  value={latest_profile.risk_level || "—"}
                  accent={riskClassicAccent(latest_profile.risk_level)}
                />

                <ClinicalKPI
                  icon={<Activity size={19} />}
                  label="Score clinique"
                  value={
                    fullProfile?.risk
                      ? `${fullProfile.risk.score} / ${fullProfile.risk.max_score}`
                      : `${latest_profile.risk_score || 0}`
                  }
                />

                <ClinicalKPI
                  icon={<HeartPulse size={19} />}
                  label="Sentiment NLP"
                  value={latest_profile.sentiment || "—"}
                />

                <ClinicalKPI
                  icon={<Stethoscope size={19} />}
                  label="Orientation"
                  value={mapOrientationLabel(
                    latest_profile.orientation_type || ""
                  )}
                />
              </section>

              {latest_profile.free_text && (
                <ClinicalCard
                  icon={<MessageSquare size={19} />}
                  title="Message libre du patient"
                  subtitle="Texte saisi au démarrage de l’évaluation"
                >
                  <blockquote className="rounded-3xl border border-[#CCFBF1] bg-[#F0FDFA] p-5 text-sm italic leading-7 text-[#334155]">
                    « {latest_profile.free_text} »
                  </blockquote>

                  {(latest_profile.dominant_emotions?.length || 0) > 0 && (
                    <div className="mt-5">
                      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">
                        Émotions dominantes détectées
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {latest_profile.dominant_emotions.map((emotion) => (
                          <span
                            key={emotion}
                            className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-black text-[#1B4F59]"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </ClinicalCard>
              )}

              {latest_profile.answers && latest_profile.answers.length > 0 && (
                <ClinicalCard
                  icon={<ClipboardList size={19} />}
                  title="Détail des réponses"
                  subtitle={`${latest_profile.answers.length} questions enregistrées`}
                >
                  <div className="space-y-3">
                    {latest_profile.answers.map((answer, index) => (
                      <AnswerRow
                        key={`${index}-${answer.question || answer.title}`}
                        index={index + 1}
                        answer={answer}
                      />
                    ))}
                  </div>
                </ClinicalCard>
              )}

              {latest_profile.recommendations &&
                latest_profile.recommendations.length > 0 && (
                  <ClinicalCard
                    icon={<Lightbulb size={19} />}
                    title="Recommandations générées par l’IA"
                    subtitle="Suggestions d’accompagnement clinique"
                  >
                    <ul className="space-y-3">
                      {latest_profile.recommendations.map(
                        (recommendation, index) => (
                          <li
                            key={`${index}-${recommendation}`}
                            className="flex items-start gap-3 rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm leading-7 text-[#334155]"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] text-xs font-black text-[#1B4F59]">
                              {index + 1}
                            </span>

                            <span>{recommendation}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </ClinicalCard>
                )}

              {fullProfile?.orientation && (
                <ClinicalCard
                  icon={<Brain size={19} />}
                  title="Orientation suggérée par le système"
                  subtitle={mapOrientationLabel(fullProfile.orientation.type)}
                >
                  <p className="text-sm leading-7 text-[#334155]">
                    {fullProfile.orientation.message}
                  </p>

                  {fullProfile.orientation.actions?.length > 0 && (
                    <ul className="mt-5 space-y-3">
                      {fullProfile.orientation.actions.map(
                        (action: string, index: number) => (
                          <li
                            key={`${index}-${action}`}
                            className="flex items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm leading-6 text-[#334155]"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1B4F59]" />
                            {action}
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </ClinicalCard>
              )}

              {profile_history && profile_history.length > 1 && (
                <ClinicalCard
                  icon={<History size={19} />}
                  title="Historique des évaluations"
                  subtitle={`${profile_history.length} évaluations enregistrées`}
                >
                  <div className="space-y-3">
                    {profile_history.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#1B4F59] shadow-sm">
                            <Calendar size={16} />
                          </div>

                          <div>
                            <p className="font-black text-[#0F172A]">
                              {formatDate(profile.created_at)}
                            </p>

                            {profile.addiction_type && (
                              <p className="mt-0.5 text-xs font-semibold text-[#94A3B8]">
                                {profile.addiction_type}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#94A3B8]">
                            Score {profile.risk_score}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${riskClassicAccent(
                              profile.risk_level
                            )}`}
                          >
                            {profile.risk_level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ClinicalCard>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function addFooter(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  const pageCount = pdf.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);

    pdf.text(`Page ${i} / ${pageCount}`, pageWidth - margin - 22, pageHeight - 8);

    pdf.text(
      "Dossier patient généré depuis l’espace psychologue",
      margin,
      pageHeight - 8
    );
  }
}

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 left-1/2 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[#99F6E4]/40 blur-3xl" />
      <div className="absolute right-[-180px] top-40 h-[440px] w-[440px] rounded-full bg-[#A5F3FC]/40 blur-3xl" />
      <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full bg-[#BBF7D0]/40 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
    </div>
  );
}

function InfoPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-1.5 text-white/90 backdrop-blur">
      {icon}
      {text}
    </span>
  );
}

function ClinicalCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-7 rounded-[32px] border border-[#E2E8F0] bg-white p-6 text-[#0F172A] shadow-2xl md:p-7"
    >
      <header className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#1B4F59]">
          {icon}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-black text-[#0F172A]">{title}</h3>

          {subtitle && (
            <p className="mt-1 text-sm font-semibold text-[#94A3B8]">
              {subtitle}
            </p>
          )}
        </div>

        <Sparkles size={18} className="hidden text-[#14B8A6] sm:block" />
      </header>

      {children}
    </motion.section>
  );
}

function ClinicalKPI({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-[#E2E8F0] bg-white p-5 text-[#0F172A] shadow-2xl"
    >
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
          accent || "bg-[#ECFDF5] text-[#1B4F59]"
        }`}
      >
        {icon}
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">
        {label}
      </p>

      <p className="mt-2 text-lg font-black capitalize text-[#0F172A]">
        {value}
      </p>
    </motion.div>
  );
}

function AnswerRow({
  index,
  answer,
}: {
  index: number;
  answer: OnboardingAnswer;
}) {
  const severity = String(answer.severity || "low").toLowerCase();

  const boxClass =
    severity === "high"
      ? "border-[#FECACA] bg-[#FEF2F2]"
      : severity === "medium"
      ? "border-[#FDE68A] bg-[#FFFBEB]"
      : "border-[#A7F3D0] bg-[#ECFDF5]";

  const badgeClass =
    severity === "high"
      ? "bg-[#FEE2E2] text-[#B91C1C]"
      : severity === "medium"
      ? "bg-[#FEF3C7] text-[#B45309]"
      : "bg-[#D1FAE5] text-[#047857]";

  const source = String(answer.source || "").toLowerCase();

  const sourceClass =
    source === "qwen"
      ? "bg-[#F3E8FF] text-[#7E22CE]"
      : source === "keyword"
      ? "bg-[#DBEAFE] text-[#1D4ED8]"
      : source === "emotion"
      ? "bg-[#FFE4E6] text-[#BE123C]"
      : "bg-[#F1F5F9] text-[#475569]";

  return (
    <div className={`rounded-3xl border p-4 ${boxClass}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-[11px] font-black text-[#0F172A] shadow-sm">
          {index}
        </span>

        <p className="text-sm font-black text-[#0F172A]">
          {answer.title || "Question"}
        </p>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badgeClass}`}
        >
          {answer.severity || "low"}
        </span>

        {answer.source && (
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${sourceClass}`}
          >
            {source === "qwen" ? "IA" : answer.source}
          </span>
        )}
      </div>

      <p className="text-sm leading-7 text-[#334155]">
        {answer.question || "—"}
      </p>

      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#0F172A] shadow-sm">
        → {answer.label || answer.value || "—"}
      </p>
    </div>
  );
}

function riskPill(level: string) {
  const normalized = String(level || "").toLowerCase();

  if (normalized.includes("critique")) {
    return "border border-red-200/20 bg-red-400/20 text-red-50";
  }

  if (normalized.includes("eleve") || normalized.includes("élevé")) {
    return "border border-orange-200/20 bg-orange-400/20 text-orange-50";
  }

  if (
    normalized.includes("modere") ||
    normalized.includes("modéré") ||
    normalized.includes("moyen")
  ) {
    return "border border-amber-200/20 bg-amber-400/20 text-amber-50";
  }

  return "border border-emerald-200/20 bg-emerald-400/20 text-emerald-50";
}

function riskClassicAccent(level: string) {
  const normalized = String(level || "").toLowerCase();

  if (normalized.includes("critique")) {
    return "bg-[#FEF2F2] text-[#B91C1C]";
  }

  if (normalized.includes("eleve") || normalized.includes("élevé")) {
    return "bg-[#FFF7ED] text-[#C2410C]";
  }

  if (
    normalized.includes("modere") ||
    normalized.includes("modéré") ||
    normalized.includes("moyen")
  ) {
    return "bg-[#FFFBEB] text-[#B45309]";
  }

  return "bg-[#ECFDF5] text-[#047857]";
}

function mapOrientationLabel(type: string) {
  switch (type) {
    case "urgent_care":
      return "Prise en charge urgente";
    case "professional_support":
      return "Accompagnement professionnel";
    case "guided_support":
      return "Accompagnement guidé";
    case "self_support":
      return "Auto-soutien";
    default:
      return type || "—";
  }
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}