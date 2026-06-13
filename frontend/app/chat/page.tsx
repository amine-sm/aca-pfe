"use client";

import Image from "next/image";
import {
  Suspense,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  HeartPulse,
  Lightbulb,
  Loader2,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";

import { useAuthGuard } from "../hooks/useAuthGuard";
import { useStreamingText } from "../hooks/useStreamingText";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

import {
  deleteConversation,
  getConversationById,
  getMyConversations,
  startConversation,
} from "@/lib/conversationsApi";

import { smartChat } from "@/lib/smartChatApi";

import type {
  EmergencyInfo,
  LanguageInfo,
  PipelineUsed,
  SmartAnalysis,
} from "@/lib/smartChatApi";

import { CrisisModal } from "../components/chat/CrisisModal";

/* =========================================================
   TYPES
========================================================= */

interface ChatMessage {
  id?: number | string;
  sender_type: "user" | "assistant";
  message_text: string;
  _justArrived?: boolean;
  language?: LanguageInfo;
  analysis?: SmartAnalysis;
  pipeline?: PipelineUsed;
  is_crisis?: boolean;
}

interface ConversationSummary {
  id: number;
  title?: string;
  started_at?: string;
  last_message?: string;
}

interface NlpInformation {
  sentiment?: string;
  emotion?: string;
  intent?: string;
  riskScore?: number;
  riskLevel?: string;
  emotionalState?: string;
  detected_language?: string;
  pipeline_used?: string;
  addiction_type?: string;
}

interface Diagnostic {
  priority?: string;
  orientation?: string;
  diagnosticSummary?: string;
}

interface Therapy {
  message?: string;
}

type SelectedPipeline =
  | "auto"
  | "dziribert"
  | "classic_nlp";

/* =========================================================
   SUGGESTIONS
========================================================= */

const SUGGESTIONS: Array<{
  icon: React.ElementType;
  title: string;
  prompt: string;
}> = [
  {
    icon: HeartPulse,
    title: "Je me sens stressé aujourd’hui",
    prompt:
      "Je me sens vraiment stressé aujourd’hui et j’ai du mal à me calmer. Pouvez-vous m’aider ?",
  },
  {
    icon: AlertTriangle,
    title: "Rani t3ban bzaf",
    prompt:
      "Rani t3ban bzaf wa habit nhder m3a chkoun.",
  },
  {
    icon: Brain,
    title: "Comprendre mes émotions",
    prompt:
      "Je n’arrive pas à comprendre ce que je ressens en ce moment.",
  },
  {
    icon: Lightbulb,
    title: "Conseils pour avancer",
    prompt:
      "Quelles sont les premières étapes concrètes que je peux mettre en place ?",
  },
];

/* =========================================================
   PAGE PRINCIPALE
========================================================= */

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingState />}>
      <ChatInner />
    </Suspense>
  );
}

/* =========================================================
   CHARGEMENT AVEC LOGO
========================================================= */

function ChatLoadingState() {
  return (
    <main
      suppressHydrationWarning
      className="flex min-h-screen items-center justify-center bg-[#F7FAFB] px-4"
    >
      <PatientLoader />
    </main>
  );
}

function PatientLoader() {
  const messages = [
    "Ouverture de votre espace sécurisé…",
    "Chargement de vos conversations…",
    "Préparation de votre assistant…",
    "Presque terminé…",
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex(
        (previousIndex) =>
          (previousIndex + 1) % messages.length,
      );
    }, 1200);

    return () => {
      window.clearInterval(interval);
    };
  }, [messages.length]);

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
      className="flex w-full max-w-md flex-col items-center rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-2xl shadow-teal-900/10"
    >
      <div className="relative mb-7 flex h-48 w-48 items-center justify-center">
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
          className="absolute inset-3 rounded-full border-2 border-dashed border-[#1B4F59]/30"
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
          className="absolute inset-7 rounded-full border border-dashed border-teal-400/50"
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

      <h1 className="mt-3 text-2xl font-black text-slate-900">
        Veuillez patienter…
      </h1>

      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
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
          className="mt-3 min-h-6 text-sm font-semibold text-slate-500"
        >
          {messages[messageIndex]}
        </motion.p>
      </AnimatePresence>

      <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-slate-200">
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
    </motion.div>
  );
}

/* =========================================================
   CONTENU DU CHAT
========================================================= */

function ChatInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialId = params.get("conversation");

  const { loading } = useAuthGuard(["USER"]);

  const [conversationId, setConversationId] =
    useState<number | null>(
      initialId ? Number(initialId) : null,
    );

  const [conversations, setConversations] = useState<
    ConversationSummary[]
  >([]);

  const [loadingConversations, setLoadingConversations] =
    useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");

  const [nlp, setNlp] =
    useState<NlpInformation | null>(null);

  const [diagnostic, setDiagnostic] =
    useState<Diagnostic | null>(null);

  const [therapy, setTherapy] =
    useState<Therapy | null>(null);

  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [showInformation, setShowInformation] =
    useState(false);

  const [crisisModalOpen, setCrisisModalOpen] =
    useState(false);

  const [crisisEmergencyInfo, setCrisisEmergencyInfo] =
    useState<EmergencyInfo | null>(null);

  const [chatBlocked, setChatBlocked] = useState(false);

  const [selectedPipeline, setSelectedPipeline] =
    useState<SelectedPipeline>("auto");

  const [pipelineMenuOpen, setPipelineMenuOpen] =
    useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  /* Ajustement automatique du textarea */
  useEffect(() => {
    const element = textareaRef.current;

    if (!element) {
      return;
    }

    element.style.height = "auto";
    element.style.height = `${Math.min(
      element.scrollHeight,
      200,
    )}px`;
  }, [text]);

  /* Chargement initial */
  useEffect(() => {
    if (loading) {
      return;
    }

    void loadConversations();

    if (conversationId) {
      void loadConversation(conversationId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /* Défilement automatique */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending]);

  /* Chargement des conversations */
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);

    try {
      const data: any = await getMyConversations();

      setConversations(data?.conversations ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Chargement impossible.";

      console.warn(
        "Impossible de charger les conversations :",
        message,
      );
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  /* Chargement d’une conversation */
  const loadConversation = useCallback(
    async (id: number) => {
      try {
        const data: any =
          await getConversationById(id);

        const loadedMessages: ChatMessage[] = (
          data?.messages ?? []
        ).map((message: ChatMessage) => ({
          ...message,
          _justArrived: false,
        }));

        setMessages(loadedMessages);
        setNlp(null);
        setDiagnostic(null);
        setTherapy(null);
        setChatBlocked(false);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur pendant le chargement.",
        );
      }
    },
    [],
  );

  /* Nouvelle conversation */
  async function handleNewConversation() {
    try {
      setError("");

      const data: any = await startConversation({
        title: "Nouvelle conversation",
      });

      const newId =
        data?.conversation_id ||
        data?.conversation?.id;

      if (!newId) {
        throw new Error(
          "Impossible de créer la conversation.",
        );
      }

      setConversationId(newId);
      setMessages([]);
      setNlp(null);
      setDiagnostic(null);
      setTherapy(null);
      setChatBlocked(false);
      setMobileSidebarOpen(false);

      router.replace(
        `/chat?conversation=${newId}`,
      );

      void loadConversations();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur pendant la création.",
      );
    }
  }

  /* Sélection d’une conversation */
  async function handleSelectConversation(id: number) {
    if (id === conversationId) {
      setMobileSidebarOpen(false);
      return;
    }

    setConversationId(id);
    setMessages([]);
    setChatBlocked(false);
    setMobileSidebarOpen(false);

    router.replace(`/chat?conversation=${id}`);

    await loadConversation(id);
  }

  /* Suppression */
  async function handleDeleteConversation(
    id: number,
    event: React.MouseEvent,
  ) {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Voulez-vous supprimer cette conversation ?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteConversation(id);

      setConversations((previousConversations) =>
        previousConversations.filter(
          (conversation) => conversation.id !== id,
        ),
      );

      if (id === conversationId) {
        setConversationId(null);
        setMessages([]);
        router.replace("/chat");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur pendant la suppression.",
      );
    }
  }

  /* Envoi du message */
  async function handleSend(
    event?: React.FormEvent,
  ) {
    event?.preventDefault();

    if (!text.trim() || sending || chatBlocked) {
      return;
    }

    const messageText = text.trim();

    setText("");
    setError("");

    let currentConversationId = conversationId;

    if (!currentConversationId) {
      try {
        const data: any =
          await startConversation({
            title: messageText.slice(0, 40),
          });

        currentConversationId =
          data?.conversation_id ||
          data?.conversation?.id;

        if (!currentConversationId) {
          throw new Error(
            "Création de la conversation impossible.",
          );
        }

        setConversationId(currentConversationId);

        router.replace(
          `/chat?conversation=${currentConversationId}`,
        );
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur pendant la création.",
        );

        return;
      }
    }

    setSending(true);

    const userMessageIndex = messages.length;

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        sender_type: "user",
        message_text: messageText,
        _justArrived: false,
      },
    ]);

    try {
      const response = await smartChat({
        message: messageText,
        conversation_id:
          currentConversationId || undefined,
        country: "DZ",
        force_pipeline:
          selectedPipeline === "auto"
            ? null
            : selectedPipeline,
      });

      if (response.is_crisis) {
        setMessages((previousMessages) =>
          previousMessages.map(
            (message, index) =>
              index === userMessageIndex
                ? {
                    ...message,
                    is_crisis: true,
                    language: response.language,
                    pipeline:
                      response.pipeline_used,
                  }
                : message,
          ),
        );

        setMessages((previousMessages) => [
          ...previousMessages,
          {
            sender_type: "assistant",
            message_text:
              response.response_text,
            is_crisis: true,
            _justArrived: true,
          },
        ]);

        if (response.emergency_info) {
          setCrisisEmergencyInfo(
            response.emergency_info,
          );

          setCrisisModalOpen(true);
        }

        setChatBlocked(true);

        setNlp({
          sentiment: "négatif",
          emotion: "détresse",
          riskLevel: "Élevé",
          riskScore: Math.round(
            (response.analysis?.crisis
              ?.confidence || 0.9) * 100,
          ),
          emotionalState:
            "Situation urgente détectée",
          detected_language:
            response.language?.language,
          pipeline_used:
            response.pipeline_used,
        });

        setDiagnostic({
          priority: "URGENT",
          orientation:
            "Contact professionnel immédiat",
          diagnosticSummary:
            "Une situation urgente a été détectée.",
        });
      } else {
        setMessages((previousMessages) =>
          previousMessages.map(
            (message, index) =>
              index === userMessageIndex
                ? {
                    ...message,
                    language: response.language,
                    analysis:
                      response.analysis,
                    pipeline:
                      response.pipeline_used,
                  }
                : message,
          ),
        );

        setMessages((previousMessages) => [
          ...previousMessages,
          {
            sender_type: "assistant",
            message_text:
              response.response_text,
            _justArrived: true,
          },
        ]);

        const information = response.analysis;

        setNlp({
          sentiment:
            information?.sentiment?.label ||
            "neutre",

          emotion:
            information?.emotions?.top ||
            information?.addiction_type?.label ||
            "—",

          intent: information?.intent,

          riskScore: Math.round(
            (information?.crisis?.confidence ||
              0) * 100,
          ),

          riskLevel:
            getRiskLevelFromSeverity(
              information?.crisis?.severity,
            ),

          emotionalState:
            information?.sentiment?.label ===
            "negatif"
              ? "État émotionnel difficile"
              : "État stable",

          detected_language:
            response.language?.language,

          pipeline_used:
            response.pipeline_used,

          addiction_type:
            information?.addiction_type?.label,
        });

        setDiagnostic({
          priority:
            information?.crisis?.severity ||
            "low",

          orientation:
            response.pipeline_used ===
            "dziribert"
              ? "Traitement DziriBERT pour la darija et les messages mixtes"
              : "Traitement multilingue pour le français et l’arabe",
        });
      }

      void loadConversations();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur pendant l’envoi du message.",
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void handleSend();
    }
  }

  const hasMessages = messages.length > 0;

  const hasInformation =
    Boolean(nlp) ||
    Boolean(diagnostic) ||
    Boolean(therapy);

  const riskBadge = useMemo(() => {
    if (
      !nlp?.riskLevel ||
      nlp.riskLevel === "unknown"
    ) {
      return null;
    }

    return nlp.riskLevel;
  }, [nlp]);

  if (loading) {
    return <ChatLoadingState />;
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#F7FAFB] text-slate-900"
      style={{
        paddingTop: "80px",
      }}
    >
      <CrisisModal
        isOpen={crisisModalOpen}
        emergencyInfo={crisisEmergencyInfo}
        onClose={() =>
          setCrisisModalOpen(false)
        }
      />

      <div className="relative z-10 flex h-[calc(100vh-80px)] overflow-hidden px-0 lg:px-3 lg:pb-3">
        {/* BARRE LATÉRALE ORDINATEUR */}
        <aside
          className={[
            "hidden h-full shrink-0 border border-slate-200 bg-white shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col",
            sidebarOpen
              ? "w-80 rounded-3xl"
              : "w-0 overflow-hidden border-0",
          ].join(" ")}
        >
          <SidebarContent
            conversations={conversations}
            loadingConversations={
              loadingConversations
            }
            currentId={conversationId}
            onNew={handleNewConversation}
            onSelect={handleSelectConversation}
            onDelete={
              handleDeleteConversation
            }
          />
        </aside>

        {/* BARRE LATÉRALE MOBILE */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                onClick={() =>
                  setMobileSidebarOpen(false)
                }
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                style={{
                  top: "80px",
                }}
              />

              <motion.aside
                initial={{
                  x: "-100%",
                }}
                animate={{
                  x: 0,
                }}
                exit={{
                  x: "-100%",
                }}
                transition={{
                  type: "tween",
                  duration: 0.25,
                }}
                className="fixed left-0 z-50 flex h-[calc(100vh-80px)] w-80 flex-col border-r border-slate-200 bg-white shadow-2xl backdrop-blur-xl lg:hidden"
                style={{
                  top: "80px",
                }}
              >
                <SidebarContent
                  conversations={conversations}
                  loadingConversations={
                    loadingConversations
                  }
                  currentId={conversationId}
                  onNew={
                    handleNewConversation
                  }
                  onSelect={
                    handleSelectConversation
                  }
                  onDelete={
                    handleDeleteConversation
                  }
                  onClose={() =>
                    setMobileSidebarOpen(false)
                  }
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ZONE PRINCIPALE */}
        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent lg:ml-3 lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-xl lg:shadow-black/5 lg:backdrop-blur-xl">
          {/* EN-TÊTE */}
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur-xl md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(
                    (previousValue) =>
                      !previousValue,
                  )
                }
                aria-label="Afficher ou masquer la barre latérale"
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-[#1B4F59] lg:flex"
              >
                {sidebarOpen ? (
                  <PanelLeftClose size={18} />
                ) : (
                  <PanelLeftOpen size={18} />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(true)
                }
                aria-label="Ouvrir les conversations"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-[#1B4F59] lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="flex min-w-0 items-center gap-3">
                <LogoBox size="small" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-black tracking-tight text-slate-900">
                    EL MOUSANID AI
                  </p>

                  <p className="truncate text-[11px] font-medium text-slate-500">
                    Assistant confidentiel et sécurisé
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {riskBadge && (
                <span
                  className={[
                    "hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold sm:inline-flex",
                    riskBadgeClass(riskBadge),
                  ].join(" ")}
                >
                  <Activity size={12} />
                  Risque : {riskBadge}
                </span>
              )}

              {hasInformation && (
                <button
                  type="button"
                  onClick={() =>
                    setShowInformation(
                      (previousValue) =>
                        !previousValue,
                    )
                  }
                  className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:text-[#1B4F59] md:inline-flex"
                >
                  <Brain size={14} />

                  {showInformation
                    ? "Masquer"
                    : "Voir"}{" "}
                  les informations
                </button>
              )}
            </div>
          </header>

          {/* ERREUR */}
          <AnimatePresence>
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
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:mx-6"
              >
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span className="flex-1">
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Fermer le message"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MESSAGES ET INFORMATIONS */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-y-auto">
              {!hasMessages && !sending ? (
                <EmptyState
                  onPick={(prompt) => {
                    setText(prompt);
                    textareaRef.current?.focus();
                  }}
                />
              ) : (
                <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:px-8 md:py-8">
                  <div className="space-y-6">
                    {messages.map(
                      (message, index) => (
                        <MessageBubble
                          key={
                            message.id ?? index
                          }
                          message={message}
                          isLatest={
                            index ===
                              messages.length - 1 &&
                            message.sender_type ===
                              "assistant"
                          }
                        />
                      ),
                    )}

                    {sending && (
                      <TypingIndicator />
                    )}

                    {chatBlocked && (
                      <motion.div
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-center"
                      >
                        <AlertTriangle
                          size={24}
                          className="mx-auto mb-2 text-red-500"
                        />

                        <p className="text-sm font-bold text-red-900">
                          Conversation interrompue pour
                          votre sécurité
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setCrisisModalOpen(true)
                          }
                          className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                        >
                          Voir les numéros d’urgence
                        </button>
                      </motion.div>
                    )}

                    <div ref={bottomRef} />
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showInformation &&
                hasInformation && (
                  <motion.aside
                    initial={{
                      width: 0,
                      opacity: 0,
                    }}
                    animate={{
                      width: 340,
                      opacity: 1,
                    }}
                    exit={{
                      width: 0,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="hidden shrink-0 overflow-hidden border-l border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl md:block"
                  >
                    <InformationPanel
                      nlp={nlp}
                      diagnostic={diagnostic}
                      therapy={therapy}
                      onClose={() =>
                        setShowInformation(false)
                      }
                    />
                  </motion.aside>
                )}
            </AnimatePresence>
          </div>

          {/* ZONE DE SAISIE */}
          <div className="border-t border-slate-200 bg-white/90 px-4 py-4 shadow-[0_-18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:px-6">
            <form
              onSubmit={handleSend}
              className="mx-auto w-full max-w-4xl"
            >
              <div className="group relative overflow-hidden rounded-3xl border border-slate-300 bg-white/95 shadow-2xl shadow-black/5 ring-1 ring-white/40 transition focus-within:border-[#1B4F59] focus-within:shadow-teal-900/10">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(event) =>
                    setText(event.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  disabled={chatBlocked}
                  placeholder={
                    chatBlocked
                      ? "Conversation interrompue"
                      : "Exprimez-vous en darija, français ou arabe…"
                  }
                  rows={1}
                  className="max-h-[220px] min-h-[68px] w-full resize-none bg-transparent px-5 pb-2 pt-4 text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
                />

                <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 px-3 py-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setPipelineMenuOpen(
                          (previousValue) =>
                            !previousValue,
                        )
                      }
                      className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-teal-50/40 px-3.5 py-2 text-xs font-black text-[#1B4F59] shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
                    >
                      {selectedPipeline ===
                        "auto" && (
                        <>
                          <Sparkles size={13} />
                          <span>Automatique</span>
                        </>
                      )}

                      {selectedPipeline ===
                        "dziribert" && (
                        <>
                          <span>🇩🇿</span>
                          <span>DziriBERT</span>
                        </>
                      )}

                      {selectedPipeline ===
                        "classic_nlp" && (
                        <>
                          <span>🌐</span>
                          <span>Multilingue</span>
                        </>
                      )}

                      <ChevronDown
                        size={12}
                        className={[
                          "transition",
                          pipelineMenuOpen
                            ? "rotate-180"
                            : "",
                        ].join(" ")}
                      />
                    </button>

                    <AnimatePresence>
                      {pipelineMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() =>
                              setPipelineMenuOpen(
                                false,
                              )
                            }
                          />

                          <motion.div
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: 8,
                            }}
                            className="absolute bottom-full left-0 z-40 mb-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                          >
                            <PipelineOption
                              icon={
                                <Sparkles
                                  size={16}
                                />
                              }
                              title="Automatique"
                              description="Détection automatique de la langue"
                              active={
                                selectedPipeline ===
                                "auto"
                              }
                              onClick={() => {
                                setSelectedPipeline(
                                  "auto",
                                );

                                setPipelineMenuOpen(
                                  false,
                                );
                              }}
                            />

                            <PipelineOption
                              icon={
                                <span className="text-lg leading-none">
                                  🇩🇿
                                </span>
                              }
                              title="DziriBERT"
                              description="Traitement adapté à la darija algérienne"
                              active={
                                selectedPipeline ===
                                "dziribert"
                              }
                              onClick={() => {
                                setSelectedPipeline(
                                  "dziribert",
                                );

                                setPipelineMenuOpen(
                                  false,
                                );
                              }}
                            />

                            <PipelineOption
                              icon={
                                <span className="text-lg leading-none">
                                  🌐
                                </span>
                              }
                              title="Multilingue"
                              description="Traitement du français et de l’arabe"
                              active={
                                selectedPipeline ===
                                "classic_nlp"
                              }
                              onClick={() => {
                                setSelectedPipeline(
                                  "classic_nlp",
                                );

                                setPipelineMenuOpen(
                                  false,
                                );
                              }}
                            />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={
                      sending ||
                      !text.trim() ||
                      chatBlocked
                    }
                    whileHover={
                      !sending &&
                      text.trim() &&
                      !chatBlocked
                        ? {
                            scale: 1.05,
                          }
                        : undefined
                    }
                    whileTap={
                      !sending &&
                      text.trim() &&
                      !chatBlocked
                        ? {
                            scale: 0.95,
                          }
                        : undefined
                    }
                    aria-label="Envoyer le message"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-lg shadow-teal-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={16} />
                    )}
                  </motion.button>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] font-semibold text-slate-500">
                <ShieldCheck
                  size={11}
                  className="inline-block align-text-bottom"
                />{" "}
                Conversation confidentielle et
                sécurisée
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   CHOIX DU TRAITEMENT
========================================================= */

function PipelineOption({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-teal-50/40",
        active ? "bg-teal-50/60" : "",
      ].join(" ")}
    >
      <div
        className={[
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active
            ? "bg-[#1B4F59] text-white"
            : "bg-white text-slate-700",
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p
            className={[
              "text-sm font-bold",
              active
                ? "text-[#1B4F59]"
                : "text-slate-900",
            ].join(" ")}
          >
            {title}
          </p>

          {active && (
            <Check
              size={14}
              className="text-[#1B4F59]"
            />
          )}
        </div>

        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </button>
  );
}

/* =========================================================
   BARRE LATÉRALE
========================================================= */

function SidebarContent({
  conversations,
  loadingConversations,
  currentId,
  onNew,
  onSelect,
  onDelete,
  onClose,
}: {
  conversations: ConversationSummary[];
  loadingConversations: boolean;
  currentId: number | null;
  onNew: () => void;
  onSelect: (id: number) => void;
  onDelete: (
    id: number,
    event: React.MouseEvent,
  ) => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4">
        <div className="mb-4 flex items-center gap-3 px-1">
          <LogoBox size="small" />

          <div>
            <p className="text-sm font-black text-slate-900">
              EL MOUSANID AI
            </p>

            <p className="text-[11px] font-semibold text-slate-500">
              Conversations sécurisées
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNew}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1B4F59] to-[#2E6F7E] px-3 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:brightness-110"
          >
            <Plus size={16} />
            Nouvelle conversation
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-teal-50 hover:text-[#1B4F59]"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loadingConversations ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#1B4F59]/30"
              />

              <LogoBox size="tiny" />
            </div>

            <p className="text-xs font-bold text-slate-500">
              Veuillez patienter…
            </p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <MessageSquare
              size={32}
              className="mx-auto mb-3 text-slate-400"
            />

            <p className="text-sm font-semibold text-slate-500">
              Aucune conversation
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map(
              (conversation) => {
                const isActive =
                  conversation.id === currentId;

                const title =
                  conversation.title ||
                  `Conversation #${conversation.id}`;

                return (
                  <li key={conversation.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        onSelect(conversation.id)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          onSelect(
                            conversation.id,
                          );
                        }
                      }}
                      className={[
                        "group flex w-full cursor-pointer items-center gap-2 rounded-2xl border px-3 py-3 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F59]",
                        isActive
                          ? "border-[#1B4F59] bg-[#1B4F59] text-white shadow-sm"
                          : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-teal-50/45",
                      ].join(" ")}
                    >
                      <MessageSquare
                        size={15}
                        className="shrink-0 opacity-80"
                      />

                      <span className="flex-1 truncate text-sm font-semibold">
                        {title}
                      </span>

                      <button
                        type="button"
                        onClick={(event) =>
                          onDelete(
                            conversation.id,
                            event,
                          )
                        }
                        aria-label="Supprimer"
                        className={[
                          "shrink-0 rounded p-1 opacity-0 transition group-hover:opacity-100",
                          isActive
                            ? "text-white/70 hover:bg-white/15 hover:text-white"
                            : "text-slate-400 hover:bg-red-100 hover:text-red-600",
                        ].join(" ")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                );
              },
            )}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-xs">
          <ShieldCheck
            size={14}
            className="text-[#1B4F59]"
          />

          <span className="font-semibold text-slate-700">
            Espace confidentiel
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ÉCRAN VIDE
========================================================= */

function EmptyState({
  onPick,
}: {
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="mx-auto w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white/80 p-6 text-center shadow-2xl shadow-black/5 backdrop-blur-xl md:p-10"
      >
        <div className="mx-auto mb-5 flex justify-center">
          <LogoBox size="large" />
        </div>

        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#1B4F59]">
          EL MOUSANID AI
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-900 md:text-4xl">
          Bonjour, comment allez-vous
          aujourd’hui&nbsp;?
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
          Exprimez-vous librement en darija, en
          français ou en arabe. Votre message reste
          confidentiel.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
            🇩🇿 Darija
          </span>

          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
            🇫🇷 Français
          </span>

          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            العربية
          </span>

          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
            🛡️ Protection renforcée
          </span>
        </div>

        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map(
            (suggestion, index) => {
              const Icon = suggestion.icon;

              return (
                <motion.button
                  type="button"
                  key={suggestion.title}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.3,
                    delay:
                      0.1 + index * 0.05,
                  }}
                  whileHover={{
                    y: -2,
                  }}
                  onClick={() =>
                    onPick(suggestion.prompt)
                  }
                  className="group flex items-start gap-3 rounded-3xl border border-slate-200 bg-white/85 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-900/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#1B4F59] transition group-hover:scale-110">
                    <Icon size={17} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {suggestion.title}
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {suggestion.prompt}
                    </p>
                  </div>

                  <ChevronRight
                    size={16}
                    className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#1B4F59]"
                  />
                </motion.button>
              );
            },
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================
   MESSAGE
========================================================= */

function MessageBubble({
  message,
  isLatest,
}: {
  message: ChatMessage;
  isLatest: boolean;
}) {
  const isUser =
    message.sender_type === "user";

  const shouldStream =
    !isUser &&
    isLatest &&
    message._justArrived === true;

  const { displayed, isStreaming } =
    useStreamingText(
      message.message_text || "",
      shouldStream,
      8,
      3,
    );

  if (isUser) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className="flex flex-col items-end gap-1"
      >
        <div className="flex items-start justify-end gap-3">
          <div
            className={[
              "max-w-[78%] rounded-3xl rounded-br-lg px-4 py-3 text-[15px] font-semibold leading-7 shadow-lg shadow-black/5",
              message.is_crisis
                ? "bg-gradient-to-br from-red-500 to-rose-500 text-white"
                : "bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white",
            ].join(" ")}
          >
            <div className="whitespace-pre-wrap break-words">
              {message.message_text}
            </div>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59] ring-1 ring-slate-200">
            <User size={15} />
          </div>
        </div>

        {(message.language ||
          message.pipeline) && (
          <div className="pr-11">
            <MessageInformationBadge
              language={message.language}
              pipeline={message.pipeline}
            />
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.2,
      }}
      className="flex items-start gap-3"
    >
      <LogoBox size="tiny" />

      <div
        className={[
          "max-w-[88%] rounded-3xl rounded-tl-lg px-4 py-3 shadow-lg shadow-black/5",
          message.is_crisis
            ? "border-2 border-red-300 bg-red-50 text-red-900"
            : "border border-slate-200 bg-white text-slate-800 ring-1 ring-white/40",
        ].join(" ")}
      >
        {message.is_crisis && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-700">
            <AlertTriangle size={10} />
            Support d’urgence
          </div>
        )}

        <MarkdownRenderer
          content={displayed}
        />

        {isStreaming && (
          <span className="streaming-caret" />
        )}
      </div>
    </motion.div>
  );
}

/* =========================================================
   INFORMATIONS DU MESSAGE
========================================================= */

function MessageInformationBadge({
  language,
  pipeline,
}: {
  language?: LanguageInfo;
  pipeline?: PipelineUsed;
}) {
  if (!language && !pipeline) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
      {language?.language && (
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
          {getLanguageLabel(
            language.language,
          )}
        </span>
      )}

      {pipeline && (
        <span className="rounded-full border border-teal-100 bg-teal-50 px-2 py-1 text-[10px] font-bold text-[#1B4F59]">
          {pipeline === "dziribert"
            ? "DziriBERT"
            : "Multilingue"}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   INDICATEUR DE RÉPONSE
========================================================= */

function TypingIndicator() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="flex items-start gap-3"
    >
      <LogoBox size="tiny" />

      <div className="rounded-3xl rounded-tl-lg border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-black/5">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>

        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Veuillez patienter…
        </p>
      </div>
    </motion.div>
  );
}

/* =========================================================
   PANNEAU D’INFORMATIONS
========================================================= */

function InformationPanel({
  nlp,
  diagnostic,
  therapy,
  onClose,
}: {
  nlp: NlpInformation | null;
  diagnostic: Diagnostic | null;
  therapy: Therapy | null;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <LogoBox size="tiny" />

          <div>
            <h3 className="text-sm font-black text-slate-900">
              Informations du parcours
            </h3>

            <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
              EL MOUSANID AI
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-[#1B4F59]"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {nlp?.pipeline_used && (
          <InformationCard
            title="Traitement utilisé"
            icon={<Zap size={14} />}
          >
            {nlp.detected_language && (
              <InformationRow
                label="Langue détectée"
                value={getLanguageLabel(
                  nlp.detected_language,
                )}
              />
            )}

            <InformationRow
              label="Système utilisé"
              value={
                nlp.pipeline_used ===
                "dziribert"
                  ? "DziriBERT"
                  : "Multilingue"
              }
            />
          </InformationCard>
        )}

        {nlp && (
          <InformationCard
            title="État du message"
            icon={<Sparkles size={14} />}
          >
            {nlp.sentiment && (
              <InformationRow
                label="Sentiment"
                value={nlp.sentiment}
              />
            )}

            {nlp.emotion &&
              nlp.emotion !== "unknown" &&
              nlp.emotion !== "—" && (
                <InformationRow
                  label="Émotion"
                  value={nlp.emotion}
                />
              )}

            {nlp.addiction_type && (
              <InformationRow
                label="Type d’addiction"
                value={nlp.addiction_type}
              />
            )}

            {nlp.intent &&
              nlp.intent !== "unknown" && (
                <InformationRow
                  label="Intention"
                  value={nlp.intent}
                />
              )}

            {typeof nlp.riskScore ===
              "number" &&
              nlp.riskScore > 0 && (
                <InformationRow
                  label="Niveau de risque"
                  value={`${nlp.riskScore} %`}
                />
              )}

            {nlp.emotionalState && (
              <InformationRow
                label="État émotionnel"
                value={nlp.emotionalState}
              />
            )}
          </InformationCard>
        )}

        {diagnostic && (
          <InformationCard
            title="Orientation"
            icon={
              <Stethoscope size={14} />
            }
          >
            {diagnostic.priority && (
              <InformationRow
                label="Priorité"
                value={diagnostic.priority}
              />
            )}

            {diagnostic.orientation && (
              <InformationRow
                label="Proposition"
                value={
                  diagnostic.orientation
                }
              />
            )}

            {diagnostic.diagnosticSummary && (
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {
                  diagnostic.diagnosticSummary
                }
              </p>
            )}
          </InformationCard>
        )}

        {therapy?.message && (
          <InformationCard
            title="Suggestion"
            icon={<HeartPulse size={14} />}
          >
            <p className="text-sm leading-6 text-slate-700">
              {therapy.message}
            </p>
          </InformationCard>
        )}
      </div>
    </div>
  );
}

function InformationCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-lg shadow-black/5 ring-1 ring-white/30">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-[#1B4F59]">
          {icon}
        </div>

        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
          {title}
        </p>
      </div>

      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function InformationRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 py-1.5 last:border-b-0">
      <span className="text-xs font-bold text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-slate-900">
        {String(value)}
      </span>
    </div>
  );
}

/* =========================================================
   LOGO RÉUTILISABLE
========================================================= */

function LogoBox({
  size,
}: {
  size: "tiny" | "small" | "large";
}) {
  const sizeClasses = {
    tiny:
      "h-9 w-9 rounded-2xl p-1",
    small:
      "h-11 w-11 rounded-2xl p-1.5",
    large:
      "h-24 w-24 rounded-[28px] p-2",
  };

  const imageSize = {
    tiny: 36,
    small: 44,
    large: 96,
  };

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white shadow-lg shadow-teal-900/15",
        sizeClasses[size],
      ].join(" ")}
    >
      <Image
        src="/logo.png"
        alt="Logo EL MOUSANID AI"
        width={imageSize[size]}
        height={imageSize[size]}
        priority={size === "large"}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/* =========================================================
   UTILITAIRES
========================================================= */

function riskBadgeClass(
  level: string,
): string {
  const normalizedLevel =
    String(level).toLowerCase();

  if (
    normalizedLevel.includes("haut") ||
    normalizedLevel.includes("high") ||
    normalizedLevel.includes("élevé") ||
    normalizedLevel.includes("critical")
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    normalizedLevel.includes("moyen") ||
    normalizedLevel.includes("moderate")
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    normalizedLevel.includes("bas") ||
    normalizedLevel.includes("low") ||
    normalizedLevel.includes("faible")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getRiskLevelFromSeverity(
  severity?: string,
): string {
  switch (severity) {
    case "critical":
    case "high":
      return "Élevé";

    case "moderate":
      return "Moyen";

    default:
      return "Faible";
  }
}

function getLanguageLabel(
  language: string,
): string {
  switch (language) {
    case "darija":
      return "🇩🇿 Darija";

    case "french":
      return "🇫🇷 Français";

    case "arabic":
      return "العربية";

    case "mixed":
      return "🇩🇿 Mixte";

    default:
      return language;
  }
}