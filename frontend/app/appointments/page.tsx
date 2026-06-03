"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
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

    return sameAppointment && (status === "pending" || status === "manual_pending");
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
  if (value.includes("bank") || value.includes("banque")) return "Virement bancaire";
  if (value.includes("cash")) return "Paiement cash";

  return method?.name || "Méthode de paiement";
}

function getPaymentIcon(method?: PaymentMethod) {
  const value = String(method?.method_type || method?.name || "").toLowerCase();

  if (value.includes("ccp") || value.includes("bank") || value.includes("banque")) {
    return <Landmark size={20} />;
  }

  if (value.includes("cash")) {
    return <Banknote size={20} />;
  }

  return <CreditCard size={20} />;
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
      padding: 28px;
      background: #f4f7f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
    }
    .invoice {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 14px 45px rgba(15, 23, 42, 0.12);
      border: 1px solid #e2e8f0;
    }
    .top {
      background: linear-gradient(135deg, #123E46, #1B4F59, #2E7B88);
      color: #ffffff;
      padding: 26px;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }
    .logo {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      background: rgba(255,255,255,0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
    }
    h1 {
      margin: 0;
      font-size: 25px;
      letter-spacing: -0.4px;
    }
    .sub {
      margin: 5px 0 0;
      color: rgba(255,255,255,0.76);
      font-weight: 700;
      font-size: 12px;
    }
    .amount { text-align: right; }
    .amount span {
      display: block;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.72);
    }
    .amount strong {
      display: block;
      margin-top: 6px;
      font-size: 28px;
      font-weight: 900;
    }
    .content { padding: 26px; }
    .status {
      display: inline-block;
      padding: 7px 12px;
      background: #ecfdf5;
      color: #047857;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 22px;
    }
    .box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 15px;
      padding: 13px;
    }
    .box small {
      display: block;
      color: #64748b;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .box strong {
      display: block;
      margin-top: 6px;
      font-size: 13px;
      color: #0f172a;
      word-break: break-word;
    }
    .note {
      margin-top: 22px;
      padding: 15px;
      border-radius: 15px;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      color: #134e4a;
      font-weight: 700;
      line-height: 1.6;
      font-size: 13px;
    }
    .footer {
      margin-top: 26px;
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
      .invoice { box-shadow: none; border-radius: 0; border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="top">
      <div class="brand">
        <div style="display:flex;align-items:center;gap:14px;">
          <div class="logo">ACA</div>
          <div>
            <h1>Facture de consultation</h1>
            <p class="sub">Addiction Care Assistant</p>
          </div>
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

  const [activePsychologist, setActivePsychologist] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | string>("");

  const [form, setForm] = useState({
    notes: "Première séance après questionnaire",
  });

  const [paymentForm, setPaymentForm] = useState<any>({
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
      return;
    }

    if (!paymentForm.proof_file) {
      setError("Veuillez joindre une preuve de paiement PNG, JPG, JPEG ou PDF.");
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
        proof_file: null,
        proof_reference: "",
      }));

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
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

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

  if (authLoading) {
    return (
      <main className="relative min-h-screen bg-[#F5FAFA]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="rounded-[30px] border border-white/80 bg-white p-8 shadow-2xl shadow-slate-200/80">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
              <p className="font-black text-slate-700">Chargement...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5FAFA] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -right-52 top-48 h-[520px] w-[520px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -bottom-56 -left-44 h-[560px] w-[560px] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(27,79,89,0.08),transparent_35%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-7 overflow-hidden rounded-[36px] bg-[#123E46] p-7 text-white shadow-2xl shadow-teal-950/20 md:p-10"
        >
          <div className="relative">
            <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur">
                  <Sparkles size={16} />
                  Espace patient
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
                  Rendez-vous & Paiements
                </h1>

                <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-teal-50/80 md:text-lg">
                  Réservez votre séance, envoyez votre reçu de paiement, puis
                  récupérez votre facture PDF après validation par l’administration.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#123E46] shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
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
                  onClick={() => (window.location.href = "/recommendations")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#FE5737] px-5 text-sm font-black text-white shadow-xl shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  <Stethoscope size={18} />
                  Recommandations
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {error && <AlertMessage type="error" message={error} />}
        {message && <AlertMessage type="success" message={message} />}

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon={<CalendarDays size={24} />}
            label="Total rendez-vous"
            value={appointments.length}
            delay={0.08}
          />

          <StatBox
            icon={<Clock size={24} />}
            label="En attente"
            value={pendingAppointments}
            delay={0.12}
          />

          <StatBox
            icon={<Video size={24} />}
            label="Confirmés"
            value={confirmedAppointments}
            delay={0.16}
          />

          <StatBox
            icon={<ReceiptText size={24} />}
            label="Factures"
            value={invoices.length}
            delay={0.2}
          />
        </section>

        {activePsychologist ? (
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-7 rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8"
          >
            <SectionHeader
              icon={<Stethoscope size={28} />}
              badge="Psychologue actif"
              title={activePsychologist.full_name}
              text={
                activePsychologist.specialization || "Spécialité non définie"
              }
            />

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <InfoCard
                label="Ville"
                value={activePsychologist.city || "—"}
                icon={<MapPin size={20} />}
              />

              <InfoCard
                label="Prix consultation"
                value={`${activePsychologist.consultation_price || 0} ${
                  activePsychologist.currency || "DZD"
                }`}
                icon={<Wallet size={20} />}
              />

              <InfoCard
                label="Mode"
                value={
                  activePsychologist.accepts_online
                    ? "En ligne disponible"
                    : "Présentiel"
                }
                icon={<Video size={20} />}
              />
            </div>
          </motion.section>
        ) : (
          <section className="mb-7 rounded-[30px] border border-orange-100 bg-orange-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 text-orange-600" size={22} />
              <p className="font-bold leading-7 text-orange-800">
                Aucun psychologue actif. Allez dans la page recommandations et
                acceptez un psychologue avant de créer un rendez-vous.
              </p>
            </div>
          </section>
        )}

        <div className="mb-7 grid gap-7 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
          <section className="rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
            <SectionHeader
              icon={<CalendarCheck size={28} />}
              badge="Planification"
              title="Nouveau rendez-vous"
              text="Choisissez un créneau disponible proposé par votre psychologue."
            />

            <form className="mt-7 space-y-5" onSubmit={handleCreateAppointment}>
              <div>
                <p className="mb-3 text-sm font-black text-slate-700">
                  Créneaux disponibles
                </p>

                {!activePsychologist ? (
                  <NoticeBox type="warning">
                    Vous devez d’abord accepter un psychologue.
                  </NoticeBox>
                ) : availableSlots.length === 0 ? (
                  <NoticeBox type="warning">
                    Aucun créneau disponible pour le moment.
                  </NoticeBox>
                ) : (
                  <div className="grid max-h-[370px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                    {availableSlots.map((slot) => {
                      const selected =
                        String(selectedSlotId) === String(slot.id);

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`rounded-[24px] border p-4 text-left transition ${
                            selected
                              ? "border-[#123E46] bg-[#123E46] text-white shadow-xl shadow-teal-950/15"
                              : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-[#1B4F59] hover:bg-teal-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-black">
                            <CalendarDays size={17} />
                            {formatSlotDate(slot.slot_date)}
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-sm font-bold">
                            <Clock size={17} />
                            {String(slot.start_time).slice(0, 5)} -{" "}
                            {String(slot.end_time).slice(0, 5)}
                          </div>

                          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                            {slot.mode === "in_person" ? (
                              <>
                                <MapPin size={14} />
                                Présentiel
                              </>
                            ) : (
                              <>
                                <Video size={14} />
                                En ligne
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Notes
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-5 text-slate-400">
                    <ClipboardList size={18} />
                  </span>

                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Ajoutez une note pour le rendez-vous..."
                    className="min-h-28 w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 p-4 pl-12 text-sm font-semibold leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating || !activePsychologist || !selectedSlotId}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#123E46] px-6 text-sm font-black text-white shadow-xl shadow-teal-950/20 transition hover:bg-[#1B4F59] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {creating ? "Envoi..." : "Demander rendez-vous"}
              </button>

              <NoticeBox type="info">
                Le créneau sera réservé en attente. Il sera confirmé par votre
                psychologue.
              </NoticeBox>
            </form>
          </section>

          <section className="rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
            <SectionHeader
              icon={<CreditCard size={28} />}
              badge="Paiement"
              title="Paiement manuel sécurisé"
              text="Sélectionnez une méthode de paiement, joignez le reçu, puis cliquez sur payer dans le rendez-vous concerné."
            />

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <PaymentStatCard
                icon={<Wallet size={20} />}
                label="À payer"
                value={formatMoney(unpaidAmount)}
                helper={`${payableAppointments.length} RDV`}
              />

              <PaymentStatCard
                icon={<CheckCircle2 size={20} />}
                label="Validé"
                value={formatMoney(paidAmount)}
                helper={`${paidPayments} paiement(s)`}
                success
              />

              <PaymentStatCard
                icon={<Clock size={20} />}
                label="En validation"
                value={pendingPayments}
                helper="Admin"
              />
            </div>

            <div className="mt-7">
              <p className="mb-3 text-sm font-black text-slate-700">
                Méthode de paiement
              </p>

              {paymentMethods.length === 0 ? (
                <NoticeBox type="warning">
                  Aucune méthode de paiement active. Contactez l’administration.
                </NoticeBox>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {paymentMethods.map((method) => {
                    const selected =
                      String(method.id) === String(paymentForm.payment_method_id);

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setPaymentForm((prev: any) => ({
                            ...prev,
                            payment_method_id: String(method.id),
                            payment_method:
                              method.method_type || method.name || "manual",
                          }));
                        }}
                        className={`group overflow-hidden rounded-[28px] border text-left transition ${
                          selected
                            ? "border-[#1B4F59] bg-[#123E46] text-white shadow-2xl shadow-teal-950/20"
                            : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-200/70"
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                  selected
                                    ? "bg-white/15 text-white"
                                    : "bg-teal-50 text-[#1B4F59]"
                                }`}
                              >
                                {getPaymentIcon(method)}
                              </div>

                              <div>
                                <p className="font-black">{method.name}</p>
                                <p
                                  className={`mt-1 text-xs font-bold ${
                                    selected ? "text-teal-50/80" : "text-slate-500"
                                  }`}
                                >
                                  {getMethodTypeLabel(method)}
                                </p>
                              </div>
                            </div>

                            {selected && (
                              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white">
                                Sélectionné
                              </span>
                            )}
                          </div>

                          <div
                            className={`mt-4 grid gap-2 text-sm font-semibold ${
                              selected ? "text-teal-50/90" : "text-slate-600"
                            }`}
                          >
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
                            <div
                              className={`mt-4 rounded-2xl p-3 text-sm font-bold leading-6 ${
                                selected
                                  ? "bg-white/10 text-white"
                                  : "bg-teal-50 text-[#1B4F59]"
                              }`}
                            >
                              {method.instructions}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <div className="grid gap-5 lg:grid-cols-2">
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
                  icon={<Banknote size={18} />}
                />

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Preuve de paiement <span className="text-red-500">*</span>
                  </label>

                  <label className="flex h-14 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-teal-300 bg-white px-4 text-center transition hover:border-[#1B4F59] hover:bg-teal-50">
                    <UploadCloud size={20} className="text-[#1B4F59]" />
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
              </div>

              <div className="mt-5">
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
                  className="min-h-24 w-full resize-none rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-semibold leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100"
                />
              </div>

              {selectedPaymentMethod && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <ShieldCheck className="mt-1 shrink-0 text-emerald-600" size={20} />
                  <p className="text-sm font-bold leading-7 text-emerald-800">
                    Méthode sélectionnée : {selectedPaymentMethod.name}. Après
                    l’envoi, le paiement reste en attente jusqu’à validation par
                    l’administration.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <ProfessionalTableCard
          icon={<CalendarDays size={28} />}
          badge="Rendez-vous"
          title="Mes rendez-vous"
          text="Suivez vos séances, les statuts et les actions de paiement."
        >
          {appointments.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={34} />}
              title="Aucun rendez-vous"
              text="Créez un rendez-vous avec votre psychologue pour commencer votre suivi."
            />
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse">
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

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {appointments.map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <TableCell>#{appointment.id}</TableCell>

                        <TableCell>
                          {formatDateTime(appointment.appointment_date)}
                        </TableCell>

                        <TableCell>
                          {appointment.duration_minutes || "—"} min
                        </TableCell>

                        <TableCell>
                          {appointment.psychologist_name || "—"}
                        </TableCell>

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
                            <button
                              type="button"
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
                              className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isPayableAppointment(appointment) &&
                                !isPaymentPendingForAppointment(
                                  payments,
                                  appointment.id
                                )
                                  ? "bg-[#123E46] text-white shadow-lg shadow-teal-950/15 hover:bg-[#1B4F59]"
                                  : "border border-slate-200 bg-slate-50 text-slate-400"
                              }`}
                            >
                              {paymentLoadingId === appointment.id ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : appointment.payment_status === "paid" ? (
                                <CheckCircle2 size={17} />
                              ) : (
                                <CreditCard size={17} />
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
                            </button>

                            <button
                              type="button"
                              disabled={
                                cancelLoadingId === appointment.id ||
                                appointment.status === "completed" ||
                                appointment.status === "cancelled"
                              }
                              onClick={() =>
                                handleCancelAppointment(appointment.id)
                              }
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {cancelLoadingId === appointment.id ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <Trash2 size={17} />
                              )}
                              Annuler
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ProfessionalTableCard>

        <div className="mt-7 grid gap-7 xl:grid-cols-[0.92fr_1.08fr]">
          <ProfessionalTableCard
            icon={<CreditCard size={28} />}
            badge="Paiements"
            title="Suivi des paiements"
            text="Historique des reçus envoyés et de leur validation."
          >
            {payments.length === 0 ? (
              <EmptyState
                icon={<CreditCard size={34} />}
                title="Aucun paiement"
                text="Le paiement d’un rendez-vous apparaîtra ici après envoi."
              />
            ) : (
              <div className="space-y-4">
                {payments.slice(0, 10).map((payment) => (
                  <PaymentHistoryCard key={payment.id} payment={payment} />
                ))}
              </div>
            )}
          </ProfessionalTableCard>

          <ProfessionalTableCard
            icon={<ReceiptText size={28} />}
            badge="Factures"
            title="Mes factures"
            text="Ouvrez la facture originale ou générez une version PDF imprimable."
          >
            {invoices.length === 0 ? (
              <EmptyState
                icon={<ReceiptText size={34} />}
                title="Aucune facture"
                text="Les factures apparaîtront ici après validation du paiement par l’administration."
              />
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1B4F59]">
                        Résumé factures
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        {invoices.length} facture(s) disponible(s)
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Total validé :{" "}
                        {formatMoney(
                          invoices.reduce(
                            (sum, invoice) => sum + Number(invoice.amount || 0),
                            0
                          ),
                          invoices[0]?.currency || "DZD"
                        )}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1B4F59] shadow-sm">
                      <ReceiptText size={22} />
                    </div>
                  </div>
                </div>

                {invoices.map((invoice) => (
                  <InvoiceCard
                    key={invoice.id || getInvoiceNumber(invoice)}
                    invoice={invoice}
                  />
                ))}
              </div>
            )}
          </ProfessionalTableCard>
        </div>
      </div>
    </main>
  );
}

function InvoiceCard({ invoice }: { invoice: any }) {
  const invoiceUrl = getInvoiceUrl(invoice);
  const invoiceNumber = getInvoiceNumber(invoice);
  const invoiceDate =
    invoice.created_at || invoice.issued_at || invoice.updated_at || invoice.date;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="bg-[#123E46] px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ReceiptText size={18} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-teal-50/75">
                Facture validée
              </p>

              <h3 className="mt-0.5 text-sm font-black text-white">
                {invoiceNumber}
              </h3>

              <p className="mt-0.5 text-[11px] font-semibold text-teal-50/70">
                Paiement #{invoice.payment_id || invoice.paymentId || "—"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-teal-50/70">
              Montant
            </p>

            <p className="mt-0.5 text-base font-black text-white">
              {formatMoney(invoice.amount, invoice.currency || "DZD")}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={invoice.status || "paid"} />

          {invoiceDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
              <CalendarDays size={11} />
              {formatDateTime(invoiceDate)}
            </span>
          )}

          {invoice.currency && (
            <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-black text-[#1B4F59]">
              {invoice.currency}
            </span>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <InvoiceInfoSmall label="N° facture" value={invoiceNumber} />
          <InvoiceInfoSmall
            label="ID paiement"
            value={invoice.payment_id || invoice.paymentId || "—"}
          />
          <InvoiceInfoSmall
            label="Montant"
            value={formatMoney(invoice.amount, invoice.currency || "DZD")}
          />
          <InvoiceInfoSmall
            label="Date"
            value={formatDateTime(
              invoice.created_at || invoice.issued_at || invoice.updated_at
            )}
          />
        </div>

        {invoice.description || invoice.notes ? (
          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
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
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#123E46] px-3 text-xs font-black text-white transition hover:bg-[#1B4F59]"
            >
              <FileText size={14} />
              Ouvrir
            </a>
          ) : (
            <div className="inline-flex h-9 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 px-3 text-xs font-black text-orange-700">
              Non disponible
            </div>
          )}

          <button
            type="button"
            onClick={() => printInvoicePdf(invoice)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50 px-3 text-xs font-black text-[#1B4F59] transition hover:bg-teal-100"
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceInfoSmall({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
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
      className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2 ${
        selected ? "bg-white/10" : "bg-slate-50"
      }`}
    >
      <span className={selected ? "text-teal-50/70" : "text-slate-400"}>
        {label}
      </span>

      <div className="flex items-center gap-2">
        <strong className={selected ? "text-white" : "text-slate-800"}>
          {value}
        </strong>

        {copy && (
          <span
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
          </span>
        )}
      </div>
    </div>
  );
}

function PaymentHistoryCard({ payment }: { payment: any }) {
  return (
    <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5 transition hover:bg-white hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1B4F59] shadow-sm">
            <CreditCard size={22} />
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
          <p className="text-lg font-black text-slate-950">
            {formatMoney(payment.amount, payment.currency || "DZD")}
          </p>

          <div className="mt-2">
            <StatusBadge status={payment.status} />
          </div>
        </div>
      </div>
    </div>
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

function NoticeBox({
  type,
  children,
}: {
  type: "info" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-sm font-bold leading-7 ${
        type === "warning"
          ? "border-orange-100 bg-orange-50 text-orange-700"
          : "border-teal-100 bg-teal-50 text-slate-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {type === "warning" ? (
          <AlertCircle className="mt-1 shrink-0 text-orange-600" size={20} />
        ) : (
          <BadgeCheck className="mt-1 shrink-0 text-[#1B4F59]" size={20} />
        )}
        <p>{children}</p>
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
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-black text-[#1B4F59]">
          {badge}
        </div>

        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500 md:text-base">
          {text}
        </p>
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
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur"
    >
      <div className="mb-5 inline-flex rounded-2xl bg-teal-50 p-4 text-[#1B4F59]">
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
    </motion.div>
  );
}

function PaymentStatCard({
  icon,
  label,
  value,
  helper,
  success = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
  success?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
      <div
        className={`mb-4 inline-flex rounded-2xl p-3 ${
          success ? "bg-emerald-50 text-emerald-600" : "bg-white text-[#1B4F59]"
        }`}
      >
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
    </div>
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
          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100"
        />
      </div>
    </div>
  );
}

function ProfessionalTableCard({
  icon,
  badge,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
      <SectionHeader icon={icon} badge={badge} title={title} text={text} />
      <div className="mt-7">{children}</div>
    </section>
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
    <div className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto mb-5 inline-flex rounded-3xl bg-white p-4 text-[#1B4F59] shadow-sm">
          {icon}
        </div>

        <h3 className="text-xl font-black text-slate-950">{title}</h3>

        <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
          {text}
        </p>
      </div>
    </div>
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
      className={`px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500 ${
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
      className={`px-5 py-4 text-sm font-semibold text-slate-700 ${
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
      <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
        En ligne
      </span>
    );
  }

  if (value === "in_person") {
    return (
      <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
        Présentiel
      </span>
    );
  }

  if (value === "paid" || value === "confirmed" || value === "completed") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        {status || "validé"}
      </span>
    );
  }

  if (
    value === "manual_pending" ||
    value === "unpaid" ||
    value === "pending" ||
    value === "pending_payment"
  ) {
    return (
      <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
        {value === "manual_pending" ? "en validation" : status || "en attente"}
      </span>
    );
  }

  if (value === "failed" || value === "cancelled" || value === "no_show") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
        {status || "annulé"}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      {status || "unknown"}
    </span>
  );
}