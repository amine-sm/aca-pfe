"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CreditCard,
  DollarSign,
  HandCoins,
  LayoutDashboard,
  Loader2,
  RefreshCcw,
  Search,
  Stethoscope,
  Table2,
  TrendingUp,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getAdminDashboard } from "@/lib/adminApi";
import { useAuthGuard } from "../hooks/useAuthGuard";

type TabKey = "resume" | "finances" | "activite" | "graphique" | "tables";

const softEase = [0.22, 1, 0.36, 1] as const;

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

function getLastDayOfCurrentMonth() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-200/70">
      <div className="mb-1 text-sm font-black text-slate-950">{label}</div>

      <div className="text-sm font-black text-[#FE5737]">
        {formatMoney(payload[0].value)}
      </div>

      {payload[0]?.payload?.payments_count !== undefined && (
        <div className="mt-1 text-xs font-bold text-slate-500">
          Paiements : {payload[0].payload.payments_count}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { loading } = useAuthGuard(["ADMIN", "SUPER_ADMIN"]);

  const defaultFrom = useMemo(() => getFirstDayOfCurrentMonth(), []);
  const defaultTo = useMemo(() => getTodayDate(), []);

  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [chartMode, setChartMode] = useState<"day" | "month" | "all">("day");
  const [activeTab, setActiveTab] = useState<TabKey>("resume");

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadDashboard(
    customFrom = from,
    customTo = to,
    customChartMode = chartMode
  ) {
    try {
      setError("");
      setLoadingDashboard(true);

      const result = await getAdminDashboard({
        from: customFrom,
        to: customTo,
        chartMode: customChartMode,
      });

      setData(result);
    } catch (err: any) {
      setError(err.message || "Erreur dashboard admin");
    } finally {
      setLoadingDashboard(false);
    }
  }

  function handleFilter() {
    if (from && to && from > to) {
      setError("La date de début ne peut pas être supérieure à la date de fin.");
      return;
    }

    loadDashboard(from, to, chartMode);
  }

  function handleCurrentMonth() {
    const firstDay = getFirstDayOfCurrentMonth();
    const today = getTodayDate();

    setFrom(firstDay);
    setTo(today);
    setChartMode("day");

    loadDashboard(firstDay, today, "day");
  }

  function handleFullMonth() {
    const firstDay = getFirstDayOfCurrentMonth();
    const lastDay = getLastDayOfCurrentMonth();

    setFrom(firstDay);
    setTo(lastDay);
    setChartMode("day");

    loadDashboard(firstDay, lastDay, "day");
  }

  function handleReset() {
    setFrom("");
    setTo("");
    setChartMode("all");

    loadDashboard("", "", "all");
  }

  function handleChartModeChange(mode: "day" | "month" | "all") {
    setChartMode(mode);

    if (mode === "all") {
      loadDashboard("", "", "all");
      return;
    }

    loadDashboard(from, to, mode);
  }

  useEffect(() => {
    if (mounted && !loading) {
      loadDashboard(defaultFrom, defaultTo, "day");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, loading]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-3 rounded-[24px] border border-slate-100 bg-white px-6 py-5 shadow-xl shadow-slate-200/60">
          <Loader2 className="animate-spin text-[#1B4F59]" size={25} />
          <p className="font-black text-slate-700">Chargement...</p>
        </div>
      </main>
    );
  }

  const stats = data?.stats || {};
  const revenueChart = data?.revenue_chart || [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-white pt-20 text-slate-900">
      <BackgroundDecor />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <HeaderCard loadingDashboard={loadingDashboard} />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className="mb-6 flex items-start gap-3 rounded-[22px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-sm"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <FilterCard
          from={from}
          to={to}
          setFrom={setFrom}
          setTo={setTo}
          filters={data?.filters}
          loadingDashboard={loadingDashboard}
          onFilter={handleFilter}
          onCurrentMonth={handleCurrentMonth}
          onFullMonth={handleFullMonth}
          onReset={handleReset}
        />

        <TabsCard activeTab={activeTab} setActiveTab={setActiveTab} />

        <AnimatePresence mode="wait">
          {activeTab === "resume" && (
            <TabMotion keyName="resume">
              <StatsGrid>
                <DashboardStatCard
                  icon={<DollarSign />}
                  label="Revenu total brut"
                  value={formatMoney(stats.revenue_total_brut)}
                  helper="Selon la période choisie"
                />

                <DashboardStatCard
                  icon={<TrendingUp />}
                  label="Revenu aujourd’hui"
                  value={formatMoney(stats.revenue_today)}
                  helper="Toujours la journée actuelle"
                />

                <DashboardStatCard
                  icon={<Wallet />}
                  label="Revenu du mois"
                  value={formatMoney(stats.revenue_month)}
                  helper="Toujours le mois actuel"
                />

                <DashboardStatCard
                  icon={<Stethoscope />}
                  label="Psychologues en attente"
                  value={stats.pending_psychologists || 0}
                  helper="Comptes à valider"
                />

                <DashboardStatCard
                  icon={<AlertTriangle />}
                  label="Alertes critiques"
                  value={stats.critical_alerts || 0}
                  helper="Alertes ouvertes critiques"
                />

                <DashboardStatCard
                  icon={<CalendarDays />}
                  label="Total rendez-vous"
                  value={stats.total_appointments || 0}
                  helper="Selon la période choisie"
                />
              </StatsGrid>
            </TabMotion>
          )}

          {activeTab === "finances" && (
            <TabMotion keyName="finances">
              <StatsGrid>
                <DashboardStatCard
                  icon={<DollarSign />}
                  label="Revenu total brut"
                  value={formatMoney(stats.revenue_total_brut)}
                  helper="Total encaissé selon la période choisie"
                />

                <DashboardStatCard
                  icon={<HandCoins />}
                  label="Net admin"
                  value={formatMoney(stats.admin_net)}
                  helper="Commission plateforme"
                />

                <DashboardStatCard
                  icon={<CreditCard />}
                  label="À payer aux psychologues"
                  value={formatMoney(stats.psychologist_amount_to_pay)}
                  helper="Payouts en attente"
                />

                <DashboardStatCard
                  icon={<CreditCard />}
                  label="Paiements en attente"
                  value={stats.pending_payments || 0}
                  helper="Paiements non validés"
                />

                <DashboardStatCard
                  icon={<TrendingUp />}
                  label="Revenu aujourd’hui"
                  value={formatMoney(stats.revenue_today)}
                  helper="Toujours la journée actuelle"
                />

                <DashboardStatCard
                  icon={<Wallet />}
                  label="Revenu du mois"
                  value={formatMoney(stats.revenue_month)}
                  helper="Toujours le mois actuel"
                />
              </StatsGrid>
            </TabMotion>
          )}

          {activeTab === "activite" && (
            <TabMotion keyName="activite">
              <StatsGrid>
                <DashboardStatCard
                  icon={<UsersRound />}
                  label="Total utilisateurs"
                  value={stats.total_users || 0}
                  helper="Selon la période choisie"
                />

                <DashboardStatCard
                  icon={<CalendarDays />}
                  label="Total rendez-vous"
                  value={stats.total_appointments || 0}
                  helper="Selon la période choisie"
                />

                <DashboardStatCard
                  icon={<Stethoscope />}
                  label="Psychologues en attente"
                  value={stats.pending_psychologists || 0}
                  helper="Comptes à valider"
                />

                <DashboardStatCard
                  icon={<AlertTriangle />}
                  label="Alertes critiques"
                  value={stats.critical_alerts || 0}
                  helper="Alertes ouvertes critiques"
                />

                <DashboardStatCard
                  icon={<CreditCard />}
                  label="Paiements en attente"
                  value={stats.pending_payments || 0}
                  helper="Paiements non validés"
                />
              </StatsGrid>
            </TabMotion>
          )}

          {activeTab === "graphique" && (
            <TabMotion keyName="graphique">
              <ChartCard
                chartMode={chartMode}
                loadingDashboard={loadingDashboard}
                revenueChart={revenueChart}
                onModeChange={handleChartModeChange}
              />
            </TabMotion>
          )}

          {activeTab === "tables" && (
            <TabMotion keyName="tables">
              <TablesSection data={data} />
            </TabMotion>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-teal-100/70 blur-3xl" />
      <div className="absolute left-[-170px] top-72 h-[460px] w-[460px] rounded-full bg-cyan-100/60 blur-3xl" />
      <div className="absolute bottom-[-190px] right-1/3 h-[380px] w-[380px] rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-50" />
    </div>
  );
}

function HeaderCard({ loadingDashboard }: { loadingDashboard: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.62, ease: softEase }}
      className="mb-8 overflow-hidden rounded-[34px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/70"
    >
      <div className="relative">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-100/80 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-100/70 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-[#1B4F59]">
              <LayoutDashboard size={16} />
              Admin
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Dashboard administration
            </h1>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
              Supervision des revenus, utilisateurs, psychologues, alertes,
              rendez-vous et paiements avec un affichage clair par onglets.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <HeaderLink href="/admin/psychologists">Psychologues</HeaderLink>
            <HeaderLink href="/admin/payments">Paiements</HeaderLink>
            <HeaderLink href="/admin/alerts">Alertes</HeaderLink>

            {loadingDashboard && (
              <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
                <Loader2 size={16} className="animate-spin text-[#1B4F59]" />
                Chargement
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

function FilterCard({
  from,
  to,
  setFrom,
  setTo,
  filters,
  loadingDashboard,
  onFilter,
  onCurrentMonth,
  onFullMonth,
  onReset,
}: {
  from: string;
  to: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  filters: any;
  loadingDashboard: boolean;
  onFilter: () => void;
  onCurrentMonth: () => void;
  onFullMonth: () => void;
  onReset: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.08, duration: 0.55, ease: softEase }}
      className="mb-6 rounded-[30px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Filtre par période
          </h2>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Filtrer les revenus, paiements, alertes, utilisateurs et
            rendez-vous par date.
          </p>
        </div>

        {filters && (
          <span className="inline-flex w-fit rounded-full border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-black text-slate-600">
            {filters.from || "Début"} → {filters.to || "Fin"}
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <DateInput label="Du" value={from} onChange={setFrom} />
        <DateInput label="Au" value={to} onChange={setTo} />

        <ActionButton onClick={onFilter} disabled={loadingDashboard} primary>
          <Search size={17} />
          Filtrer
        </ActionButton>

        <ActionButton onClick={onCurrentMonth} disabled={loadingDashboard}>
          Mois actuel
        </ActionButton>

        <ActionButton onClick={onFullMonth} disabled={loadingDashboard}>
          Mois complet
        </ActionButton>

        <ActionButton onClick={onReset} disabled={loadingDashboard}>
          <RefreshCcw size={17} />
          Tout
        </ActionButton>
      </div>
    </motion.section>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-[180px]">
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? "bg-[#1B4F59] text-white shadow-teal-900/20 hover:bg-[#153f47]"
          : "border border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </motion.button>
  );
}

function TabsCard({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}) {
  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "resume",
      label: "Résumé",
      icon: <LayoutDashboard size={18} />,
    },
    {
      key: "finances",
      label: "Finances",
      icon: <DollarSign size={18} />,
    },
    {
      key: "activite",
      label: "Activité",
      icon: <Activity size={18} />,
    },
    {
      key: "graphique",
      label: "Graphique",
      icon: <BarChart3 size={18} />,
    },
    {
      key: "tables",
      label: "Tables",
      icon: <Table2 size={18} />,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.14, duration: 0.55, ease: softEase }}
      className="mb-6 rounded-[30px] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/60"
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl px-5 text-sm font-black transition ${
              activeTab === tab.key
                ? "bg-[#1B4F59] text-white shadow-lg shadow-teal-900/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}

function TabMotion({
  keyName,
  children,
}: {
  keyName: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      key={keyName}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -14, scale: 0.98 }}
      transition={{ duration: 0.42, ease: softEase }}
    >
      {children}
    </motion.section>
  );
}

function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.06,
          },
        },
      }}
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {children}
    </motion.div>
  );
}

function DashboardStatCard({
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
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.45,
            ease: softEase,
          },
        },
      }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[30px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60 transition hover:shadow-2xl hover:shadow-teal-900/10"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-teal-100/70 blur-2xl transition duration-500 group-hover:scale-125" />

      <div className="relative z-10">
        <div className="mb-5 inline-flex h-13 w-13 rounded-2xl bg-[#1B4F59] p-3 text-white shadow-lg shadow-teal-900/20">
          {icon}
        </div>

        <p className="text-sm font-bold text-slate-500">{label}</p>

        <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>

        <p className="mt-2 text-xs font-bold text-slate-500">{helper}</p>
      </div>
    </motion.article>
  );
}

function ChartCard({
  chartMode,
  loadingDashboard,
  revenueChart,
  onModeChange,
}: {
  chartMode: "day" | "month" | "all";
  loadingDashboard: boolean;
  revenueChart: any[];
  onModeChange: (mode: "day" | "month" | "all") => void;
}) {
  return (
    <section className="rounded-[30px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Courbe des revenus
          </h2>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Affichage :{" "}
            {chartMode === "day"
              ? "par jour"
              : chartMode === "month"
              ? "par mois"
              : "tout l’historique"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ModeButton
            active={chartMode === "day"}
            disabled={loadingDashboard}
            onClick={() => onModeChange("day")}
          >
            Par jour
          </ModeButton>

          <ModeButton
            active={chartMode === "month"}
            disabled={loadingDashboard}
            onClick={() => onModeChange("month")}
          >
            Par mois
          </ModeButton>

          <ModeButton
            active={chartMode === "all"}
            disabled={loadingDashboard}
            onClick={() => onModeChange("all")}
          >
            Tout
          </ModeButton>
        </div>
      </div>

      <div className="h-[360px] w-full">
        {revenueChart.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
            Aucun revenu trouvé pour cette période.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={revenueChart}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickMargin={10} />

              <YAxis
                tick={{ fontSize: 12 }}
                tickMargin={10}
                tickFormatter={(value) =>
                  Number(value || 0).toLocaleString("fr-DZ")
                }
              />

              <Tooltip content={<RevenueTooltip />} />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenus"
                stroke="#FE5737"
                strokeWidth={3}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "#fff",
                  stroke: "#FE5737",
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  fill: "#FE5737",
                  stroke: "#fff",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "bg-[#1B4F59] text-white shadow-lg shadow-teal-900/20"
          : "border border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </motion.button>
  );
}

function TablesSection({ data }: { data: any }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TableCard
        title="Utilisateurs récents"
        columns={["Nom", "Email", "Risque"]}
        empty="Aucun utilisateur récent."
        rows={(data?.recent_users || []).map((user: any) => [
          user.full_name,
          user.email,
          <Badge key={`risk-${user.id}`} type="neutral">
            {user.risk_level || "unknown"}
          </Badge>,
        ])}
      />

      <TableCard
        title="Alertes récentes"
        columns={["User", "Risque", "Status"]}
        empty="Aucune alerte récente."
        rows={(data?.recent_alerts || []).map((alert: any) => [
          alert.full_name,
          <Badge key={`risk-${alert.id}`} type="danger">
            {alert.risk_level || "-"}
          </Badge>,
          <Badge key={`status-${alert.id}`} type="neutral">
            {alert.status || "-"}
          </Badge>,
        ])}
      />
    </div>
  );
}

function TableCard({
  title,
  columns,
  rows,
  empty,
}: {
  title: string;
  columns: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-xl shadow-slate-200/60">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-sm font-bold text-slate-500"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="transition hover:bg-slate-50">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Badge({
  type,
  children,
}: {
  type: "neutral" | "danger";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        type === "danger"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {children}
    </span>
  );
}
