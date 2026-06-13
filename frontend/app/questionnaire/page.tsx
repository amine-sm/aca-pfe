"use client";

import Image from "next/image";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  type QwenAnswer,
  type QwenNlp,
  type QwenProfile,
  type QwenQuestion,
  finishQwenOnboarding,
  generateQwenQuestions,
} from "@/lib/qwenOnboardingApi";

type Step =
  | "intro"
  | "writing"
  | "waiting"
  | "questions"
  | "finalizing"
  | "result";

const WAITING_MESSAGES = [
  "Veuillez patienter…",
  "Lecture de votre message…",
  "Compréhension de votre situation…",
  "Préparation des questions personnalisées…",
];

const FINALIZING_MESSAGES = [
  "Veuillez patienter…",
  "Enregistrement de vos réponses…",
  "Création de votre profil…",
  "Préparation de vos recommandations…",
];

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (step !== "writing") {
      return;
    }

    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [step]);

  function handleStart() {
    setError("");
    setStep("writing");
  }

  async function handleSubmitText() {
    if (submittingRef.current) {
      return;
    }

    if (freeText.trim().length < 10) {
      setError(
        "Écrivez au moins quelques phrases pour que nous puissions vous aider.",
      );
      return;
    }

    submittingRef.current = true;
    setError("");
    setStep("waiting");

    try {
      const data = await generateQwenQuestions({
        free_text: freeText.trim(),
        nb_questions: 10,
      });

      if (
        !data.success ||
        !data.questions ||
        data.questions.length === 0
      ) {
        throw new Error(
          "Les questions n’ont pas pu être préparées.",
        );
      }

      setQuestions(data.questions);
      setNlp(data.nlp ?? null);
      setCurrentIndex(0);
      setAnswers([]);

      window.setTimeout(() => {
        setStep("questions");
        submittingRef.current = false;
      }, 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la préparation.";

      setError(message);
      setStep("writing");
      submittingRef.current = false;
    }
  }

  async function handleAnswer(option: {
    value: string;
    label: string;
    severity: "low" | "medium" | "high";
  }) {
    if (submittingRef.current) {
      return;
    }

    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
      return;
    }

    const newAnswer: QwenAnswer = {
      question_id: currentQuestion.id,
      title: currentQuestion.title,
      question: currentQuestion.question,
      value: option.value,
      label: option.label,
      severity: option.severity,
    };

    const updatedAnswers = [...answers, newAnswer];

    setAnswers(updatedAnswers);

    if (currentIndex < questions.length - 1) {
      window.setTimeout(() => {
        setCurrentIndex((previousIndex) => previousIndex + 1);
      }, 200);

      return;
    }

    submittingRef.current = true;
    setStep("finalizing");

    try {
      const result = await finishQwenOnboarding({
        free_text: freeText.trim(),
        answers: updatedAnswers,
      });

      setProfile(result.profile);
      setStep("result");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la finalisation.";

      setError(message);
      setStep("questions");
    } finally {
      submittingRef.current = false;
    }
  }

  function handleGoBack() {
    if (currentIndex <= 0) {
      return;
    }

    setCurrentIndex((previousIndex) => previousIndex - 1);
    setAnswers((previousAnswers) =>
      previousAnswers.slice(0, -1),
    );
  }

  if (authLoading) {
    return (
      <main
        suppressHydrationWarning
        className="flex min-h-screen items-center justify-center bg-[#F7FAFB] px-4 pt-20"
      >
        <PatientLoader
          title="Veuillez patienter…"
          messages={[
            "Ouverture de votre espace sécurisé…",
            "Chargement de votre parcours…",
          ]}
        />
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#F7FAFB] text-slate-900"
      style={{ paddingTop: "80px" }}
    >
      <BackgroundDecor />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <StepIntro
              key="intro"
              onStart={handleStart}
            />
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

          {step === "waiting" && (
            <PatientLoader
              key="waiting"
              title="Veuillez patienter…"
              messages={WAITING_MESSAGES}
            />
          )}

          {step === "questions" &&
            questions[currentIndex] && (
              <StepQuestion
                key={`question-${currentIndex}`}
                question={questions[currentIndex]}
                index={currentIndex}
                total={questions.length}
                nlp={nlp}
                onAnswer={handleAnswer}
                onBack={
                  currentIndex > 0
                    ? handleGoBack
                    : undefined
                }
              />
            )}

          {step === "finalizing" && (
            <PatientLoader
              key="finalizing"
              title="Veuillez patienter…"
              messages={FINALIZING_MESSAGES}
            />
          )}

          {step === "result" && profile && (
            <StepResult
              key="result"
              profile={profile}
              onGoToChat={() => router.push("/chat")}
              onGoToDashboard={() =>
                router.push("/dashboard")
              }
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -top-32 left-1/4 h-[480px] w-[480px] rounded-full bg-teal-100/70 blur-3xl" />

      <div className="absolute right-[-100px] top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-100/70 blur-3xl" />

      <div className="absolute bottom-[-100px] left-[-80px] h-[360px] w-[360px] rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </div>
  );
}

function StepIntro({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      className="overflow-hidden rounded-[30px] border border-slate-200 bg-white p-8 shadow-xl shadow-teal-900/10 md:p-12"
    >
      <div className="text-center">
        <BrandLogo large />

        <p className="mt-5 text-sm font-black uppercase tracking-[0.17em] text-[#1B4F59]">
          EL MOUSANID AI
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Bienvenue dans votre espace
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500">
          Pour vous accompagner au mieux, commençons par faire
          connaissance. Exprimez librement ce que vous traversez.
          Des questions adaptées à votre situation vous seront
          ensuite proposées.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
        <FeaturePill
          icon={<MessageCircle size={14} />}
          text="Texte libre"
        />

        <FeaturePill
          icon={<Sparkles size={14} />}
          text="Parcours personnalisé"
        />

        <FeaturePill
          icon={<ShieldCheck size={14} />}
          text="100 % privé"
        />
      </div>

      <div className="mt-8 flex justify-center">
        <motion.button
          type="button"
          whileHover={{
            y: -2,
          }}
          whileTap={{
            scale: 0.97,
          }}
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153F47]"
        >
          Commencer
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </motion.section>
  );
}

function FeaturePill({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
      <span className="text-[#1B4F59]">
        {icon}
      </span>

      {text}
    </div>
  );
}

function StepWriting({
  freeText,
  setFreeText,
  error,
  onSubmit,
  textareaRef,
}: {
  freeText: string;
  setFreeText: (value: string) => void;
  error: string;
  onSubmit: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const characterCount = freeText.length;
  const isValid = freeText.trim().length >= 10;

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-xl shadow-teal-900/10 md:p-10"
    >
      <div className="mb-7 flex items-center gap-4">
        <BrandLogo />

        <div>
          <p className="text-sm font-black text-[#1B4F59]">
            EL MOUSANID AI
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Accompagnement confidentiel
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#1B4F59]">
        <Sparkles size={13} />
        Étape 1 : Comment vous sentez-vous ?
      </div>

      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
        Exprimez-vous librement
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Décrivez ce que vous ressentez en ce moment, ce qui vous
        préoccupe ou ce qui vous amène ici. Des questions
        personnalisées seront préparées à partir de votre message.
      </p>

      <div className="relative mt-6">
        <textarea
          ref={textareaRef}
          value={freeText}
          onChange={(event) => {
            setFreeText(event.target.value);
          }}
          placeholder="Par exemple : Je me sens stressé en ce moment, j’ai du mal à dormir et j’ai peur de rechuter. Je me sens un peu seul..."
          rows={7}
          className="w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-[15px] leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100"
        />

        <div className="mt-2 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} />
            Vos mots restent confidentiels
          </span>

          <span>
            {characterCount} caractères
          </span>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-7 flex justify-end">
        <motion.button
          type="button"
          whileHover={
            isValid
              ? {
                  y: -2,
                }
              : undefined
          }
          whileTap={
            isValid
              ? {
                  scale: 0.97,
                }
              : undefined
          }
          disabled={!isValid}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4F59] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153F47] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuer
          <Send size={16} />
        </motion.button>
      </div>
    </motion.section>
  );
}

function PatientLoader({
  title,
  messages,
}: {
  title: string;
  messages: string[];
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((previousIndex) =>
        (previousIndex + 1) % messages.length,
      );
    }, 1200);

    return () => {
      window.clearInterval(interval);
    };
  }, [messages]);

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
      }}
      className="flex w-full flex-col items-center justify-center rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-teal-900/10 md:p-16"
    >
      <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.25, 0.08, 0.25],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-300 to-cyan-300 blur-2xl"
        />

        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-3 rounded-full border-2 border-dashed border-[#1B4F59]/25"
        />

        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-7 rounded-full border border-dashed border-teal-400/40"
        />

        <motion.div
          animate={{
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 flex h-28 w-28 items-center justify-center overflow-hidden rounded-[30px] border border-slate-200 bg-white p-3 shadow-2xl shadow-teal-900/20"
        >
          <Image
            src="/logo.png"
            alt="Logo EL MOUSANID AI"
            width={112}
            height={112}
            priority
            className="h-full w-full object-contain"
          />
        </motion.div>
      </div>

      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#1B4F59]">
        EL MOUSANID AI
      </p>

      <h2 className="mt-3 text-xl font-black text-slate-900 md:text-2xl">
        {title}
      </h2>

      <AnimatePresence mode="wait">
        <motion.p
          key={`${messageIndex}-${messages[messageIndex]}`}
          initial={{
            opacity: 0,
            y: 6,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -6,
          }}
          transition={{
            duration: 0.3,
          }}
          className="mt-3 min-h-6 text-sm font-semibold text-slate-500"
        >
          {messages[messageIndex] ?? "Veuillez patienter…"}
        </motion.p>
      </AnimatePresence>

      <div className="mt-7 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
        <motion.div
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 1.7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#1B4F59] to-transparent"
        />
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-400">
        Ne fermez pas cette page.
      </p>
    </motion.section>
  );
}

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
  onAnswer: (option: {
    value: string;
    label: string;
    severity: "low" | "medium" | "high";
  }) => void;
  onBack?: () => void;
}) {
  const progressPercentage = Math.round(
    ((index + 1) / total) * 100,
  );

  return (
    <motion.section
      key={question.id}
      initial={{
        opacity: 0,
        x: 30,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: -30,
      }}
      transition={{
        duration: 0.3,
      }}
      className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-xl shadow-teal-900/10 md:p-10"
    >
      <div className="mb-7 flex items-center gap-3">
        <BrandLogo />

        <div>
          <p className="text-sm font-black text-[#1B4F59]">
            EL MOUSANID AI
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Questionnaire personnalisé
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>
            Question {index + 1} sur {total}
          </span>

          <span>
            {progressPercentage} %
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{
              width: `${(index / total) * 100}%`,
            }}
            animate={{
              width: `${progressPercentage}%`,
            }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="h-full rounded-full bg-gradient-to-r from-[#1B4F59] to-teal-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
          <Sparkles size={12} />
          Question personnalisée
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#1B4F59]">
          <MessageCircle size={12} />
          {question.title}
        </span>
      </div>

      <h2 className="mt-5 text-xl font-black leading-snug text-slate-900 md:text-2xl">
        {question.question}
      </h2>

      <div className="mt-7 grid gap-3">
        {question.options.map((option, optionIndex) => {
          const severityClass =
            option.severity === "high"
              ? "border-red-200 hover:border-red-400 hover:bg-red-50/40"
              : option.severity === "medium"
                ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50/40"
                : "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40";

          return (
            <motion.button
              type="button"
              key={option.value}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.25,
                delay: optionIndex * 0.05,
              }}
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={() => {
                onAnswer(option);
              }}
              className={`group flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-5 py-4 text-left text-[15px] font-semibold text-slate-900 shadow-sm transition ${severityClass}`}
            >
              <span>{option.label}</span>

              <ChevronRight
                size={18}
                className="shrink-0 text-slate-400 transition group-hover:translate-x-1"
              />
            </motion.button>
          );
        })}
      </div>

      {nlp?.top_emotions &&
        nlp.top_emotions.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-500">
              <Activity size={13} />
              Émotions présentes dans votre message
            </div>

            <div className="flex flex-wrap gap-2">
              {nlp.top_emotions
                .slice(0, 3)
                .map((emotion) => (
                  <span
                    key={emotion}
                    className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-sm"
                  >
                    {emotion}
                  </span>
                ))}
            </div>
          </div>
        )}

      {onBack && (
        <div className="mt-6 flex justify-start">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-[#1B4F59]"
          >
            <ArrowLeft size={14} />
            Question précédente
          </button>
        </div>
      )}
    </motion.section>
  );
}

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
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
      }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] p-7 text-white shadow-2xl shadow-teal-900/30 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/20 bg-white p-2 shadow-xl">
              <Image
                src="/logo.png"
                alt="Logo EL MOUSANID AI"
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-xl font-black text-white">
                EL MOUSANID AI
              </p>

              <p className="mt-1 text-sm font-semibold text-teal-100/80">
                Accompagnement personnalisé
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
            <CheckCircle2 size={13} />
            Profil créé
          </span>

          <h2 className="mt-5 text-2xl font-black tracking-tight md:text-3xl">
            Votre accompagnement personnalisé
          </h2>

          <p className="mt-3 max-w-2xl text-base leading-7 text-teal-50/85">
            Merci pour votre confiance. Voici les recommandations
            adaptées à votre situation.
          </p>
        </div>
      </div>

      {profile.orientation && (
        <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59]">
              <Stethoscope size={22} />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-900">
                {profile.orientation.title}
              </h3>

              <p className="mt-1.5 text-sm leading-7 text-slate-500">
                {profile.orientation.message}
              </p>

              {profile.orientation.actions &&
                profile.orientation.actions.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {profile.orientation.actions.map(
                      (action, index) => (
                        <li
                          key={`${action}-${index}`}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-[#1B4F59]"
                          />

                          <span>{action}</span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
            </div>
          </div>
        </div>
      )}

      {profile.recommendations &&
        profile.recommendations.length > 0 && (
          <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Lightbulb
                size={18}
                className="text-amber-500"
              />

              <h3 className="text-lg font-black text-slate-900">
                Suggestions pour vous
              </h3>
            </div>

            <div className="grid gap-3">
              {profile.recommendations.map(
                (recommendation, index) => (
                  <div
                    key={`${recommendation}-${index}`}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#1B4F59]">
                      <span className="text-xs font-black">
                        {index + 1}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-slate-700">
                      {recommendation}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onGoToDashboard}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:text-[#1B4F59]"
        >
          Mon espace
        </button>

        <motion.button
          type="button"
          whileHover={{
            y: -2,
          }}
          whileTap={{
            scale: 0.97,
          }}
          onClick={onGoToChat}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153F47]"
        >
          <MessageCircle size={16} />
          Commencer la conversation
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </motion.section>
  );
}

function BrandLogo({
  large = false,
}: {
  large?: boolean;
}) {
  return (
    <motion.div
      animate={
        large
          ? {
              scale: [1, 1.04, 1],
            }
          : undefined
      }
      transition={
        large
          ? {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white shadow-xl shadow-teal-900/10",
        large
          ? "mx-auto h-24 w-24 rounded-[28px] p-2"
          : "h-14 w-14 rounded-2xl p-1.5",
      ].join(" ")}
    >
      <Image
        src="/logo.png"
        alt="Logo EL MOUSANID AI"
        width={large ? 96 : 56}
        height={large ? 96 : 56}
        priority={large}
        className="h-full w-full object-contain"
      />
    </motion.div>
  );
}