"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Brain,
  HeartPulse,
  MessageCircle,
  Activity,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Lightbulb,
  Stethoscope,
  HandHeart,
  AlertTriangle,
} from "lucide-react";

import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  QwenAnswer,
  QwenNlp,
  QwenProfile,
  QwenQuestion,
  finishQwenOnboarding,
  generateQwenQuestions,
} from "@/lib/qwenOnboardingApi";

type Step = "intro" | "writing" | "analyzing" | "questions" | "computing" | "result";

export default function QwenOnboardingPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuthGuard(["USER"]);

  const [step, setStep] = useState<Step>("intro");
  const [freeText, setFreeText] = useState("");
  const [questions, setQuestions] = useState<QwenQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QwenAnswer[]>([]);
  const [nlp, setNlp] = useState<QwenNlp | null>(null);
  const [profile, setProfile] = useState<QwenProfile | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (step === "writing") {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [step]);

  // ============================================
  // Étape 1 : démarre, va à writing
  // ============================================
  function handleStart() {
    setStep("writing");
  }

  // ============================================
  // Étape 2 : envoie le texte à Qwen
  // ============================================
  async function handleSubmitText() {
    if (submittingRef.current) return;
    if (freeText.trim().length < 10) {
      setError("Écrivez au moins quelques phrases pour qu'on puisse vous aider.");
      return;
    }

    submittingRef.current = true;
    setError("");
    setStep("analyzing");

    try {
      const data = await generateQwenQuestions({
        free_text: freeText.trim(),
        nb_questions: 10,
      });

      if (!data.success || !data.questions || data.questions.length === 0) {
        throw new Error("L'IA n'a pas pu générer les questions.");
      }

      setQuestions(data.questions);
      setNlp(data.nlp);
      setCurrentIndex(0);
      setAnswers([]);

      // Petite pause pour montrer l'écran d'analyse
      setTimeout(() => {
        setStep("questions");
        submittingRef.current = false;
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erreur de génération");
      setStep("writing");
      submittingRef.current = false;
    }
  }

  // ============================================
  // Étape 3 : enregistre une réponse, avance
  // ============================================
  async function handleAnswer(opt: { value: string; label: string; severity: "low" | "medium" | "high" }) {
    if (submittingRef.current) return;
    const q = questions[currentIndex];
    if (!q) return;

    const newAnswer: QwenAnswer = {
      question_id: q.id,
      title: q.title,
      question: q.question,
      value: opt.value,
      label: opt.label,
      severity: opt.severity,
    };

    const updated = [...answers, newAnswer];
    setAnswers(updated);

    // Question suivante OU finalisation
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
    } else {
      submittingRef.current = true;
      setStep("computing");
      try {
        const result = await finishQwenOnboarding({
          free_text: freeText,
          answers: updated,
        });
        setProfile(result.profile);
        setStep("result");
      } catch (err: any) {
        setError(err.message || "Erreur de finalisation");
        setStep("questions");
      } finally {
        submittingRef.current = false;
      }
    }
  }

  function handleGoBack() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnswers(answers.slice(0, -1));
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] pt-20">
        <Loader2 className="animate-spin text-[#1B4F59] dark:text-teal-400" size={28} />
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-50/50 via-cyan-50/40 to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      style={{ paddingTop: "80px" }}
    >
      {/* Halos décoratifs */}
      <BackgroundDecor />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <StepIntro key="intro" onStart={handleStart} />
          )}

          {step === "writing" && (
            <StepWriting
              key="writing"
              freeText={freeText}
              setFreeText={setFreeText}
              error={error}
              onSubmit={handleSubmitText}
              textareaRef={textareaRef}
            />
          )}

          {step === "analyzing" && (
            <StepAnalyzing key="analyzing" />
          )}

          {step === "questions" && questions[currentIndex] && (
            <StepQuestion
              key={`q-${currentIndex}`}
              question={questions[currentIndex]}
              index={currentIndex}
              total={questions.length}
              nlp={nlp}
              onAnswer={handleAnswer}
              onBack={currentIndex > 0 ? handleGoBack : undefined}
            />
          )}

          {step === "computing" && <StepComputing key="computing" />}

          {step === "result" && profile && (
            <StepResult
              key="result"
              profile={profile}
              onGoToChat={() => router.push("/chat")}
              onGoToDashboard={() => router.push("/dashboard")}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}


// ============================================
// Décor de fond apaisant
// ============================================
function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/4 h-[480px] w-[480px] rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/10" />
      <div className="absolute top-1/3 right-[-100px] h-[420px] w-[420px] rounded-full bg-sky-200/30 blur-3xl dark:bg-cyan-500/10" />
      <div className="absolute bottom-[-100px] left-[-80px] h-[360px] w-[360px] rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-500/10" />
    </div>
  );
}


// ============================================
// Étape 0 — Intro
// ============================================
function StepIntro({ onStart }: { onStart: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-[30px] border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-xl shadow-teal-900/10 dark:shadow-black/40 md:p-12"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-xl shadow-teal-900/30 dark:from-teal-500 dark:to-teal-600"
      >
        <HeartPulse size={36} />
      </motion.div>

      <h1 className="text-center text-3xl font-black tracking-tight text-[var(--text)] sm:text-4xl">
        Bienvenue dans votre espace
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-base leading-7 text-[var(--muted)]">
        Pour vous accompagner au mieux, commençons par faire connaissance.
        Exprimez librement ce que vous traversez — notre IA vous proposera ensuite
        quelques questions adaptées à votre situation.
      </p>

      <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-3">
        <FeaturePill icon={<MessageCircle size={14} />} text="Texte libre" />
        <FeaturePill icon={<Brain size={14} />} text="IA personnalisée" />
        <FeaturePill icon={<ShieldCheck size={14} />} text="100% privé" />
      </div>

      <div className="mt-8 flex justify-center">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153f47] dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          Commencer
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </motion.section>
  );
}


function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--sidebar)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)]">
      <span className="text-[#1B4F59] dark:text-teal-400">{icon}</span>
      {text}
    </div>
  );
}


// ============================================
// Étape 1 — Writing (le textarea)
// ============================================
function StepWriting({
  freeText,
  setFreeText,
  error,
  onSubmit,
  textareaRef,
}: {
  freeText: string;
  setFreeText: (v: string) => void;
  error: string;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const charCount = freeText.length;
  const isValid = freeText.trim().length >= 10;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-[30px] border border-[var(--border)] bg-[var(--bg-elevated)] p-7 shadow-xl shadow-teal-900/10 dark:shadow-black/40 md:p-10"
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--teal-soft)] px-3 py-1.5 text-xs font-bold text-[#1B4F59] dark:text-teal-300">
        <Sparkles size={13} />
        Étape 1 : Comment vous sentez-vous ?
      </div>

      <h2 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-3xl">
        Exprimez-vous librement
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Décrivez ce que vous ressentez en ce moment, ce qui vous préoccupe, ou ce
        qui vous amène ici. Notre IA va analyser vos mots et vous posera des
        questions personnalisées.
      </p>

      <div className="relative mt-6">
        <textarea
          ref={textareaRef}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Par exemple : Je me sens stressé en ce moment, j'ai du mal à dormir et j'ai peur de rechuter. Je me sens un peu seul..."
          rows={7}
          className="w-full resize-y rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 text-[15px] leading-7 text-[var(--text)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100 dark:focus:border-teal-400 dark:focus:ring-teal-400/20"
        />
        <div className="mt-2 flex items-center justify-between text-xs font-medium text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} /> Vos mots restent confidentiels
          </span>
          <span>{charCount} caractères</span>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-7 flex justify-end">
        <motion.button
          whileHover={isValid ? { y: -2 } : undefined}
          whileTap={isValid ? { scale: 0.97 } : undefined}
          disabled={!isValid}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          Analyser mon message
          <Send size={16} />
        </motion.button>
      </div>
    </motion.section>
  );
}


// ============================================
// Étape 2 — Analyzing (Qwen réfléchit)
// ============================================
function StepAnalyzing() {
  const messages = [
    "Lecture de votre message…",
    "Détection des émotions…",
    "Compréhension de votre situation…",
    "Préparation des questions personnalisées…",
  ];

  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const i = setInterval(() => {
      setMsgIndex((p) => (p + 1) % messages.length);
    }, 1200);
    return () => clearInterval(i);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center rounded-[30px] border border-[var(--border)] bg-[var(--bg-elevated)] p-10 text-center shadow-xl shadow-teal-900/10 dark:shadow-black/40 md:p-16"
    >
      {/* Cercle de respiration animé */}
      <div className="relative mb-8 flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-300 to-cyan-300 blur-2xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-8 rounded-full bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] shadow-xl shadow-teal-900/40 dark:from-teal-500 dark:to-teal-600"
          style={{ boxShadow: "0 0 60px rgba(95, 191, 184, 0.5)" }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-16 rounded-full border-2 border-dashed border-white/40"
        />
        <Brain size={48} className="relative z-10 text-white drop-shadow-lg" />
      </div>

      <h2 className="text-xl font-black text-[var(--text)] md:text-2xl">
        L&apos;IA analyse votre message
      </h2>

      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="mt-3 text-sm font-semibold text-[var(--muted)]"
        >
          {messages[msgIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Barre de progression animée */}
      <div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[var(--border)]">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#1B4F59] to-transparent dark:via-teal-400"
        />
      </div>
    </motion.section>
  );
}


// ============================================
// Étape 3 — Question (1 sur N)
// ============================================
function StepQuestion({
  question,
  index,
  total,
  nlp,
  onAnswer,
  onBack,
}: {
  question: QwenQuestion;
  index: number;
  total: number;
  nlp: QwenNlp | null;
  onAnswer: (opt: { value: string; label: string; severity: "low" | "medium" | "high" }) => void;
  onBack?: () => void;
}) {
  const progressPct = Math.round(((index + 1) / total) * 100);

  return (
    <motion.section
      key={question.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="rounded-[30px] border border-[var(--border)] bg-[var(--bg-elevated)] p-7 shadow-xl shadow-teal-900/10 dark:shadow-black/40 md:p-10"
    >
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[var(--muted)]">
          <span>
            Question {index + 1} sur {total}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
          <motion.div
            initial={{ width: `${(index / total) * 100}%` }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-[#1B4F59] to-teal-500 dark:from-teal-500 dark:to-teal-400"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
          <Sparkles size={12} /> Personnalisée par l&apos;IA
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--teal-soft)] px-3 py-1.5 text-xs font-bold text-[#1B4F59] dark:text-teal-300">
          <Brain size={12} /> {question.title}
        </span>
      </div>

      <h2 className="mt-5 text-xl font-black leading-snug text-[var(--text)] md:text-2xl">
        {question.question}
      </h2>

      <div className="mt-7 grid gap-3">
        {question.options.map((opt, i) => {
          const sevClass =
            opt.severity === "high"
              ? "border-red-200 hover:border-red-400 hover:bg-red-50/40 dark:border-red-500/30 dark:hover:bg-red-500/10"
              : opt.severity === "medium"
              ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50/40 dark:border-amber-500/30 dark:hover:bg-amber-500/10"
              : "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10";

          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAnswer(opt)}
              className={`group flex w-full items-center justify-between gap-3 rounded-2xl border bg-[var(--bg-elevated)] px-5 py-4 text-left text-[15px] font-semibold text-[var(--text)] shadow-sm transition ${sevClass}`}
            >
              <span>{opt.label}</span>
              <ChevronRight
                size={18}
                className="shrink-0 text-[var(--muted-soft)] transition group-hover:translate-x-1"
              />
            </motion.button>
          );
        })}
      </div>

      {nlp && nlp.top_emotions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--sidebar)] p-4 text-xs">
          <div className="mb-2 flex items-center gap-2 font-bold text-[var(--muted)]">
            <Activity size={13} /> Émotions détectées dans votre message
          </div>
          <div className="flex flex-wrap gap-2">
            {nlp.top_emotions.slice(0, 3).map((e) => (
              <span
                key={e}
                className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-1 font-semibold text-[var(--text-secondary)]"
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {onBack && (
        <div className="mt-6 flex justify-start">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--muted)] transition hover:text-[#1B4F59] dark:hover:text-teal-300"
          >
            <ArrowLeft size={14} /> Précédente
          </button>
        </div>
      )}
    </motion.section>
  );
}


// ============================================
// Étape 4 — Computing (calcul profil)
// ============================================
function StepComputing() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center rounded-[30px] border border-[var(--border)] bg-[var(--bg-elevated)] p-14 text-center shadow-xl shadow-teal-900/10 dark:shadow-black/40"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-xl shadow-teal-900/30 dark:from-teal-500 dark:to-teal-600">
        <Loader2 size={30} className="animate-spin" />
      </div>
      <h2 className="text-xl font-black text-[var(--text)]">
        Construction de votre profil…
      </h2>
      <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
        L&apos;IA synthétise vos réponses et prépare vos recommandations personnalisées.
      </p>
    </motion.section>
  );
}


// ============================================
// Étape 5 — Résultat
// ============================================
function StepResult({
  profile,
  onGoToChat,
  onGoToDashboard,
}: {
  profile: QwenProfile;
  onGoToChat: () => void;
  onGoToDashboard: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] p-7 text-white shadow-2xl shadow-teal-900/30 dark:from-teal-600 dark:to-teal-700 md:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
          <CheckCircle2 size={13} /> Profil créé
        </span>
        <h2 className="mt-5 text-2xl font-black tracking-tight md:text-3xl">
          Votre accompagnement personnalisé
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-teal-50/85">
          Merci pour votre confiance. Voici vos recommandations adaptées.
        </p>
      </div>

      {profile.orientation && (
        <div className="rounded-[30px] border border-[var(--border)] bg-[var(--bg-elevated)] p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--teal-soft)] text-[#1B4F59] dark:text-teal-300">
              <Stethoscope size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-[var(--text)]">
                {profile.orientation.title}
              </h3>
              <p className="mt-1.5 text-sm leading-7 text-[var(--muted)]">
                {profile.orientation.message}
              </p>
              <ul className="mt-4 space-y-2">
                {profile.orientation.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#1B4F59] dark:text-teal-400" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {profile.recommendations.length > 0 && (
        <div className="rounded-[30px] border border-[var(--border)] bg-[var(--bg-elevated)] p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-500" />
            <h3 className="text-lg font-black text-[var(--text)]">
              Suggestions pour vous
            </h3>
          </div>
          <div className="grid gap-3">
            {profile.recommendations.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--sidebar)] p-4"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--teal-soft)] text-[#1B4F59] dark:text-teal-300">
                  <span className="text-xs font-black">{i + 1}</span>
                </div>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={onGoToDashboard}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-3 text-sm font-bold text-[var(--text-secondary)] transition hover:border-teal-300 hover:text-[#1B4F59] dark:hover:text-teal-300"
        >
          Mon espace
        </button>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onGoToChat}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153f47] dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          <MessageCircle size={16} /> Commencer la conversation
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </motion.section>
  );
}
