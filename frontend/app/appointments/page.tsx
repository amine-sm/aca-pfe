"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Banknote,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  ReceiptText,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  UploadCloud,
  Video,
  Wallet,
} from "lucide-react";

import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  cancelMyAppointment,
  createAppointment,
  getMyAppointments,
} from "@/lib/appointmentsApi";
import { getMyActivePsychologist } from "@/lib/recommendationsApi";
import {
  createCheckout,
  getMyInvoices,
  getMyPayments,
} from "@/lib/paymentsApi";
import { getAvailableSlots } from "@/lib/slotsApi";
import {
  getActivePaymentMethods,
  PaymentMethod,
} from "@/lib/paymentMethodsApi";

type TabKey = "appointment" | "payment" | "history" | "invoices";

const pageAnimation = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardAnimation = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const listAnimation = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const itemAnimation = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
    },
  },
};

const floatingAnimation = {
  animate: {
    y: [0, -12, 0],
    x: [0, 8, 0],
    opacity: [0.45, 0.75, 0.45],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const shineAnimation = {
  animate: {
    x: ["-120%", "130%"],
    transition: {
      duration: 2.8,
      repeat: Infinity,
      repeatDelay: 3.5,
      ease: "easeInOut",
    },
  },
};

function formatDateTime(value: any) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSlotDate(value: any) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDateInputValue(value: any) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateTimeValue(item: any, dateKey: string, timeKey?: string) {
  const dateValue = item?.[dateKey];

  if (!dateValue) return 0;

  const dateOnly = getDateInputValue(dateValue);

  if (timeKey && item?.[timeKey]) {
    const timeOnly = String(item[timeKey]).slice(0, 8);
    const finalDate = new Date(`${dateOnly}T${timeOnly}`);

    if (!Number.isNaN(finalDate.getTime())) {
      return finalDate.getTime();
    }
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return date.getTime();
}

function sortByDateDesc(list: any[], dateKey: string, timeKey?: string) {
  return [...list].sort((a, b) => {
    const dateA = getDateTimeValue(a, dateKey, timeKey);
    const dateB = getDateTimeValue(b, dateKey, timeKey);

    return dateB - dateA;
  });
}

function openDatePicker(e: React.MouseEvent<HTMLInputElement>) {
  const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
  input.showPicker?.();
}

function formatMoney(value: any, currency = "DZD") {
  const numberValue = Number(value || 0);

  return `${numberValue.toLocaleString("fr-DZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency || "DZD"}`;
}

function getInvoiceNumber(invoice: any) {
  return (
    invoice?.invoice_number ||
    invoice?.number ||
    invoice?.code ||
    `FAC-${invoice?.id || "—"}`
  );
}

function getInvoiceUrl(invoice: any) {
  return (
    invoice?.pdf_url ||
    invoice?.invoice_url ||
    invoice?.file_url ||
    invoice?.url ||
    ""
  );
}

function isPayableAppointment(appointment: any) {
  const status = String(appointment?.status || "").toLowerCase();
  const paymentStatus = String(appointment?.payment_status || "").toLowerCase();

  if (paymentStatus === "paid") return false;
  if (status === "cancelled" || status === "no_show") return false;

  return true;
}

function isPaymentPendingForAppointment(
  payments: any[],
  appointmentId: number | string
) {
  return payments.some((payment) => {
    const sameAppointment =
      String(payment?.appointment_id || payment?.appointmentId || "") ===
      String(appointmentId);

    const status = String(payment?.status || "").toLowerCase();

    return (
      sameAppointment && (status === "pending" || status === "manual_pending")
    );
  });
}

function copyText(value: any) {
  if (!value) return;
  navigator.clipboard?.writeText(String(value)).catch(() => {});
}

function getMethodTypeLabel(method?: PaymentMethod) {
  const value = String(method?.method_type || method?.name || "").toLowerCase();

  if (value.includes("ccp")) return "Compte CCP";
  if (value.includes("baridi")) return "BaridiMob";
  if (value.includes("bank") || value.includes("banque")) {
    return "Virement bancaire";
  }
  if (value.includes("cash")) return "Paiement cash";

  return method?.name || "Méthode de paiement";
}

function getPaymentIcon(method?: PaymentMethod) {
  const value = String(method?.method_type || method?.name || "").toLowerCase();

  if (
    value.includes("ccp") ||
    value.includes("bank") ||
    value.includes("banque")
  ) {
    return <Landmark size={19} />;
  }

  if (value.includes("cash")) {
    return <Banknote size={19} />;
  }

  return <CreditCard size={19} />;
}

function buildInvoiceHtml(invoice: any) {
  const invoiceNumber = getInvoiceNumber(invoice);
  const invoiceDate =
    invoice.created_at || invoice.issued_at || invoice.updated_at || invoice.date;
  const currency = invoice.currency || "DZD";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 30px;
      background: #f8fafc;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
    }
    .invoice {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .top {
      background: #123E46;
      color: #ffffff;
      padding: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    .sub {
      margin: 6px 0 0;
      color: rgba(255,255,255,0.75);
      font-weight: 700;
      font-size: 12px;
    }
    .amount { text-align: right; }
    .amount span {
      display: block;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      color: rgba(255,255,255,0.72);
    }
    .amount strong {
      display: block;
      margin-top: 6px;
      font-size: 28px;
      font-weight: 900;
    }
    .content { padding: 24px; }
    .status {
      display: inline-block;
      padding: 7px 12px;
      background: #ecfdf5;
      color: #047857;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 20px;
    }
    .box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 12px;
      padding: 13px;
    }
    .box small {
      display: block;
      color: #64748b;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .box strong {
      display: block;
      margin-top: 6px;
      font-size: 13px;
      color: #0f172a;
      word-break: break-word;
    }
    .note {
      margin-top: 20px;
      padding: 14px;
      border-radius: 12px;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      color: #134e4a;
      font-weight: 700;
      line-height: 1.6;
      font-size: 13px;
    }
    .footer {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      gap: 18px;
      border-top: 1px solid #e2e8f0;
      padding-top: 18px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice { border-radius: 0; border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="top">
      <div class="brand">
        <div>
          <h1>Facture de consultation</h1>
          <p class="sub">Addiction Care Assistant</p>
        </div>

        <div class="amount">
          <span>Montant payé</span>
          <strong>${formatMoney(invoice.amount, currency)}</strong>
        </div>
      </div>
    </div>

    <div class="content">
      <span class="status">Paiement validé</span>

      <div class="grid">
        <div class="box">
          <small>Numéro facture</small>
          <strong>${invoiceNumber}</strong>
        </div>
        <div class="box">
          <small>Date</small>
          <strong>${formatDateTime(invoiceDate)}</strong>
        </div>
        <div class="box">
          <small>ID facture</small>
          <strong>${invoice.id || "—"}</strong>
        </div>
        <div class="box">
          <small>ID paiement</small>
          <strong>${invoice.payment_id || invoice.paymentId || "—"}</strong>
        </div>
        <div class="box">
          <small>Statut</small>
          <strong>${invoice.status || "paid"}</strong>
        </div>
        <div class="box">
          <small>Devise</small>
          <strong>${currency}</strong>
        </div>
      </div>

      ${
        invoice.description || invoice.notes
          ? `<div class="note">${invoice.description || invoice.notes}</div>`
          : ""
      }

      <div class="footer">
        <span>Facture générée automatiquement après validation du paiement.</span>
        <span>${invoiceNumber}</span>
      </div>
    </div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
`;
}

function printInvoicePdf(invoice: any) {
  const html = buildInvoiceHtml(invoice);
  const printWindow = window.open("", "_blank", "width=900,height=850");

  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export default function AppointmentsPage() {
  const { loading: authLoading } = useAuthGuard(["USER"]);

  const [mounted, setMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("appointment");
  const [activePsychologist, setActivePsychologist] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | string>("");
  const [slotDateFilter, setSlotDateFilter] = useState("");
  const [appointmentDateFilter, setAppointmentDateFilter] = useState("");

  const [form, setForm] = useState({
    notes: "Première séance après questionnaire",
  });

  const [paymentForm, setPaymentForm] = useState<any>({
    appointment_id: "",
    payment_method_id: "",
    payment_method: "",
    proof_reference: "",
    notes: "Paiement manuel envoyé pour validation.",
    proof_file: null,
  });

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [paymentLoadingId, setPaymentLoadingId] = useState<
    number | string | null
  >(null);
  const [cancelLoadingId, setCancelLoadingId] = useState<number | string | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadData() {
    setError("");
    setLoading(true);

    try {
      const [
        psychologistData,
        appointmentsData,
        paymentsData,
        invoicesData,
        paymentMethodsData,
      ] = await Promise.all([
        getMyActivePsychologist().catch(() => ({ psychologist: null })),
        getMyAppointments(),
        getMyPayments().catch(() => ({ payments: [] })),
        getMyInvoices().catch(() => ({ invoices: [] })),
        getActivePaymentMethods().catch(() => ({ methods: [] })),
      ]);

      const psychologist = (psychologistData as any).psychologist || null;

      setActivePsychologist(psychologist);
      setAppointments((appointmentsData as any).appointments || []);
      setPayments((paymentsData as any).payments || []);
      setInvoices((invoicesData as any).invoices || []);

      const methods = (paymentMethodsData as any).methods || [];
      setPaymentMethods(methods);

      if (methods.length > 0) {
        setPaymentForm((prev: any) => {
          if (prev.payment_method_id) return prev;

          return {
            ...prev,
            payment_method_id: String(methods[0].id),
            payment_method: methods[0].method_type || methods[0].name,
          };
        });
      }

      const psychologistId =
        psychologist?.psychologist_id ||
        psychologist?.id ||
        psychologist?.psychologistId;

      if (psychologistId) {
        const slotsData: any = await getAvailableSlots(psychologistId).catch(
          () => ({
            slots: [],
          })
        );

        setAvailableSlots(slotsData.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (err: any) {
      setError(err.message || "Erreur chargement rendez-vous");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    const psychologistId =
      activePsychologist?.psychologist_id ||
      activePsychologist?.id ||
      activePsychologist?.psychologistId;

    if (!psychologistId) {
      setError(
        "Aucun psychologue actif. Allez dans Recommandations et acceptez un psychologue avant de créer un rendez-vous."
      );
      return;
    }

    if (!selectedSlotId) {
      setError("Veuillez choisir un créneau disponible.");
      return;
    }

    try {
      setCreating(true);

      const data: any = await createAppointment({
        slot_id: Number(selectedSlotId),
        notes: form.notes,
      });

      setMessage(data.message || "Demande de rendez-vous envoyée au psychologue.");

      setSelectedSlotId("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Erreur création rendez-vous");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreatePayment(appointmentId: number | string) {
    setError("");
    setMessage("");

    const appointment = appointments.find(
      (item) => String(item.id) === String(appointmentId)
    );

    if (!appointment) {
      setError("Rendez-vous introuvable.");
      return;
    }

    if (!isPayableAppointment(appointment)) {
      setError("Ce rendez-vous ne peut pas être payé.");
      return;
    }

    if (isPaymentPendingForAppointment(payments, appointmentId)) {
      setError("Un paiement est déjà en attente de validation pour ce rendez-vous.");
      return;
    }

    if (!paymentForm.payment_method_id) {
      setError("Veuillez sélectionner une méthode de paiement.");
      setActiveTab("payment");
      return;
    }

    if (!paymentForm.proof_file) {
      setError("Veuillez joindre une preuve de paiement PNG, JPG, JPEG ou PDF.");
      setActiveTab("payment");
      return;
    }

    const selectedMethod = paymentMethods.find(
      (method) => String(method.id) === String(paymentForm.payment_method_id)
    );

    try {
      setPaymentLoadingId(appointmentId);

      const data: any = await createCheckout({
        appointment_id: Number(appointmentId),
        provider: "manual",
        payment_method_id: paymentForm.payment_method_id,
        payment_method:
          selectedMethod?.method_type || paymentForm.payment_method || "manual",
        proof_reference: paymentForm.proof_reference || `RDV-${appointmentId}`,
        notes: paymentForm.notes || "Paiement rendez-vous",
        proof_file: paymentForm.proof_file,
      });

      setMessage(
        data.message ||
          "Paiement envoyé avec succès. L’administrateur doit maintenant valider le paiement."
      );

      setPaymentForm((prev: any) => ({
        ...prev,
        appointment_id: "",
        proof_file: null,
        proof_reference: "",
      }));

      setActiveTab("history");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Erreur création paiement");
    } finally {
      setPaymentLoadingId(null);
    }
  }

  async function handleCancelAppointment(appointmentId: number | string) {
    setError("");
    setMessage("");
    setCancelLoadingId(appointmentId);

    try {
      const data: any = await cancelMyAppointment(appointmentId);

      setMessage(data.message || "Rendez-vous annulé.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Erreur annulation rendez-vous");
    } finally {
      setCancelLoadingId(null);
    }
  }

  useEffect(() => {
    if (mounted && !authLoading) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, authLoading]);

  const pendingAppointments = appointments.filter(
    (item) =>
      item.status === "pending_payment" ||
      item.payment_status === "unpaid" ||
      item.status === "pending"
  ).length;

  const confirmedAppointments = appointments.filter(
    (item) => item.status === "confirmed"
  ).length;

  const paidPayments = payments.filter((item) => item.status === "paid").length;

  const payableAppointments = appointments.filter(isPayableAppointment);

  const unpaidAmount = payableAppointments.reduce((sum, appointment) => {
    return sum + Number(appointment.price || 0);
  }, 0);

  const paidAmount = payments
    .filter((payment) => String(payment.status || "").toLowerCase() === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const pendingPayments = payments.filter((payment) => {
    const value = String(payment.status || "").toLowerCase();
    return value === "pending" || value === "manual_pending";
  }).length;

  const selectedPaymentMethod = useMemo(() => {
    return paymentMethods.find(
      (method) => String(method.id) === String(paymentForm.payment_method_id)
    );
  }, [paymentMethods, paymentForm.payment_method_id]);

  const sortedAvailableSlots = useMemo(() => {
    return sortByDateDesc(availableSlots, "slot_date", "start_time");
  }, [availableSlots]);

  const filteredAvailableSlots = useMemo(() => {
    if (!slotDateFilter) return sortedAvailableSlots;

    return sortedAvailableSlots.filter(
      (slot) => getDateInputValue(slot.slot_date) === slotDateFilter
    );
  }, [sortedAvailableSlots, slotDateFilter]);

  const sortedAppointments = useMemo(() => {
    return sortByDateDesc(appointments, "appointment_date");
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (!appointmentDateFilter) return sortedAppointments;

    return sortedAppointments.filter(
      (appointment) =>
        getDateInputValue(appointment.appointment_date) === appointmentDateFilter
    );
  }, [sortedAppointments, appointmentDateFilter]);

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      key: "appointment",
      label: "Rendez-vous",
      icon: <CalendarCheck size={18} />,
      count: appointments.length,
    },
    {
      key: "payment",
      label: "Paiement",
      icon: <CreditCard size={18} />,
      count: pendingPayments,
    },
    {
      key: "history",
      label: "Historique",
      icon: <Clock size={18} />,
      count: payments.length,
    },
    {
      key: "invoices",
      label: "Factures",
      icon: <ReceiptText size={18} />,
      count: invoices.length,
    },
  ];

  if (!mounted) {
    return null;
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <Loader2 className="animate-spin text-[#1B4F59]" size={23} />
            <p className="font-bold text-slate-700">Chargement...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <AnimatedBackground />

      <motion.div
        variants={pageAnimation}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8"
      >
        <HeaderBar loading={loading} onRefresh={loadData} />

        <AnimatePresence mode="popLayout">
          {error && <AlertMessage key="error" type="error" message={error} />}
          {message && (
            <AlertMessage key="success" type="success" message={message} />
          )}
        </AnimatePresence>

        <motion.section
          variants={listAnimation}
          initial="hidden"
          animate="show"
          className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatBox
            icon={<CalendarDays size={21} />}
            label="Total RDV"
            value={appointments.length}
          />
          <StatBox
            icon={<Clock size={21} />}
            label="En attente"
            value={pendingAppointments}
          />
          <StatBox
            icon={<CheckCircle2 size={21} />}
            label="Confirmés"
            value={confirmedAppointments}
          />
          <StatBox
            icon={<ReceiptText size={21} />}
            label="Factures"
            value={invoices.length}
          />
        </motion.section>

        <PsychologistBox activePsychologist={activePsychologist} />

        <motion.section
          variants={cardAnimation}
          initial="hidden"
          animate="show"
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-4 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-3">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.key}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative inline-flex h-11 shrink-0 items-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-black transition ${
                    activeTab === tab.key
                      ? "bg-[#123E46] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {activeTab === tab.key && (
                    <motion.span
                      layoutId="active-tab-bg"
                      className="absolute inset-0 rounded-xl bg-[#123E46]"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  )}

                  <span className="relative z-10">{tab.icon}</span>
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`relative z-10 rounded-full px-2 py-0.5 text-[11px] ${
                      activeTab === tab.key
                        ? "bg-white/15 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {tab.count || 0}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              {activeTab === "appointment" && (
                <motion.div
                  key="appointment-tab"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <AppointmentTab
                    activePsychologist={activePsychologist}
                    availableSlots={filteredAvailableSlots}
                    slotDateFilter={slotDateFilter}
                    setSlotDateFilter={setSlotDateFilter}
                    selectedSlotId={selectedSlotId}
                    setSelectedSlotId={setSelectedSlotId}
                    form={form}
                    setForm={setForm}
                    creating={creating}
                    appointments={filteredAppointments}
                    appointmentDateFilter={appointmentDateFilter}
                    setAppointmentDateFilter={setAppointmentDateFilter}
                    payments={payments}
                    paymentLoadingId={paymentLoadingId}
                    cancelLoadingId={cancelLoadingId}
                    handleCreateAppointment={handleCreateAppointment}
                    handleCreatePayment={handleCreatePayment}
                    handleCancelAppointment={handleCancelAppointment}
                    paymentForm={paymentForm}
                  />
                </motion.div>
              )}

              {activeTab === "payment" && (
                <motion.div
                  key="payment-tab"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <PaymentTab
                    paymentMethods={paymentMethods}
                    paymentForm={paymentForm}
                    setPaymentForm={setPaymentForm}
                    selectedPaymentMethod={selectedPaymentMethod}
                    unpaidAmount={unpaidAmount}
                    paidAmount={paidAmount}
                    payableAppointments={payableAppointments}
                    paidPayments={paidPayments}
                    pendingPayments={pendingPayments}
                    paymentLoadingId={paymentLoadingId}
                    handleCreatePayment={handleCreatePayment}
                  />
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history-tab"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <HistoryTab payments={payments} />
                </motion.div>
              )}

              {activeTab === "invoices" && (
                <motion.div
                  key="invoices-tab"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <InvoicesTab invoices={invoices} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        variants={floatingAnimation}
        animate="animate"
        className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-teal-100/55 blur-3xl"
      />
      <motion.div
        variants={floatingAnimation}
        animate="animate"
        transition={{ delay: 1.2 }}
        className="absolute -right-24 top-44 h-80 w-80 rounded-full bg-sky-100/55 blur-3xl"
      />
      <motion.div
        variants={floatingAnimation}
        animate="animate"
        transition={{ delay: 2.1 }}
        className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-100/45 blur-3xl"
      />
    </div>
  );
}

function HeaderBar({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <motion.section
      variants={cardAnimation}
      initial="hidden"
      animate="show"
      className="relative mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <motion.div
        variants={shineAnimation}
        animate="animate"
        className="absolute inset-y-0 left-0 w-32 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.06 }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-black text-[#1B4F59]"
          >
            <Sparkles size={14} />
            Interface animée
          </motion.div>

          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-black text-[#1B4F59]"
          >
            Espace patient
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl"
          >
            Rendez-vous & Paiements
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 }}
            className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500"
          >
            Gérez vos séances, vos reçus de paiement et vos factures depuis une
            seule interface simple.
          </motion.p>
        </div>

        <div className="flex gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCcw size={17} />
            )}
            Actualiser
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => (window.location.href = "/recommendations")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#123E46] px-4 text-sm font-black text-white transition hover:bg-[#1B4F59]"
          >
            <Stethoscope size={17} />
            Recommandations
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}

function PsychologistBox({ activePsychologist }: { activePsychologist: any }) {
  if (!activePsychologist) {
    return (
      <motion.section
        variants={cardAnimation}
        initial="hidden"
        animate="show"
        className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 shrink-0 text-orange-600" size={20} />
          <p className="text-sm font-bold leading-6 text-orange-800">
            Aucun psychologue actif. Allez dans Recommandations et acceptez un
            psychologue avant de créer un rendez-vous.
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      variants={cardAnimation}
      initial="hidden"
      animate="show"
      className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <motion.div
        variants={listAnimation}
        initial="hidden"
        animate="show"
        className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_1fr]"
      >
        <InfoItem
          icon={<Stethoscope size={18} />}
          label="Psychologue"
          value={activePsychologist.full_name}
        />

        <InfoItem
          icon={<MapPin size={18} />}
          label="Ville"
          value={activePsychologist.city || "—"}
        />

        <InfoItem
          icon={<Wallet size={18} />}
          label="Prix"
          value={`${activePsychologist.consultation_price || 0} ${
            activePsychologist.currency || "DZD"
          }`}
        />

        <InfoItem
          icon={<Video size={18} />}
          label="Mode"
          value={
            activePsychologist.accepts_online ? "En ligne disponible" : "Présentiel"
          }
        />
      </motion.div>
    </motion.section>
  );
}

function AppointmentTab({
  activePsychologist,
  availableSlots,
  slotDateFilter,
  setSlotDateFilter,
  selectedSlotId,
  setSelectedSlotId,
  form,
  setForm,
  creating,
  appointments,
  appointmentDateFilter,
  setAppointmentDateFilter,
  payments,
  paymentLoadingId,
  cancelLoadingId,
  handleCreateAppointment,
  handleCreatePayment,
  handleCancelAppointment,
  paymentForm,
}: {
  activePsychologist: any;
  availableSlots: any[];
  slotDateFilter: string;
  setSlotDateFilter: (value: string) => void;
  selectedSlotId: number | string;
  setSelectedSlotId: (value: number | string) => void;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<{ notes: string }>>;
  creating: boolean;
  appointments: any[];
  appointmentDateFilter: string;
  setAppointmentDateFilter: (value: string) => void;
  payments: any[];
  paymentLoadingId: number | string | null;
  cancelLoadingId: number | string | null;
  handleCreateAppointment: (e: React.FormEvent) => Promise<void>;
  handleCreatePayment: (appointmentId: number | string) => Promise<void>;
  handleCancelAppointment: (appointmentId: number | string) => Promise<void>;
  paymentForm: any;
}) {
  return (
    <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.65fr] 2xl:items-start">
      <Card title="Nouveau rendez-vous" subtitle="Choisissez un créneau disponible.">
        <form className="space-y-4" onSubmit={handleCreateAppointment}>
          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-slate-700">
                Créneaux disponibles
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={slotDateFilter}
                  onClick={openDatePicker}
                  onChange={(e) => setSlotDateFilter(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#1B4F59] focus:ring-2 focus:ring-teal-100"
                />

                <AnimatePresence>
                  {slotDateFilter && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.9, x: 8 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 8 }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSlotDateFilter("")}
                      className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-600 hover:bg-slate-100"
                    >
                      Tout
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {!activePsychologist ? (
              <NoticeBox type="warning">
                Vous devez d’abord accepter un psychologue.
              </NoticeBox>
            ) : availableSlots.length === 0 ? (
              <NoticeBox type="warning">
                Aucun créneau disponible pour le moment.
              </NoticeBox>
            ) : (
              <motion.div
                key={slotDateFilter || "all-slots"}
                variants={listAnimation}
                initial="hidden"
                animate="show"
                className="grid max-h-[540px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-2"
              >
                <AnimatePresence mode="popLayout">
                  {availableSlots.map((slot) => {
                    const selected = String(selectedSlotId) === String(slot.id);

                    return (
                      <motion.button
                        key={slot.id}
                        layout
                        variants={itemAnimation}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`rounded-2xl border p-5 text-left transition ${
                          selected
                            ? "border-[#123E46] bg-[#123E46] text-white shadow-lg shadow-teal-900/20"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[#1B4F59] hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-black">
                          <CalendarDays size={16} />
                          {formatSlotDate(slot.slot_date)}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm font-bold">
                          <Clock size={16} />
                          {String(slot.start_time).slice(0, 5)} -{" "}
                          {String(slot.end_time).slice(0, 5)}
                        </div>

                        <div className="mt-2 text-xs font-black">
                          {slot.mode === "in_person" ? "Présentiel" : "En ligne"}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Notes
            </label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev: any) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Ajoutez une note pour le rendez-vous..."
              className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <motion.button
            type="submit"
            whileHover={
              creating || !activePsychologist || !selectedSlotId
                ? undefined
                : { y: -2 }
            }
            whileTap={
              creating || !activePsychologist || !selectedSlotId
                ? undefined
                : { scale: 0.97 }
            }
            disabled={creating || !activePsychologist || !selectedSlotId}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#123E46] px-5 text-sm font-black text-white transition hover:bg-[#1B4F59] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
            {creating ? "Envoi..." : "Demander rendez-vous"}
          </motion.button>
        </form>
      </Card>

      <Card title="Mes rendez-vous" subtitle="Liste des séances et actions par date.">
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-800">Filtrer par date</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Les rendez-vous sont affichés du plus récent au plus ancien.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={appointmentDateFilter}
              onClick={openDatePicker}
              onChange={(e) => setAppointmentDateFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#1B4F59] focus:ring-2 focus:ring-teal-100"
            />

            <AnimatePresence>
              {appointmentDateFilter && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9, x: 8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 8 }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAppointmentDateFilter("")}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 hover:bg-slate-100"
                >
                  Tout
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={30} />}
            title="Aucun rendez-vous"
            text="Créez un rendez-vous avec votre psychologue pour commencer."
          />
        ) : (
          <motion.div
            key={appointmentDateFilter || "all-appointments"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden rounded-xl border border-slate-200"
          >
            <div className="max-h-[650px] overflow-auto">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Psychologue</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead align="right">Actions</TableHead>
                  </tr>
                </thead>

                <motion.tbody
                  variants={listAnimation}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-slate-100 bg-white"
                >
                  <AnimatePresence mode="popLayout">
                    {appointments.map((appointment) => (
                      <motion.tr
                        layout
                        key={appointment.id}
                        variants={itemAnimation}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="transition-colors hover:bg-slate-50"
                      >
                        <TableCell>#{appointment.id}</TableCell>
                        <TableCell>
                          {formatDateTime(appointment.appointment_date)}
                        </TableCell>
                        <TableCell>{appointment.duration_minutes || "—"} min</TableCell>
                        <TableCell>{appointment.psychologist_name || "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={appointment.mode || "—"} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appointment.status} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appointment.payment_status} />
                        </TableCell>
                        <TableCell>
                          <span className="font-black text-slate-900">
                            {formatMoney(
                              appointment.price || 0,
                              appointment.currency || "DZD"
                            )}
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            <motion.button
                              type="button"
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              disabled={
                                paymentLoadingId === appointment.id ||
                                !isPayableAppointment(appointment) ||
                                !paymentForm.payment_method_id ||
                                isPaymentPendingForAppointment(
                                  payments,
                                  appointment.id
                                )
                              }
                              onClick={() => handleCreatePayment(appointment.id)}
                              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isPayableAppointment(appointment) &&
                                !isPaymentPendingForAppointment(
                                  payments,
                                  appointment.id
                                )
                                  ? "bg-[#123E46] text-white hover:bg-[#1B4F59]"
                                  : "border border-slate-200 bg-slate-50 text-slate-400"
                              }`}
                            >
                              {paymentLoadingId === appointment.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : appointment.payment_status === "paid" ? (
                                <CheckCircle2 size={15} />
                              ) : (
                                <CreditCard size={15} />
                              )}

                              {appointment.payment_status === "paid"
                                ? "Payé"
                                : isPaymentPendingForAppointment(
                                    payments,
                                    appointment.id
                                  )
                                ? "En validation"
                                : isPayableAppointment(appointment)
                                ? "Payer"
                                : "Indisponible"}
                            </motion.button>

                            <motion.button
                              type="button"
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              disabled={
                                cancelLoadingId === appointment.id ||
                                appointment.status === "completed" ||
                                appointment.status === "cancelled"
                              }
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {cancelLoadingId === appointment.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                              Annuler
                            </motion.button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          </motion.div>
        )}
      </Card>
    </div>
  );
}

function PaymentTab({
  paymentMethods,
  paymentForm,
  setPaymentForm,
  selectedPaymentMethod,
  unpaidAmount,
  paidAmount,
  payableAppointments,
  paidPayments,
  pendingPayments,
  paymentLoadingId,
  handleCreatePayment,
}: {
  paymentMethods: PaymentMethod[];
  paymentForm: any;
  setPaymentForm: React.Dispatch<React.SetStateAction<any>>;
  selectedPaymentMethod?: PaymentMethod;
  unpaidAmount: number;
  paidAmount: number;
  payableAppointments: any[];
  paidPayments: number;
  pendingPayments: number;
  paymentLoadingId: number | string | null;
  handleCreatePayment: (appointmentId: number | string) => Promise<void>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Card
        title="Méthode de paiement"
        subtitle="Sélectionnez la méthode et ajoutez votre preuve."
      >
        <motion.div
          variants={listAnimation}
          initial="hidden"
          animate="show"
          className="mb-4 grid gap-3 sm:grid-cols-3"
        >
          <PaymentStatCard
            icon={<Wallet size={19} />}
            label="À payer"
            value={formatMoney(unpaidAmount)}
            helper={`${payableAppointments.length} RDV`}
          />
          <PaymentStatCard
            icon={<CheckCircle2 size={19} />}
            label="Validé"
            value={formatMoney(paidAmount)}
            helper={`${paidPayments} paiement(s)`}
          />
          <PaymentStatCard
            icon={<Clock size={19} />}
            label="En validation"
            value={pendingPayments}
            helper="Admin"
          />
        </motion.div>

        {paymentMethods.length === 0 ? (
          <NoticeBox type="warning">
            Aucune méthode de paiement active. Contactez l’administration.
          </NoticeBox>
        ) : (
          <motion.div
            variants={listAnimation}
            initial="hidden"
            animate="show"
            className="grid gap-3 md:grid-cols-2"
          >
            {paymentMethods.map((method) => {
              const selected =
                String(method.id) === String(paymentForm.payment_method_id);

              return (
                <motion.button
                  key={method.id}
                  variants={itemAnimation}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setPaymentForm((prev: any) => ({
                      ...prev,
                      payment_method_id: String(method.id),
                      payment_method:
                        method.method_type || method.name || "manual",
                    }));
                  }}
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-[#123E46] bg-[#123E46] text-white shadow-lg shadow-teal-900/20"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          selected ? "bg-white/15" : "bg-slate-100 text-[#1B4F59]"
                        }`}
                      >
                        {getPaymentIcon(method)}
                      </div>

                      <div>
                        <p className="font-black">{method.name}</p>
                        <p
                          className={`mt-1 text-xs font-bold ${
                            selected ? "text-white/75" : "text-slate-500"
                          }`}
                        >
                          {getMethodTypeLabel(method)}
                        </p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black"
                        >
                          Sélectionné
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm font-semibold">
                    {method.account_holder && (
                      <MiniPaymentLine
                        selected={selected}
                        label="Titulaire"
                        value={method.account_holder}
                      />
                    )}

                    {method.ccp_number && (
                      <MiniPaymentLine
                        selected={selected}
                        label="CCP"
                        value={method.ccp_number}
                        copy
                      />
                    )}

                    {method.rip_key && (
                      <MiniPaymentLine
                        selected={selected}
                        label="Clé/RIP"
                        value={method.rip_key}
                        copy
                      />
                    )}

                    {method.phone_number && (
                      <MiniPaymentLine
                        selected={selected}
                        label="Téléphone"
                        value={method.phone_number}
                        copy
                      />
                    )}
                  </div>

                  {method.instructions && (
                    <p
                      className={`mt-3 rounded-lg p-3 text-sm font-bold leading-6 ${
                        selected
                          ? "bg-white/10 text-white"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {method.instructions}
                    </p>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </Card>

      <Card
        title="Preuve de paiement"
        subtitle="Choisissez le rendez-vous, ajoutez le reçu puis envoyez."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Rendez-vous à payer <span className="text-red-500">*</span>
            </label>

            <select
              value={paymentForm.appointment_id}
              onChange={(e) =>
                setPaymentForm((prev: any) => ({
                  ...prev,
                  appointment_id: e.target.value,
                }))
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 outline-none transition focus:border-[#1B4F59] focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Sélectionner un rendez-vous</option>

              {payableAppointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  RDV #{appointment.id} — {formatDateTime(appointment.appointment_date)} —{" "}
                  {formatMoney(appointment.price || 0, appointment.currency || "DZD")}
                </option>
              ))}
            </select>

            {payableAppointments.length === 0 && (
              <p className="mt-2 text-xs font-bold text-orange-600">
                Aucun rendez-vous à payer pour le moment.
              </p>
            )}
          </div>

          <InputField
            label="Référence du reçu"
            type="text"
            value={paymentForm.proof_reference}
            onChange={(value) =>
              setPaymentForm((prev: any) => ({
                ...prev,
                proof_reference: value,
              }))
            }
            placeholder="Ex: CCP-123456"
            icon={<Banknote size={17} />}
          />

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Preuve de paiement <span className="text-red-500">*</span>
            </label>

            <label className="flex h-12 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 text-center transition hover:border-[#1B4F59] hover:bg-slate-50">
              <UploadCloud size={19} className="text-[#1B4F59]" />
              <span className="truncate text-sm font-black text-slate-800">
                {paymentForm.proof_file
                  ? paymentForm.proof_file.name
                  : "Ajouter PNG, JPG ou PDF"}
              </span>

              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPaymentForm((prev: any) => ({
                    ...prev,
                    proof_file: file,
                  }));
                }}
              />
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Note pour l’administration
            </label>

            <textarea
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm((prev: any) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Ex: paiement CCP effectué, preuve jointe..."
              className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <AnimatePresence>
            {selectedPaymentMethod && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3"
              >
                <ShieldCheck
                  className="mt-1 shrink-0 text-emerald-600"
                  size={19}
                />
                <p className="text-sm font-bold leading-6 text-emerald-800">
                  Méthode sélectionnée : {selectedPaymentMethod.name}. Cliquez sur
                  “Envoyer le reçu” pour transmettre la preuve à l’administration.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            whileHover={
              !paymentForm.appointment_id ||
              !paymentForm.payment_method_id ||
              !paymentForm.proof_file ||
              paymentLoadingId === paymentForm.appointment_id
                ? undefined
                : { y: -2 }
            }
            whileTap={
              !paymentForm.appointment_id ||
              !paymentForm.payment_method_id ||
              !paymentForm.proof_file ||
              paymentLoadingId === paymentForm.appointment_id
                ? undefined
                : { scale: 0.97 }
            }
            disabled={
              !paymentForm.appointment_id ||
              !paymentForm.payment_method_id ||
              !paymentForm.proof_file ||
              paymentLoadingId === paymentForm.appointment_id
            }
            onClick={() => handleCreatePayment(paymentForm.appointment_id)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#123E46] px-5 text-sm font-black text-white transition hover:bg-[#1B4F59] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paymentLoadingId === paymentForm.appointment_id ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
            {paymentLoadingId === paymentForm.appointment_id
              ? "Envoi du reçu..."
              : "Envoyer le reçu"}
          </motion.button>
        </div>
      </Card>
    </div>
  );
}

function HistoryTab({ payments }: { payments: any[] }) {
  return (
    <Card title="Suivi des paiements" subtitle="Historique des reçus envoyés.">
      {payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={30} />}
          title="Aucun paiement"
          text="Le paiement d’un rendez-vous apparaîtra ici après envoi."
        />
      ) : (
        <motion.div
          variants={listAnimation}
          initial="hidden"
          animate="show"
          className="grid gap-3 lg:grid-cols-2"
        >
          {payments.map((payment) => (
            <PaymentHistoryCard key={payment.id} payment={payment} />
          ))}
        </motion.div>
      )}
    </Card>
  );
}

function InvoicesTab({ invoices }: { invoices: any[] }) {
  const total = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount || 0),
    0
  );

  return (
    <Card title="Mes factures" subtitle="Factures disponibles après validation.">
      {invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={30} />}
          title="Aucune facture"
          text="Les factures apparaîtront ici après validation du paiement."
        />
      ) : (
        <div className="space-y-4">
          <motion.div
            variants={itemAnimation}
            initial="hidden"
            animate="show"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">
                  {invoices.length} facture(s) disponible(s)
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Total validé : {formatMoney(total, invoices[0]?.currency || "DZD")}
                </p>
              </div>

              <ReceiptText size={24} className="text-[#1B4F59]" />
            </div>
          </motion.div>

          <motion.div
            variants={listAnimation}
            initial="hidden"
            animate="show"
            className="grid gap-3 lg:grid-cols-2"
          >
            {invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id || getInvoiceNumber(invoice)}
                invoice={invoice}
              />
            ))}
          </motion.div>
        </div>
      )}
    </Card>
  );
}

function InvoiceCard({ invoice }: { invoice: any }) {
  const invoiceUrl = getInvoiceUrl(invoice);
  const invoiceNumber = getInvoiceNumber(invoice);
  const invoiceDate =
    invoice.created_at || invoice.issued_at || invoice.updated_at || invoice.date;

  return (
    <motion.div
      variants={itemAnimation}
      whileHover={{ y: -3 }}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#1B4F59]">
            <ReceiptText size={19} />
          </div>

          <div>
            <p className="font-black text-slate-950">{invoiceNumber}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Paiement #{invoice.payment_id || invoice.paymentId || "—"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-black text-slate-950">
            {formatMoney(invoice.amount, invoice.currency || "DZD")}
          </p>
          <div className="mt-1">
            <StatusBadge status={invoice.status || "paid"} />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <InvoiceInfoSmall label="Date" value={formatDateTime(invoiceDate)} />
        <InvoiceInfoSmall label="Devise" value={invoice.currency || "DZD"} />
      </div>

      {invoice.description || invoice.notes ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
            Note
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-600">
            {invoice.description || invoice.notes}
          </p>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {invoiceUrl ? (
          <motion.a
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            href={invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#123E46] px-3 text-xs font-black text-white transition hover:bg-[#1B4F59]"
          >
            <FileText size={14} />
            Ouvrir
          </motion.a>
        ) : (
          <div className="inline-flex h-9 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 px-3 text-xs font-black text-orange-700">
            Non disponible
          </div>
        )}

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => printInvoicePdf(invoice)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
        >
          <Download size={14} />
          PDF
        </motion.button>
      </div>
    </motion.div>
  );
}

function InvoiceInfoSmall({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-[11px] font-black text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function MiniPaymentLine({
  label,
  value,
  copy = false,
  selected = false,
}: {
  label: string;
  value: any;
  copy?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
        selected ? "bg-white/10" : "bg-slate-50"
      }`}
    >
      <span className={selected ? "text-white/70" : "text-slate-400"}>
        {label}
      </span>

      <div className="flex items-center gap-2">
        <strong className={selected ? "text-white" : "text-slate-800"}>
          {value}
        </strong>

        {copy && (
          <motion.span
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              e.stopPropagation();
              copyText(value);
            }}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
              selected
                ? "bg-white/15 text-white"
                : "bg-white text-[#1B4F59] shadow-sm"
            }`}
          >
            <Copy size={14} />
          </motion.span>
        )}
      </div>
    </div>
  );
}

function PaymentHistoryCard({ payment }: { payment: any }) {
  return (
    <motion.div
      variants={itemAnimation}
      whileHover={{ y: -3 }}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#1B4F59]">
            <CreditCard size={19} />
          </div>

          <div>
            <p className="font-black text-slate-950">Paiement #{payment.id}</p>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              RDV #{payment.appointment_id || payment.appointmentId || "—"} ·{" "}
              {payment.payment_method || "Méthode non définie"}
            </p>

            {payment.proof_reference && (
              <p className="mt-1 text-xs font-bold text-slate-400">
                Référence : {payment.proof_reference}
              </p>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="font-black text-slate-950">
            {formatMoney(payment.amount, payment.currency || "DZD")}
          </p>

          <div className="mt-2">
            <StatusBadge status={payment.status} />
          </div>
        </div>
      </div>
    </motion.div>
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
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${
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

function NoticeBox({
  type,
  children,
}: {
  type: "info" | "warning";
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3 text-sm font-bold leading-6 ${
        type === "warning"
          ? "border-orange-100 bg-orange-50 text-orange-700"
          : "border-teal-100 bg-teal-50 text-slate-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {type === "warning" ? (
          <AlertCircle className="mt-1 shrink-0 text-orange-600" size={18} />
        ) : (
          <CheckCircle2 className="mt-1 shrink-0 text-[#1B4F59]" size={18} />
        )}
        <p>{children}</p>
      </div>
    </motion.div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={cardAnimation}
      initial="hidden"
      animate="show"
      whileHover={{ y: -2, boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)" }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
    >
      <motion.div
        variants={shineAnimation}
        animate="animate"
        className="absolute inset-y-0 left-0 w-24 -skew-x-12 bg-gradient-to-r from-transparent via-slate-50/80 to-transparent"
      />

      <div className="relative mb-4">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      <div className="relative">{children}</div>
    </motion.section>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <motion.div
      variants={itemAnimation}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <motion.span
        variants={shineAnimation}
        animate="animate"
        className="absolute inset-y-0 left-0 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-teal-50 to-transparent"
      />
      <div className="relative mb-3 inline-flex rounded-xl bg-slate-100 p-3 text-[#1B4F59]">
        {icon}
      </div>

      <p className="relative text-sm font-bold text-slate-500">{label}</p>

      <motion.div
        key={String(value)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 text-2xl font-black text-slate-950"
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

function PaymentStatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
}) {
  return (
    <motion.div
      variants={itemAnimation}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
    >
      <div className="mb-3 inline-flex rounded-lg bg-white p-2 text-[#1B4F59]">
        {icon}
      </div>

      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-base font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
    </motion.div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      variants={itemAnimation}
      whileHover={{ y: -2 }}
      className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#1B4F59]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-black text-slate-950">
          {String(value || "—")}
        </p>
      </div>
    </motion.div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
  icon,
  placeholder,
  required = false,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:ring-2 focus:ring-teal-100"
        />
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"
    >
      <div>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-4 inline-flex rounded-xl bg-white p-3 text-[#1B4F59]"
        >
          {icon}
        </motion.div>

        <h3 className="text-lg font-black text-slate-950">{title}</h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {text}
        </p>
      </div>
    </motion.div>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-4 py-3 text-sm font-semibold text-slate-700 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const value = String(status || "").toLowerCase();

  if (value === "online") {
    return (
      <motion.span
        layout
        whileHover={{ scale: 1.05 }}
        className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-700"
      >
        En ligne
      </motion.span>
    );
  }

  if (value === "in_person") {
    return (
      <motion.span
        layout
        whileHover={{ scale: 1.05 }}
        className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700"
      >
        Présentiel
      </motion.span>
    );
  }

  if (value === "paid" || value === "confirmed" || value === "completed") {
    return (
      <motion.span
        layout
        whileHover={{ scale: 1.05 }}
        className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700"
      >
        {status || "validé"}
      </motion.span>
    );
  }

  if (
    value === "manual_pending" ||
    value === "unpaid" ||
    value === "pending" ||
    value === "pending_payment"
  ) {
    return (
      <motion.span
        layout
        whileHover={{ scale: 1.05 }}
        className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-black text-orange-700"
      >
        {value === "manual_pending" ? "en validation" : status || "en attente"}
      </motion.span>
    );
  }

  if (value === "failed" || value === "cancelled" || value === "no_show") {
    return (
      <motion.span
        layout
        whileHover={{ scale: 1.05 }}
        className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700"
      >
        {status || "annulé"}
      </motion.span>
    );
  }

  return (
    <motion.span
      layout
      className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600"
    >
      {status || "unknown"}
    </motion.span>
  );
}