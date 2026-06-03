"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  RefreshCcw,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";

import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  getMyPatients,
  getMyPsychologistProfile,
} from "@/lib/psychologistsApi";
import {
  getPsychologistAppointments,
  updateAppointmentStatus,
} from "@/lib/appointmentsApi";
import { getMyPsychologistPayouts } from "@/lib/paymentsApi";
import { createSlot, getMySlots, deleteSlot } from "@/lib/slotsApi";

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

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildSlotDateTime(date: string, time: string) {
  if (!date || !time) return null;
  return new Date(`${date}T${time}`);
}

function isSlotPassed(date: string, time: string) {
  const slotDateTime = buildSlotDateTime(date, time);

  if (!slotDateTime || Number.isNaN(slotDateTime.getTime())) {
    return true;
  }

  return slotDateTime.getTime() <= new Date().getTime();
}

function formatMoney(value: any, currency = "DZD") {
  const numberValue = Number(value || 0);

  return `${numberValue.toLocaleString("fr-DZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency || "DZD"}`;
}

function getPayoutNetAmount(payout: any) {
  return Number(
    payout?.net_amount ??
      payout?.psychologist_net ??
      payout?.psychologist_net_amount ??
      payout?.amount ??
      0
  );
}

function getPayoutGrossAmount(payout: any) {
  return Number(payout?.gross_amount ?? payout?.amount ?? 0);
}

function getPayoutPlatformFee(payout: any) {
  return Number(payout?.platform_fee ?? payout?.admin_commission ?? 0);
}

export default function PsychologistDashboardPage() {
  const { loading } = useAuthGuard(["PSYCHOLOGIST"]);

  const [profile, setProfile] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  const [slotForm, setSlotForm] = useState({
    slot_date: getTodayDate(),
    start_time: "10:00",
    end_time: "10:45",
    mode: "online",
  });

  const [slotLoading, setSlotLoading] = useState(false);
  const [slotDeleteLoadingId, setSlotDeleteLoadingId] = useState<
    number | string | null
  >(null);
  const [deleteConfirmSlot, setDeleteConfirmSlot] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(
    null
  );

  async function load() {
    setError("");
    setLoadingData(true);

    try {
      const [me, patientsData, appointmentsData, payoutsData, slotsData] =
        await Promise.all([
          getMyPsychologistProfile(),
          getMyPatients(),
          getPsychologistAppointments(),
          getMyPsychologistPayouts().catch(() => ({ payouts: [] })),
          getMySlots().catch(() => ({ slots: [] })),
        ]);

      const appointmentsList = (appointmentsData as any).appointments || [];
      const payoutsList = (payoutsData as any).payouts || [];
      const slotsList = (slotsData as any).slots || [];

      setProfile((me as any).psychologist);
      setPatients((patientsData as any).patients || []);
      setAppointments(appointmentsList);
      setFilteredAppointments(
        applyFilterAndSearch(appointmentsList, statusFilter, searchText)
      );
      setPayouts(payoutsList);
      setSlots(slotsList);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Erreur chargement psychologue");
    } finally {
      setLoadingData(false);
    }
  }

  function applyFilterAndSearch(list: any[], filter: string, search: string) {
    let result = [...list];

    if (filter !== "all") {
      result = result.filter((appointment) => appointment.status === filter);
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((appointment) => {
        return (
          String(appointment.id || "").toLowerCase().includes(query) ||
          String(appointment.user_name || "").toLowerCase().includes(query) ||
          String(appointment.user_email || "").toLowerCase().includes(query) ||
          String(appointment.risk_level || "").toLowerCase().includes(query) ||
          String(appointment.status || "").toLowerCase().includes(query)
        );
      });
    }

    return result;
  }

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setCurrentPage(1);
    setFilteredAppointments(
      applyFilterAndSearch(appointments, value, searchText)
    );
  }

  function handleSearchChange(value: string) {
    setSearchText(value);
    setCurrentPage(1);
    setFilteredAppointments(
      applyFilterAndSearch(appointments, statusFilter, value)
    );
  }

  function handleItemsPerPageChange(value: string) {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!slotForm.slot_date) {
      setError("La date du créneau est obligatoire.");
      return;
    }

    if (!slotForm.start_time || !slotForm.end_time) {
      setError("Heure début et heure fin sont obligatoires.");
      return;
    }

    if (slotForm.start_time >= slotForm.end_time) {
      setError("L’heure de fin doit être supérieure à l’heure de début.");
      return;
    }

    if (isSlotPassed(slotForm.slot_date, slotForm.start_time)) {
      setError("Impossible de créer un créneau dans le passé.");
      return;
    }

    try {
      setSlotLoading(true);

      const data: any = await createSlot({
        slot_date: slotForm.slot_date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        mode: slotForm.mode as "online" | "in_person",
      });

      setMessage(data.message || "Créneau ajouté avec succès.");

      const slotsData: any = await getMySlots();
      setSlots(slotsData.slots || []);
    } catch (err: any) {
      setError(err.message || "Erreur ajout créneau");
    } finally {
      setSlotLoading(false);
    }
  }

  async function handleDeleteSlot(id: number | string) {
    setError("");
    setMessage("");
    setSlotDeleteLoadingId(id);

    try {
      const data: any = await deleteSlot(id);

      setMessage(data.message || "Créneau supprimé avec succès.");
      setDeleteConfirmSlot(null);

      const slotsData: any = await getMySlots();
      setSlots(slotsData.slots || []);
    } catch (err: any) {
      setError(err.message || "Erreur suppression créneau");
    } finally {
      setSlotDeleteLoadingId(null);
    }
  }

  async function setStatus(id: number, status: any) {
    if (!status) return;

    setError("");
    setMessage("");
    setActionLoadingId(id);

    try {
      const data: any = await updateAppointmentStatus(id, status);
      setMessage(data.message || "Statut modifié avec succès");

      const [appointmentsData, slotsData] = await Promise.all([
        getPsychologistAppointments(),
        getMySlots().catch(() => ({ slots: [] })),
      ]);

      const list = (appointmentsData as any).appointments || [];

      setAppointments(list);
      setFilteredAppointments(
        applyFilterAndSearch(list, statusFilter, searchText)
      );
      setSlots((slotsData as any).slots || []);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Erreur modification statut");
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    if (!loading) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const confirmedCount = appointments.filter(
    (appointment) => appointment.status === "confirmed"
  ).length;

  const completedCount = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;

  const pendingCount = appointments.filter(
    (appointment) =>
      appointment.status === "pending" ||
      appointment.status === "pending_payment"
  ).length;

  const totalPayoutAmount = payouts.reduce((sum, payout) => {
    return sum + getPayoutNetAmount(payout);
  }, 0);

  const pendingPayoutAmount = payouts
    .filter((payout) => String(payout.status || "").toLowerCase() === "pending")
    .reduce((sum, payout) => sum + getPayoutNetAmount(payout), 0);

  const paidPayoutAmount = payouts
    .filter((payout) => String(payout.status || "").toLowerCase() === "paid")
    .reduce((sum, payout) => sum + getPayoutNetAmount(payout), 0);

  const totalGrossAmount = payouts.reduce((sum, payout) => {
    return sum + getPayoutGrossAmount(payout);
  }, 0);

  const totalPlatformFee = payouts.reduce((sum, payout) => {
    return sum + getPayoutPlatformFee(payout);
  }, 0);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / itemsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, safeCurrentPage, itemsPerPage]);

  const startItem =
    filteredAppointments.length === 0
      ? 0
      : (safeCurrentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    safeCurrentPage * itemsPerPage,
    filteredAppointments.length
  );

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  if (loading) {
    return (
      <main className="relative min-h-screen bg-[#EEF7F8]">
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
    <main className="relative min-h-screen overflow-hidden bg-[#EEF7F8] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute right-[-180px] top-40 h-[460px] w-[460px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 overflow-hidden rounded-[36px] border border-white/15 bg-[radial-gradient(circle_at_top_left,#2E7B86_0%,#1B4F59_42%,#0B2530_100%)] p-7 text-white shadow-2xl shadow-teal-950/25 md:p-10"
        >
          <div className="relative">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                  <Stethoscope size={16} />
                  Espace psychologue
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
                  {profile
                    ? `Bonjour ${profile.full_name}`
                    : "Dashboard psychologue"}
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50/85">
                  Créez vos créneaux, confirmez les rendez-vous et suivez vos
                  patients depuis un espace organisé.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/psychologist/patients"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <UsersRound size={18} />
                  Voir patients
                </Link>

                <button
                  type="button"
                  onClick={load}
                  disabled={loadingData}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingData ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCcw size={18} />
                  )}
                  Actualiser
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {error && <AlertMessage type="error" message={error} />}
        {message && <AlertMessage type="success" message={message} />}

        {deleteConfirmSlot && (
          <DeleteConfirmModal
            slot={deleteConfirmSlot}
            loading={slotDeleteLoadingId === deleteConfirmSlot.id}
            onCancel={() => {
              if (slotDeleteLoadingId) return;
              setDeleteConfirmSlot(null);
            }}
            onConfirm={() => handleDeleteSlot(deleteConfirmSlot.id)}
          />
        )}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon={<UsersRound size={24} />}
            label="Patients"
            value={patients.length}
            helper="Patients affectés"
            delay={0.1}
          />

          <StatBox
            icon={<CalendarDays size={24} />}
            label="Rendez-vous"
            value={appointments.length}
            helper={`En attente : ${pendingCount}`}
            delay={0.15}
          />

          <StatBox
            icon={<Clock size={24} />}
            label="Créneaux"
            value={slots.length}
            helper="Disponibilités créées"
            delay={0.2}
          />

          <StatBox
            icon={<Wallet size={24} />}
            label="Revenus total"
            value={formatMoney(totalPayoutAmount)}
            helper={`En attente : ${formatMoney(pendingPayoutAmount)}`}
            delay={0.25}
          />
        </section>

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon={<CheckCircle2 size={24} />}
            label="Confirmés"
            value={confirmedCount}
            helper={`Terminés : ${completedCount}`}
            delay={0.1}
            success
          />

          <StatBox
            icon={<Wallet size={24} />}
            label="Net déjà payé"
            value={formatMoney(paidPayoutAmount)}
            helper="Montant versé au psychologue"
            delay={0.15}
            success
          />

          <StatBox
            icon={<Wallet size={24} />}
            label="Brut séances"
            value={formatMoney(totalGrossAmount)}
            helper="Montant payé par les patients"
            delay={0.2}
          />

          <StatBox
            icon={<Wallet size={24} />}
            label="Commission plateforme"
            value={formatMoney(totalPlatformFee)}
            helper="Part plateforme"
            delay={0.25}
          />
        </section>

        {profile && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className="mb-8 rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-teal-50 text-[#1B4F59]">
                  <Stethoscope size={34} />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-black text-[#1B4F59]">
                    <BadgeCheck size={16} />
                    Profil professionnel
                  </div>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                    {profile.full_name}
                  </h2>

                  <p className="mt-2 text-base font-semibold text-slate-500">
                    {profile.specialization || "Spécialité non définie"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard
                  icon={<Mail size={18} />}
                  label="Email"
                  value={profile.email || "—"}
                />

                <InfoCard
                  icon={<MapPin size={18} />}
                  label="Ville"
                  value={profile.city || "—"}
                />

                <InfoCard
                  icon={<Wallet size={18} />}
                  label="Consultation"
                  value={formatMoney(
                    profile.consultation_price || 0,
                    profile.currency || "DZD"
                  )}
                />
              </div>
            </div>
          </motion.section>
        )}

        <section className="mb-8 rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <SectionTitle
            icon={<Clock size={30} />}
            badge="Disponibilité"
            title="Mes créneaux"
            text="Ajoutez des dates et heures. Ces créneaux seront visibles par les utilisateurs."
          />

          <form
            onSubmit={handleCreateSlot}
            className="mt-7 grid gap-4 lg:grid-cols-5"
          >
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-slate-500">
                Date
              </label>

              <input
                type="date"
                min={getTodayDate()}
                value={slotForm.slot_date}
                onChange={(e) =>
                  setSlotForm((prev) => ({
                    ...prev,
                    slot_date: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-700 outline-none focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase text-slate-500">
                Début
              </label>

              <input
                type="time"
                value={slotForm.start_time}
                onChange={(e) =>
                  setSlotForm((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-700 outline-none focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase text-slate-500">
                Fin
              </label>

              <input
                type="time"
                value={slotForm.end_time}
                onChange={(e) =>
                  setSlotForm((prev) => ({
                    ...prev,
                    end_time: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-700 outline-none focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase text-slate-500">
                Mode
              </label>

              <select
                value={slotForm.mode}
                onChange={(e) =>
                  setSlotForm((prev) => ({
                    ...prev,
                    mode: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-700 outline-none focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100"
              >
                <option value="online">En ligne</option>
                <option value="in_person">Présentiel</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={slotLoading}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#1B4F59] to-[#2E7B86] px-5 font-black text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {slotLoading ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </form>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {slots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                Aucun créneau ajouté.
              </div>
            ) : (
              slots.map((slot, index) => (
                <div
                  key={`${slot.id}-${slot.appointment_id || "empty"}-${index}`}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-900/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-black text-[#1B4F59]">
                        <CalendarDays size={17} />
                        {formatSlotDate(slot.slot_date)}
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Clock size={17} />
                        {String(slot.start_time).slice(0, 5)} -{" "}
                        {String(slot.end_time).slice(0, 5)}
                      </p>
                    </div>

                    <SlotStatusBadge status={slot.status} />
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-bold text-slate-500">
                      {slot.mode === "in_person" ? "Présentiel" : "En ligne"}
                    </p>

                    {slot.user_name || slot.user_email ? (
                      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-600">
                          Pris par
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-900">
                          {slot.user_name || "Patient"}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <Mail size={13} />
                          {slot.user_email || "Email non défini"}
                        </p>

                        {slot.appointment_status && (
                          <div className="mt-2">
                            <StatusBadge status={slot.appointment_status} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                        Aucun patient n’a pris ce créneau.
                      </div>
                    )}
                  </div>

                  {slot.status !== "booked" && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmSlot(slot)}
                      disabled={slotDeleteLoadingId === slot.id}
                      className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {slotDeleteLoadingId === slot.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}

                      {slotDeleteLoadingId === slot.id
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55 }}
          className="mb-8 rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <Search size={16} />
                Filtres
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Rechercher et filtrer les rendez-vous
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                Recherchez par patient, email, risque ou statut.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_280px]">
            <SearchInput
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Rechercher un rendez-vous..."
            />

            <FilterSelect value={statusFilter} onChange={handleFilterChange} />
          </div>
        </motion.section>

        <section className="mb-8 rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <SectionTitle
            icon={<CalendarCheck size={30} />}
            badge="Rendez-vous"
            title="Liste des rendez-vous"
            text="Confirmez, terminez ou annulez les rendez-vous depuis le menu d’action."
          />

          {loadingData ? (
            <LoadingBox text="Chargement des rendez-vous..." />
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={34} />}
              title="Aucun rendez-vous trouvé"
              text="Aucun rendez-vous ne correspond au filtre ou à la recherche actuelle."
            />
          ) : (
            <>
              <div className="mb-5 mt-7 flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    Affichage {startItem} - {endItem} sur{" "}
                    {filteredAppointments.length} rendez-vous
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Page {safeCurrentPage} sur {totalPages}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold text-slate-500">
                    Par page
                  </label>

                  <select
                    value={String(itemsPerPage)}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none focus:border-[#1B4F59] focus:ring-4 focus:ring-teal-100"
                  >
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-100 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-teal-50/40 text-left">
                        <TableHead>ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Risque</TableHead>
                        <TableHead align="right">Actions</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedAppointments.map((appointment) => (
                        <tr
                          key={appointment.id}
                          className="transition hover:bg-teal-50/40"
                        >
                          <TableCell>
                            <span className="font-black text-slate-950">
                              #{appointment.id}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59]">
                                <UserRound size={22} />
                              </div>

                              <div>
                                <p className="font-black text-slate-950">
                                  {appointment.user_name || "Patient"}
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                                  <Mail size={13} />
                                  {appointment.user_email || "Email non défini"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-slate-400" />
                              <span>
                                {formatDateTime(appointment.appointment_date)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <StatusBadge status={appointment.status} />
                          </TableCell>

                          <TableCell>
                            <RiskBadge risk={appointment.risk_level} />
                          </TableCell>

                          <TableCell align="right">
                            <ActionSelect
                              appointment={appointment}
                              loadingId={actionLoadingId}
                              onAction={setStatus}
                            />
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                visiblePages={visiblePages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>

        <section className="mb-8 rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <SectionTitle
            icon={<UsersRound size={30} />}
            badge="Patients"
            title="Derniers patients"
            text="Aperçu rapide des derniers patients affectés à votre suivi."
          />

          {patients.length === 0 ? (
            <div className="mt-7">
              <EmptyState
                icon={<UsersRound size={34} />}
                title="Aucun patient affecté"
                text="Les patients affectés apparaîtront ici."
              />
            </div>
          ) : (
            <div className="mt-7 overflow-hidden rounded-[26px] border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-teal-50/40 text-left">
                      <TableHead>Patient</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Risque</TableHead>
                      <TableHead>Type</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {patients.slice(0, 6).map((patient) => (
                      <tr
                        key={patient.assignment_id || patient.id}
                        className="transition hover:bg-teal-50/40"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59]">
                              <UserRound size={22} />
                            </div>

                            <span className="font-black text-slate-950">
                              {patient.full_name || "Patient"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>{patient.email || "—"}</TableCell>
                        <TableCell>{patient.city || "—"}</TableCell>

                        <TableCell>
                          <RiskBadge risk={patient.risk_level} />
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            {patient.addiction_type || "—"}
                          </span>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <SectionTitle
            icon={<Wallet size={30} />}
            badge="Revenus"
            title="Détail des revenus"
            text="Détail des montants générés par les paiements validés."
          />

          {payouts.length === 0 ? (
            <div className="mt-7">
              <EmptyState
                icon={<Wallet size={34} />}
                title="Aucun revenu trouvé"
                text="Les revenus apparaîtront ici après validation des paiements par l’administration."
              />
            </div>
          ) : (
            <div className="mt-7 overflow-hidden rounded-[26px] border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-teal-50/40 text-left">
                      <TableHead>ID</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Brut</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payouts.slice(0, 8).map((payout) => (
                      <tr
                        key={payout.id || payout.payment_id}
                        className="transition hover:bg-teal-50/40"
                      >
                        <TableCell>
                          <span className="font-black text-slate-950">
                            #{payout.id}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-black text-slate-950">
                            #{payout.payment_id || "—"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {formatMoney(getPayoutGrossAmount(payout))}
                        </TableCell>

                        <TableCell>
                          {formatMoney(getPayoutPlatformFee(payout))}
                        </TableCell>

                        <TableCell>
                          <strong className="text-slate-950">
                            {formatMoney(getPayoutNetAmount(payout))}
                          </strong>
                        </TableCell>

                        <TableCell>
                          <PayoutStatusBadge status={payout.status} />
                        </TableCell>

                        <TableCell>
                          {formatDateTime(
                            payout.created_at ||
                              payout.paid_at ||
                              payout.updated_at
                          )}
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DeleteConfirmModal({
  slot,
  loading,
  onCancel,
  onConfirm,
}: {
  slot: any;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-[32px] border border-red-100 bg-white p-6 shadow-2xl shadow-slate-950/25"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={26} />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-950">
              Supprimer le créneau ?
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Cette action est irréversible. Le créneau sera supprimé
              définitivement.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-[#1B4F59]">
            <CalendarDays size={16} />
            {formatSlotDate(slot.slot_date)}
          </p>

          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600">
            <Clock size={16} />
            {String(slot.start_time).slice(0, 5)} - {String(slot.end_time).slice(0, 5)}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </motion.div>
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

function SlotStatusBadge({ status }: { status: string }) {
  const value = String(status || "").toLowerCase();

  if (value === "available") {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
        Disponible
      </span>
    );
  }

  if (value === "pending") {
    return (
      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
        En attente
      </span>
    );
  }

  if (value === "booked") {
    return (
      <span className="rounded-full bg-[#1B4F59]/10 px-3 py-1 text-xs font-black text-[#1B4F59]">
        Réservé
      </span>
    );
  }

  if (value === "cancelled") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
        Annulé
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600">
      {status || "unknown"}
    </span>
  );
}

function StatBox({
  icon,
  label,
  value,
  helper,
  delay,
  success = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
  delay: number;
  success?: boolean;
}) {
  const iconClass = success
    ? "bg-emerald-50 text-emerald-600"
    : "bg-teal-50 text-[#1B4F59]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group relative overflow-hidden rounded-[30px] border border-white bg-white/95 p-6 shadow-xl shadow-slate-200/70 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-900/10"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-100/50 blur-2xl transition group-hover:scale-125" />
      <div className={`relative mb-5 inline-flex rounded-2xl p-4 ${iconClass}`}>
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>

      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>

      <p className="mt-2 text-sm font-semibold text-slate-400">{helper}</p>
    </motion.div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="mb-2 inline-flex text-[#1B4F59]">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function SectionTitle({
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

function LoadingBox({ text }: { text: string }) {
  return (
    <div className="mt-7 flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
        <p className="font-bold text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        Recherche
      </label>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
        />
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        Statut
      </label>

      <div className="relative">
        <CalendarDays
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-10 text-sm font-black text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
        >
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="pending_payment">Paiement en attente</option>
          <option value="confirmed">Confirmés</option>
          <option value="completed">Terminés</option>
          <option value="cancelled">Annulés</option>
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>
    </div>
  );
}

function ActionSelect({
  appointment,
  loadingId,
  onAction,
}: {
  appointment: any;
  loadingId: number | string | null;
  onAction: (id: number, status: any) => void;
}) {
  const isLoading = loadingId === appointment.id;

  const status = String(appointment.status || "").toLowerCase();

  const isFinal =
    status === "completed" || status === "cancelled" || status === "no_show";

  return (
    <div className="relative ml-auto w-[210px]">
      {isLoading ? (
        <Loader2
          size={17}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 animate-spin text-[#1B4F59]"
        />
      ) : (
        <CheckCircle2
          size={17}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#1B4F59]"
        />
      )}

      <select
        value=""
        disabled={isLoading || isFinal}
        onChange={(e) => onAction(appointment.id, e.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-black text-[#1B4F59] outline-none transition hover:bg-white focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {isLoading
            ? "Traitement..."
            : isFinal
            ? "Action terminée"
            : "Choisir action"}
        </option>

        {status !== "confirmed" && <option value="confirmed">Confirmer</option>}

        {status !== "completed" && <option value="completed">Terminer</option>}

        {status !== "cancelled" && <option value="cancelled">Annuler</option>}
      </select>

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#1B4F59]">
        ▾
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const value = String(status || "").toLowerCase();

  if (value === "confirmed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        <CheckCircle2 size={14} />
        Confirmé
      </span>
    );
  }

  if (value === "completed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-[#1B4F59]">
        <BadgeCheck size={14} />
        Terminé
      </span>
    );
  }

  if (value === "cancelled" || value === "no_show") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
        <Trash2 size={14} />
        Annulé
      </span>
    );
  }

  if (value === "pending" || value === "pending_payment") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
        <AlertCircle size={14} />
        En attente
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      {status || "unknown"}
    </span>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  const value = String(status || "").toLowerCase();

  if (value === "paid") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        <CheckCircle2 size={14} />
        Payé
      </span>
    );
  }

  if (value === "pending") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
        <AlertCircle size={14} />
        En attente
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      {status || "unknown"}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const value = String(risk || "").toLowerCase();

  if (value === "critique" || value === "critical") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
        Critique
      </span>
    );
  }

  if (value === "eleve" || value === "élevé" || value === "high") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
        Élevé
      </span>
    );
  }

  if (value === "medium" || value === "moyen") {
    return (
      <span className="inline-flex rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">
        Moyen
      </span>
    );
  }

  if (value === "low" || value === "faible") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        Faible
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      {risk || "unknown"}
    </span>
  );
}

function Pagination({
  currentPage,
  totalPages,
  visiblePages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  visiblePages: number[];
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-slate-500">Navigation des pages</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-teal-50 hover:text-[#1B4F59] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={17} />
          Précédent
        </button>

        {visiblePages[0] > 1 && (
          <>
            <PageButton
              page={1}
              active={currentPage === 1}
              onClick={onPageChange}
            />
            <span className="px-2 text-sm font-black text-slate-400">...</span>
          </>
        )}

        {visiblePages.map((page) => (
          <PageButton
            key={page}
            page={page}
            active={currentPage === page}
            onClick={onPageChange}
          />
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            <span className="px-2 text-sm font-black text-slate-400">...</span>
            <PageButton
              page={totalPages}
              active={currentPage === totalPages}
              onClick={onPageChange}
            />
          </>
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-teal-50 hover:text-[#1B4F59] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suivant
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

function PageButton({
  page,
  active,
  onClick,
}: {
  page: number;
  active: boolean;
  onClick: (page: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      className={`h-11 min-w-11 rounded-2xl px-4 text-sm font-black transition ${
        active
          ? "bg-[#1B4F59] text-white shadow-lg shadow-teal-900/15"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-teal-50 hover:text-[#1B4F59]"
      }`}
    >
      {page}
    </button>
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
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
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