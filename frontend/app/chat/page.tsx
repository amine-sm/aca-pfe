"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  HeartPulse,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  User,
  Activity,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Brain,
  Lightbulb,
  Stethoscope,
  Zap,
  Check,
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
  SmartAnalysis,
  LanguageInfo,
  PipelineUsed,
  EmergencyInfo,
} from "@/lib/smartChatApi";
import { CrisisModal } from "../components/chat/CrisisModal";
import { SmartAnalysisBadge } from "../components/chat/SmartAnalysisBadge";

// ============================================
// Types
// ============================================
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

interface NlpAnalysis {
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

// ============================================
// Suggestions
// ============================================
const SUGGESTIONS: Array<{
  icon: React.ElementType;
  title: string;
  prompt: string;
}> = [
  {
    icon: HeartPulse,
    title: "Je me sens stressé aujourd'hui",
    prompt:
      "Je me sens vraiment stressé aujourd'hui et j'ai du mal à me calmer. Pouvez-vous m'aider ?",
  },
  {
    icon: AlertTriangle,
    title: "rani t3ban bzaf (darija)",
    prompt: "rani t3ban bzaf wa habit nhder m3a chkoun",
  },
  {
    icon: Brain,
    title: "Comprendre mes émotions",
    prompt: "Je n'arrive pas à comprendre ce que je ressens en ce moment.",
  },
  {
    icon: Lightbulb,
    title: "Conseils pour avancer",
    prompt:
      "Quelles sont les premières étapes concrètes que je peux mettre en place ?",
  },
];

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingState />}>
      <ChatInner />
    </Suspense>
  );
}

function ChatLoadingState() {
  return (
    <main
      suppressHydrationWarning
      className="flex min-h-screen items-center justify-center bg-white"
    >
      <div
        suppressHydrationWarning
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-lg"
      >
        <Loader2 className="animate-spin text-[#1B4F59]" size={22} />
        <p className="font-semibold text-slate-900">Chargement…</p>
      </div>
    </main>
  );
}

function ChatInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialId = params.get("conversation");

  const { loading } = useAuthGuard(["USER"]);

  const [conversationId, setConversationId] = useState<number | null>(
    initialId ? Number(initialId) : null
  );

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");

  const [nlp, setNlp] = useState<NlpAnalysis | null>(null);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [therapy, setTherapy] = useState<Therapy | null>(null);

  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [crisisEmergencyInfo, setCrisisEmergencyInfo] =
    useState<EmergencyInfo | null>(null);
  const [chatBlocked, setChatBlocked] = useState(false);

  const [selectedPipeline, setSelectedPipeline] = useState<
    "auto" | "dziribert" | "classic_nlp"
  >("auto");
  const [pipelineMenuOpen, setPipelineMenuOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  useEffect(() => {
    if (loading) return;

    loadConversations();

    if (conversationId) {
      loadConversation(conversationId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending]);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);

    try {
      const data: any = await getMyConversations();
      setConversations(data.conversations || []);
    } catch (err: any) {
      console.warn("Impossible de charger les conversations:", err.message);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: number) => {
    try {
      const data: any = await getConversationById(id);

      const msgs: ChatMessage[] = (data.messages || []).map((m: any) => ({
        ...m,
        _justArrived: false,
      }));

      setMessages(msgs);
      setNlp(null);
      setDiagnostic(null);
      setTherapy(null);
      setChatBlocked(false);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    }
  }, []);

  async function handleNewConversation() {
    try {
      setError("");

      const data: any = await startConversation({
        title: "Nouvelle conversation",
      });

      const newId = data.conversation_id || data.conversation?.id;

      if (!newId) {
        throw new Error("Impossible de créer la conversation");
      }

      setConversationId(newId);
      setMessages([]);
      setNlp(null);
      setDiagnostic(null);
      setTherapy(null);
      setChatBlocked(false);
      setMobileSidebarOpen(false);

      router.replace(`/chat?conversation=${newId}`);
      loadConversations();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    }
  }

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

  async function handleDeleteConversation(id: number, e: React.MouseEvent) {
    e.stopPropagation();

    if (!confirm("Supprimer cette conversation ?")) return;

    try {
      await deleteConversation(id);

      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (id === conversationId) {
        setConversationId(null);
        setMessages([]);
        router.replace("/chat");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();

    if (!text.trim() || sending || chatBlocked) return;

    const messageText = text.trim();

    setText("");
    setError("");

    let convId = conversationId;

    if (!convId) {
      try {
        const data: any = await startConversation({
          title: messageText.slice(0, 40),
        });

        convId = data.conversation_id || data.conversation?.id;

        if (!convId) {
          throw new Error("Création conversation impossible");
        }

        setConversationId(convId);
        router.replace(`/chat?conversation=${convId}`);
      } catch (err: any) {
        setError(err.message || "Erreur création conversation");
        return;
      }
    }

    setSending(true);

    const userMsgIndex = messages.length;

    setMessages((prev) => [
      ...prev,
      {
        sender_type: "user",
        message_text: messageText,
        _justArrived: false,
      },
    ]);

    try {
      const response = await smartChat({
        message: messageText,
        conversation_id: convId || undefined,
        country: "DZ",
        force_pipeline:
          selectedPipeline === "auto" ? null : selectedPipeline,
      });

      if (response.is_crisis) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === userMsgIndex
              ? {
                  ...m,
                  is_crisis: true,
                  language: response.language,
                  pipeline: response.pipeline_used,
                }
              : m
          )
        );

        setMessages((prev) => [
          ...prev,
          {
            sender_type: "assistant",
            message_text: response.response_text,
            is_crisis: true,
            _justArrived: true,
          },
        ]);

        if (response.emergency_info) {
          setCrisisEmergencyInfo(response.emergency_info);
          setCrisisModalOpen(true);
        }

        setChatBlocked(true);

        setNlp({
          sentiment: "négatif",
          emotion: "détresse",
          riskLevel: "Élevé",
          riskScore: Math.round(
            (response.analysis?.crisis?.confidence || 0.9) * 100
          ),
          emotionalState: "Crise détectée",
          detected_language: response.language?.language,
          pipeline_used: response.pipeline_used,
        });

        setDiagnostic({
          priority: "URGENT",
          orientation: "Contact professionnel immédiat",
          diagnosticSummary: "Signal de crise détecté.",
        });
      } else {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === userMsgIndex
              ? {
                  ...m,
                  language: response.language,
                  analysis: response.analysis,
                  pipeline: response.pipeline_used,
                }
              : m
          )
        );

        setMessages((prev) => [
          ...prev,
          {
            sender_type: "assistant",
            message_text: response.response_text,
            _justArrived: true,
          },
        ]);

        const an = response.analysis;

        setNlp({
          sentiment: an?.sentiment?.label || "neutre",
          emotion: an?.emotions?.top || an?.addiction_type?.label || "—",
          intent: an?.intent,
          riskScore: Math.round((an?.crisis?.confidence || 0) * 100),
          riskLevel: getRiskLevelFromSeverity(an?.crisis?.severity),
          emotionalState:
            an?.sentiment?.label === "negatif"
              ? "État négatif"
              : "État stable",
          detected_language: response.language?.language,
          pipeline_used: response.pipeline_used,
          addiction_type: an?.addiction_type?.label,
        });

        setDiagnostic({
          priority: an?.crisis?.severity || "low",
          orientation:
            response.pipeline_used === "dziribert"
              ? "Analyse DziriBERT (darija/mixed)"
              : "Analyse NLP classique (français/arabe)",
        });
      }

      loadConversations();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasMessages = messages.length > 0;
  const hasInsights = nlp || diagnostic || therapy;

  const insightsBadge = useMemo(() => {
    if (!nlp?.riskLevel || nlp.riskLevel === "unknown") return null;
    return nlp.riskLevel;
  }, [nlp]);

  if (loading) return <ChatLoadingState />;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-white text-slate-900"
      style={{ paddingTop: "80px" }}
    >
      <CrisisModal
        isOpen={crisisModalOpen}
        emergencyInfo={crisisEmergencyInfo}
        onClose={() => setCrisisModalOpen(false)}
      />

      <div className="relative z-10 flex h-[calc(100vh-80px)] overflow-hidden px-0 lg:px-3 lg:pb-3">
        <aside
          className={`hidden h-full shrink-0 border border-slate-200 bg-white shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col ${
            sidebarOpen ? "w-80 rounded-3xl" : "w-0 overflow-hidden border-0"
          }`}
        >
          <SidebarContent
            conversations={conversations}
            loadingConvs={loadingConvs}
            currentId={conversationId}
            onNew={handleNewConversation}
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
          />
        </aside>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                style={{ top: "80px" }}
              />

              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                className="fixed left-0 z-50 flex h-[calc(100vh-80px)] w-80 flex-col border-r border-slate-200 bg-white shadow-2xl backdrop-blur-xl lg:hidden"
                style={{ top: "80px" }}
              >
                <SidebarContent
                  conversations={conversations}
                  loadingConvs={loadingConvs}
                  currentId={conversationId}
                  onNew={handleNewConversation}
                  onSelect={handleSelectConversation}
                  onDelete={handleDeleteConversation}
                  onClose={() => setMobileSidebarOpen(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent lg:ml-3 lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-xl lg:shadow-black/5 lg:backdrop-blur-xl">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/75 px-4 py-3.5 backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Basculer la barre latérale"
                className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-[#1B4F59] lg:flex"
              >
                {sidebarOpen ? (
                  <PanelLeftClose size={18} />
                ) : (
                  <PanelLeftOpen size={18} />
                )}
              </button>

              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Ouvrir le menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-[#1B4F59] lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-lg shadow-teal-900/20 ring-1 ring-white/20">
                  <HeartPulse size={16} />
                </div>

                <div>
                  <p className="text-sm font-black tracking-tight text-slate-900">
                    Assistant ACA
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    🇩🇿 Smart Routing — DziriBERT + Qwen2.5
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {insightsBadge && (
                <span
                  className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold sm:inline-flex ${riskBadgeClass(
                    insightsBadge
                  )}`}
                >
                  <Activity size={12} />
                  Risque : {insightsBadge}
                </span>
              )}

              {hasInsights && (
                <button
                  onClick={() => setShowInsights((v) => !v)}
                  className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:text-[#1B4F59] md:inline-flex"
                >
                  <Brain size={14} />
                  {showInsights ? "Masquer" : "Voir"} l&apos;analyse
                </button>
              )}
            </div>
          </header>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:mx-6"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError("")}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
                    {messages.map((msg, i) => (
                      <MessageBubble
                        key={msg.id ?? i}
                        message={msg}
                        isLatest={
                          i === messages.length - 1 &&
                          msg.sender_type === "assistant"
                        }
                      />
                    ))}

                    {sending && <TypingIndicator />}

                    {chatBlocked && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-center"
                      >
                        <AlertTriangle
                          size={24}
                          className="mx-auto mb-2 text-red-500"
                        />
                        <p className="text-sm font-bold text-red-900">
                          Conversation interrompue pour votre sécurité
                        </p>

                        <button
                          onClick={() => setCrisisModalOpen(true)}
                          className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                        >
                          Voir les numéros d&apos;urgence
                        </button>
                      </motion.div>
                    )}

                    <div ref={bottomRef} />
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showInsights && hasInsights && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 340, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden shrink-0 overflow-hidden border-l border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl md:block"
                >
                  <InsightsPanel
                    nlp={nlp}
                    diagnostic={diagnostic}
                    therapy={therapy}
                    onClose={() => setShowInsights(false)}
                  />
                </motion.aside>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-slate-200 bg-white/85 px-4 py-4 shadow-[0_-18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:px-6">
            <form onSubmit={handleSend} className="mx-auto w-full max-w-4xl">
              <div className="group relative overflow-hidden rounded-3xl border border-slate-300 bg-white/95 shadow-2xl shadow-black/5 ring-1 ring-white/40 transition focus-within:border-[#1B4F59] focus-within:shadow-teal-900/10">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={chatBlocked}
                  placeholder={
                    chatBlocked
                      ? "Conversation interrompue"
                      : "Exprime-toi en darija, français ou arabe…"
                  }
                  rows={1}
                  className="max-h-[220px] min-h-[68px] w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
                />

                <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 px-3 py-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setPipelineMenuOpen(!pipelineMenuOpen)
                      }
                      className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-teal-50/40 px-3.5 py-2 text-xs font-black text-[#1B4F59] shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
                    >
                      {selectedPipeline === "auto" && (
                        <>
                          <Sparkles size={13} />
                          <span>Auto</span>
                        </>
                      )}

                      {selectedPipeline === "dziribert" && (
                        <>
                          <span>🇩🇿</span>
                          <span>DziriBERT</span>
                        </>
                      )}

                      {selectedPipeline === "classic_nlp" && (
                        <>
                          <span>🇫🇷</span>
                          <span>Classic NLP</span>
                        </>
                      )}

                      <ChevronDown
                        size={12}
                        className={`transition ${
                          pipelineMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {pipelineMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setPipelineMenuOpen(false)}
                          />

                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute bottom-full left-0 z-40 mb-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                          >
                            <PipelineOption
                              icon={<Sparkles size={16} />}
                              title="Auto"
                              desc="Détection automatique de la langue"
                              active={selectedPipeline === "auto"}
                              onClick={() => {
                                setSelectedPipeline("auto");
                                setPipelineMenuOpen(false);
                              }}
                            />

                            <PipelineOption
                              icon={
                                <span className="text-lg leading-none">
                                  🇩🇿
                                </span>
                              }
                              title="DziriBERT"
                              desc="3 modèles fine-tunés sur darija algérienne"
                              active={selectedPipeline === "dziribert"}
                              onClick={() => {
                                setSelectedPipeline("dziribert");
                                setPipelineMenuOpen(false);
                              }}
                            />

                            <PipelineOption
                              icon={
                                <span className="text-lg leading-none">
                                  🇫🇷
                                </span>
                              }
                              title="Classic NLP"
                              desc="XLM-RoBERTa + GoEmotions multilingue"
                              active={selectedPipeline === "classic_nlp"}
                              onClick={() => {
                                setSelectedPipeline("classic_nlp");
                                setPipelineMenuOpen(false);
                              }}
                            />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={sending || !text.trim() || chatBlocked}
                    whileHover={
                      !sending && text.trim() && !chatBlocked
                        ? { scale: 1.05 }
                        : undefined
                    }
                    whileTap={
                      !sending && text.trim() && !chatBlocked
                        ? { scale: 0.95 }
                        : undefined
                    }
                    aria-label="Envoyer le message"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-lg shadow-teal-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                  </motion.button>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] font-semibold text-slate-500">
                <ShieldCheck
                  size={11}
                  className="inline-block align-text-bottom"
                />{" "}
                Conversation confidentielle · 🇩🇿 DziriBERT en temps réel
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function PipelineOption({
  icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-teal-50/40 ${
        active ? "bg-teal-50/60" : ""
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active
            ? "bg-[#1B4F59] text-white"
            : "bg-white text-slate-700"
        }`}
      >
        {icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p
            className={`text-sm font-bold ${
              active ? "text-[#1B4F59]" : "text-slate-900"
            }`}
          >
            {title}
          </p>

          {active && <Check size={14} className="text-[#1B4F59]" />}
        </div>

        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          {desc}
        </p>
      </div>
    </button>
  );
}

function SidebarContent({
  conversations,
  loadingConvs,
  currentId,
  onNew,
  onSelect,
  onDelete,
  onClose,
}: {
  conversations: ConversationSummary[];
  loadingConvs: boolean;
  currentId: number | null;
  onNew: () => void;
  onSelect: (id: number) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-2 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-md">
            <HeartPulse size={16} />
          </div>

          <div>
            <p className="text-sm font-black text-slate-900">
              Conversations
            </p>
            <p className="text-[11px] font-semibold text-slate-500">
              Historique sécurisé
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onNew}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1B4F59] to-[#2E6F7E] px-3 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:brightness-110"
          >
            <Plus size={16} />
            Nouvelle conversation
          </button>

          {onClose && (
            <button
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
        {loadingConvs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-slate-500" size={18} />
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
            {conversations.map((conv) => {
              const isActive = conv.id === currentId;
              const title = conv.title || `Conversation #${conv.id}`;

              return (
                <li key={conv.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(conv.id);
                      }
                    }}
                    className={`group flex w-full cursor-pointer items-center gap-2 rounded-2xl border px-3 py-3 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F59] ${
                      isActive
                        ? "border-teal-200 bg-teal-50 text-[#1B4F59] shadow-sm"
                        : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-teal-50/45"
                    }`}
                  >
                    <MessageSquare
                      size={15}
                      className="shrink-0 opacity-70"
                    />

                    <span className="flex-1 truncate text-sm font-semibold">
                      {title}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => onDelete(conv.id, e)}
                      aria-label="Supprimer"
                      className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs">
          <ShieldCheck size={14} className="text-[#1B4F59]" />
          <span className="font-semibold text-slate-700">
            Espace confidentiel
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white/70 p-6 text-center shadow-2xl shadow-black/5 backdrop-blur-xl md:p-10"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-2xl shadow-teal-900/25 ring-8 ring-teal-50">
          <HeartPulse size={30} />
        </div>

        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-900 md:text-4xl">
          Bonjour, comment allez-vous aujourd&apos;hui&nbsp;?
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
          Exprime-toi en darija 🇩🇿, en français 🇫🇷 ou en arabe — l&apos;IA
          détecte automatiquement.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            🇩🇿 DziriBERT
          </span>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
            🧠 Qwen2.5
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
            🛡️ Crisis Protection
          </span>
        </div>

        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;

            return (
              <motion.button
                key={s.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => onPick(s.prompt)}
                className="group flex items-start gap-3 rounded-3xl border border-slate-200 bg-white/85 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-900/10"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#1B4F59] transition group-hover:scale-110">
                  <Icon size={17} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {s.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {s.prompt}
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#1B4F59]"
                />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function MessageBubble({
  message,
  isLatest,
}: {
  message: ChatMessage;
  isLatest: boolean;
}) {
  const isUser = message.sender_type === "user";
  const isAssistant = !isUser;

  const shouldStream =
    isAssistant && isLatest && message._justArrived === true;

  const { displayed, isStreaming } = useStreamingText(
    message.message_text || "",
    shouldStream,
    8,
    3
  );

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-end gap-1"
      >
        <div className="flex items-start justify-end gap-3">
          <div
            className={`max-w-[78%] rounded-3xl rounded-br-lg px-4 py-3 text-[15px] font-semibold leading-7 shadow-lg shadow-black/5 ${
              message.is_crisis
                ? "bg-gradient-to-br from-red-500 to-rose-500 text-white"
                : "bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">
              {message.message_text}
            </div>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59] ring-1 ring-slate-200">
            <User size={15} />
          </div>
        </div>

        {(message.language || message.analysis) && (
          <div className="pr-11">
            <SmartAnalysisBadge
              language={message.language}
              analysis={message.analysis}
              pipeline={message.pipeline}
            />
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-lg shadow-teal-900/15">
        <HeartPulse size={15} />
      </div>

      <div
        className={`max-w-[88%] rounded-3xl rounded-tl-lg px-4 py-3 shadow-lg shadow-black/5 ${
          message.is_crisis
            ? "border-2 border-red-300 bg-red-50 text-red-900"
            : "border border-slate-200 bg-white text-slate-800 ring-1 ring-white/40"
        }`}
      >
        {message.is_crisis && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-700">
            <AlertTriangle size={10} />
            Support d&apos;urgence
          </div>
        )}

        <MarkdownRenderer content={displayed} />

        {isStreaming && <span className="streaming-caret" />}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4F59] to-[#2E6F7E] text-white shadow-lg shadow-teal-900/15">
        <HeartPulse size={15} />
      </div>

      <div className="rounded-3xl rounded-tl-lg border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-black/5">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>

        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          🇩🇿 DziriBERT + Qwen2.5
        </p>
      </div>
    </motion.div>
  );
}

function InsightsPanel({
  nlp,
  diagnostic,
  therapy,
  onClose,
}: {
  nlp: NlpAnalysis | null;
  diagnostic: Diagnostic | null;
  therapy: Therapy | null;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-[#1B4F59]" />
          <h3 className="text-sm font-black text-slate-900">Analyse IA</h3>
        </div>

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-[#1B4F59]"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {nlp?.pipeline_used && (
          <Card title="🇩🇿 Smart Routing" icon={<Zap size={14} />}>
            {nlp.detected_language && (
              <Row
                label="Langue détectée"
                value={getLanguageLabel(nlp.detected_language)}
              />
            )}

            <Row
              label="Pipeline utilisé"
              value={
                nlp.pipeline_used === "dziribert"
                  ? "DziriBERT (fine-tuné)"
                  : "NLP classique"
              }
            />
          </Card>
        )}

        {nlp && (
          <Card title="NLP" icon={<Sparkles size={14} />}>
            {nlp.sentiment && (
              <Row label="Sentiment" value={nlp.sentiment} />
            )}

            {nlp.emotion &&
              nlp.emotion !== "unknown" &&
              nlp.emotion !== "—" && (
                <Row label="Émotion" value={nlp.emotion} />
              )}

            {nlp.addiction_type && (
              <Row
                label="Type d'addiction"
                value={nlp.addiction_type}
              />
            )}

            {nlp.intent && nlp.intent !== "unknown" && (
              <Row label="Intention" value={nlp.intent} />
            )}

            {typeof nlp.riskScore === "number" && nlp.riskScore > 0 && (
              <Row label="Score risque" value={`${nlp.riskScore}%`} />
            )}

            {nlp.emotionalState && (
              <Row
                label="État émotionnel"
                value={nlp.emotionalState}
              />
            )}
          </Card>
        )}

        {diagnostic && (
          <Card title="Diagnostic" icon={<Stethoscope size={14} />}>
            {diagnostic.priority && (
              <Row label="Priorité" value={diagnostic.priority} />
            )}

            {diagnostic.orientation && (
              <Row label="Orientation" value={diagnostic.orientation} />
            )}

            {diagnostic.diagnosticSummary && (
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {diagnostic.diagnosticSummary}
              </p>
            )}
          </Card>
        )}

        {therapy?.message && (
          <Card
            title="Suggestion thérapeutique"
            icon={<HeartPulse size={14} />}
          >
            <p className="text-sm leading-6 text-slate-700">
              {therapy.message}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
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

      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 py-1.5 last:border-b-0">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold text-slate-900">
        {String(value)}
      </span>
    </div>
  );
}

function riskBadgeClass(level: string): string {
  const norm = String(level).toLowerCase();

  if (
    norm.includes("haut") ||
    norm.includes("high") ||
    norm.includes("élevé") ||
    norm.includes("critical")
  ) {
    return "bg-red-50 text-red-700";
  }

  if (norm.includes("moyen") || norm.includes("moderate")) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    norm.includes("bas") ||
    norm.includes("low") ||
    norm.includes("faible")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getRiskLevelFromSeverity(severity?: string): string {
  switch (severity) {
    case "critical":
      return "Élevé";
    case "high":
      return "Élevé";
    case "moderate":
      return "Moyen";
    default:
      return "Faible";
  }
}

function getLanguageLabel(lang: string): string {
  switch (lang) {
    case "darija":
      return "🇩🇿 Darija";
    case "french":
      return "🇫🇷 Français";
    case "arabic":
      return "🇸🇦 Arabe";
    case "mixed":
      return "🇩🇿🇫🇷 Mixte";
    default:
      return lang;
  }
}