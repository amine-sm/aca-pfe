"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  HandCoins,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
  Stethoscope,
  Wallet,
} from "lucide-react";

import {
  getPsychologistCommissions,
  payPsychologistPayouts,
} from "@/lib/adminApi";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

function formatMoney(value: any) {
  const numberValue = Number(value || 0);

  return `${numberValue.toLocaleString("fr-DZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} DZD`;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfCurrentMonth() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export default function AdminPsychologistCommissionsPage() {
  const { loading } = useAuthGuard(["ADMIN", "SUPER_ADMIN"]);

  const defaultFrom = useMemo(() => getFirstDayOfCurrentMonth(), []);
  const defaultTo = useMemo(() => getTodayDate(), []);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const [data, setData] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [payingId, setPayingId] = useState<number | string | null>(null);

  const [payoutAmounts, setPayoutAmounts] = useState<Record<string, string>>(
    {}
  );

  async function load(customFrom = from, customTo = to) {
    try {
      setError("");
      setLoadingData(true);

      const result: any = await getPsychologistCommissions({
        from: customFrom,
        to: customTo,
      });

      setData(result);
      setCommissions(result?.commissions || []);
    } catch (err: any) {
      setError(err.message || "Erreur chargement commissions psychologues");
    } finally {
      setLoadingData(false);
    }
  }

  function handleFilter() {
    if (from && to && from > to) {
      setError("La date de début ne peut pas être supérieure à la date de fin.");
      setMessage("");
      return;
    }

    load(from, to);
  }

  function handleCurrentMonth() {
    const firstDay = getFirstDayOfCurrentMonth();
    const today = getTodayDate();

    setFrom(firstDay);
    setTo(today);

    load(firstDay, today);
  }

  function handleReset() {
    setFrom("");
    setTo("");

    load("", "");
  }

  async function handlePayPsychologist(
    psychologistId: number | string,
    maxAmount: number
  ) {
    const amountValue = payoutAmounts[String(psychologistId)];
    const amountNumber = Number(amountValue || 0);

    if (!amountValue || amountNumber <= 0) {
      setError("Veuillez saisir un montant de payout supérieur à 0.");
      setMessage("");
      return;
    }

    if (amountNumber > maxAmount) {
      setError(
        `Le montant saisi dépasse le montant en attente : ${formatMoney(
          maxAmount
        )}`
      );
      setMessage("");
      return;
    }

    const ok = window.confirm(
      `Confirmer le payout de ${formatMoney(amountNumber)} pour ce psychologue ?`
    );

    if (!ok) return;

    try {
      setError("");
      setMessage("");
      setPayingId(psychologistId);

      const result: any = await payPsychologistPayouts(psychologistId, {
        from,
        to,
        amount: amountNumber,
      });

      setMessage(
        result.message ||
          `Payout effectué avec succès. Montant payé : ${formatMoney(
            result.total_paid
          )}`
      );

      setPayoutAmounts((prev) => ({
        ...prev,
        [String(psychologistId)]: "",
      }));

      await load(from, to);
    } catch (err: any) {
      setError(err.message || "Erreur lors du payout psychologue");
    } finally {
      setPayingId(null);
    }
  }

  useEffect(() => {
    if (!loading) {
      load(defaultFrom, defaultTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
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

  const totals = data?.totals || {};

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7FAFB] text-slate-900">
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
          className="mb-8 overflow-hidden rounded-[34px] bg-[#1B4F59] p-7 text-white shadow-2xl shadow-teal-900/20 md:p-10"
        >
          <div className="relative">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                  <HandCoins size={16} />
                  Commissions
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
                  Commissions par psychologue
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50/85">
                  Suivez le montant brut, la commission plateforme, le net à
                  payer et effectuez les payouts partiels.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin/psychologists"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#1B4F59] shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-50"
                >
                  <ArrowLeft size={18} />
                  Retour psychologues
                </Link>

                <Link
                  href="/admin/payments"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  <CreditCard size={18} />
                  Paiements
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {error && <AlertMessage type="error" message={error} />}
        {message && <AlertMessage type="success" message={message} />}

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55 }}
          className="mb-8 rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <CalendarDays size={16} />
                Filtre par période
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Période des commissions
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                Affichez les commissions selon une période précise ou consultez
                tout l’historique.
              </p>
            </div>

            {data?.filters && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Période active
                </p>
                <p className="mt-1 text-sm font-black text-slate-900">
                  {data.filters.from || "Début"} → {data.filters.to || "Fin"}
                </p>
              </div>
            )}
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <InputDate
              label="Du"
              value={from}
              onChange={setFrom}
              icon={<CalendarDays size={18} />}
            />

            <InputDate
              label="Au"
              value={to}
              onChange={setTo}
              icon={<CalendarDays size={18} />}
            />

            <button
              type="button"
              onClick={handleFilter}
              disabled={loadingData}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-6 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingData ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              Filtrer
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <FilterButton
              label="Mois actuel"
              onClick={handleCurrentMonth}
              disabled={loadingData}
              icon={<CalendarDays size={17} />}
              variant="secondary"
            />

            <FilterButton
              label="Tout l’historique"
              onClick={handleReset}
              disabled={loadingData}
              icon={<RefreshCcw size={17} />}
              variant="light"
            />
          </div>
        </motion.section>

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <StatBox
            icon={<Banknote size={24} />}
            label="Montant brut total"
            value={formatMoney(totals.total_gross_amount)}
            helper="Total payé par les clients"
            delay={0.1}
          />

          <StatBox
            icon={<HandCoins size={24} />}
            label="Commission admin"
            value={formatMoney(totals.total_admin_commission)}
            helper="Commission plateforme"
            delay={0.15}
          />

          <StatBox
            icon={<Wallet size={24} />}
            label="Net psychologues"
            value={formatMoney(totals.total_psychologist_net)}
            helper="Montant total des psychologues"
            delay={0.2}
          />

          <StatBox
            icon={<Wallet size={24} />}
            label="Net en attente"
            value={formatMoney(totals.total_pending_psychologist_net)}
            helper="À payer aux psychologues"
            delay={0.25}
            warn
          />

          <StatBox
            icon={<Banknote size={24} />}
            label="Net déjà payé"
            value={formatMoney(totals.total_paid_psychologist_net)}
            helper="Déjà versé"
            delay={0.3}
            success
          />

          <StatBox
            icon={<Stethoscope size={24} />}
            label="Nombre payouts"
            value={totals.total_payouts || 0}
            helper="Payouts concernés"
            delay={0.35}
          />
        </section>

        <section className="rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <Stethoscope size={16} />
                Détail
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Détail par psychologue
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                Saisissez le montant exact à payer, puis cliquez sur{" "}
                <strong>Payer</strong>.
              </p>
            </div>

            <div className="hidden rounded-3xl bg-teal-50 p-4 text-[#1B4F59] md:block">
              <HandCoins size={30} />
            </div>
          </div>

          {loadingData ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
                <p className="font-bold text-slate-600">
                  Chargement des commissions...
                </p>
              </div>
            </div>
          ) : commissions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-hidden rounded-[26px] border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1450px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <TableHead>Psychologue</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Payouts</TableHead>
                      <TableHead>Brut</TableHead>
                      <TableHead>Commission admin</TableHead>
                      <TableHead>Net psychologue</TableHead>
                      <TableHead>En attente</TableHead>
                      <TableHead>Payé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead align="right">Payout</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {commissions.map((item) => {
                      const pendingAmount = Number(
                        item.pending_psychologist_net || 0
                      );

                      const hasPending = pendingAmount > 0;

                      const currentAmount =
                        payoutAmounts[String(item.psychologist_id)] || "";

                      return (
                        <tr
                          key={item.psychologist_id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59]">
                                <Stethoscope size={22} />
                              </div>

                              <div>
                                <p className="font-black text-slate-950">
                                  {item.psychologist_name || "Psychologue"}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                  {item.psychologist_specialization ||
                                    "Spécialité non définie"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail size={16} className="text-slate-400" />
                              <span>{item.psychologist_email || "—"}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone size={16} className="text-slate-400" />
                              <span>{item.psychologist_phone || "—"}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-slate-400" />
                              <span>{item.psychologist_city || "—"}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {item.payouts_count || 0}
                            </span>
                          </TableCell>

                          <TableCell>
                            <strong className="text-slate-950">
                              {formatMoney(item.total_gross_amount)}
                            </strong>
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-[#1B4F59]">
                              {formatMoney(item.total_admin_commission)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <strong className="text-slate-950">
                              {formatMoney(item.total_psychologist_net)}
                            </strong>
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                              {formatMoney(item.pending_psychologist_net)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                              {formatMoney(item.paid_psychologist_net)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <PayoutStatusBadge status={item.payout_status} />
                          </TableCell>

                          <TableCell align="right">
                            <div className="flex justify-end gap-2">
                              <input
                                type="number"
                                min="1"
                                max={pendingAmount}
                                value={currentAmount}
                                onChange={(e) =>
                                  setPayoutAmounts((prev) => ({
                                    ...prev,
                                    [String(item.psychologist_id)]:
                                      e.target.value,
                                  }))
                                }
                                placeholder="Montant"
                                disabled={
                                  payingId === item.psychologist_id ||
                                  !hasPending
                                }
                                className="h-11 w-32 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                              />

                              <button
                                type="button"
                                disabled={
                                  payingId === item.psychologist_id ||
                                  !hasPending
                                }
                                onClick={() =>
                                  handlePayPsychologist(
                                    item.psychologist_id,
                                    pendingAmount
                                  )
                                }
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-4 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {payingId === item.psychologist_id ? (
                                  <Loader2 size={17} className="animate-spin" />
                                ) : (
                                  <Wallet size={17} />
                                )}
                                Payer
                              </button>
                            </div>
                          </TableCell>
                        </tr>
                      );
                    })}
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

function PayoutStatusBadge({ status }: { status: string }) {
  const value = String(status || "").toLowerCase();

  if (value === "paid") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        <CheckCircle2 size={14} />
        Paid
      </span>
    );
  }

  if (value === "partial") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
        <AlertCircle size={14} />
        Partial
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
      <AlertCircle size={14} />
      Unpaid
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

function InputDate({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
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
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
        />
      </div>
    </div>
  );
}

function FilterButton({
  label,
  onClick,
  disabled,
  icon,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  icon?: React.ReactNode;
  variant: "secondary" | "light";
}) {
  const className =
    variant === "secondary"
      ? "bg-orange-500 text-white hover:bg-orange-600"
      : "bg-slate-100 text-slate-800 hover:bg-teal-50 hover:text-[#1B4F59]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatBox({
  icon,
  label,
  value,
  helper,
  delay,
  warn = false,
  success = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
  delay: number;
  warn?: boolean;
  success?: boolean;
}) {
  const iconClass = success
    ? "bg-emerald-50 text-emerald-600"
    : warn
    ? "bg-orange-50 text-orange-600"
    : "bg-teal-50 text-[#1B4F59]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur"
    >
      <div className={`mb-5 inline-flex rounded-2xl p-4 ${iconClass}`}>
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>

      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>

      <p className="mt-2 text-sm font-semibold text-slate-400">{helper}</p>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto mb-5 inline-flex rounded-3xl bg-white p-4 text-[#1B4F59] shadow-sm">
          <HandCoins size={34} />
        </div>

        <h3 className="text-xl font-black text-slate-950">
          Aucune commission trouvée
        </h3>

        <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
          Aucun paiement ou commission ne correspond à la période choisie.
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