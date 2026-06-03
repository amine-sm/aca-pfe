"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  DollarSign,
  HandCoins,
  RefreshCcw,
  Search,
  Stethoscope,
  TrendingUp,
  UsersRound,
  Wallet,
  BarChart3,
  LayoutDashboard,
  Table2,
  Activity,
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
import { AlertBox, PageHeader, StatCard } from "../components/Ui";

type TabKey = "resume" | "finances" | "activite" | "graphique" | "tables";

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
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>

      <div style={{ color: "#FE5737", fontWeight: 700 }}>
        {formatMoney(payload[0].value)}
      </div>

      {payload[0]?.payload?.payments_count !== undefined && (
        <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
          Paiements : {payload[0].payload.payments_count}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "btn" : "btn light"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 999,
        padding: "12px 18px",
        minWidth: 135,
        justifyContent: "center",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function AdminDashboardPage() {
  const { loading } = useAuthGuard(["ADMIN", "SUPER_ADMIN"]);

  const defaultFrom = useMemo(() => getFirstDayOfCurrentMonth(), []);
  const defaultTo = useMemo(() => getTodayDate(), []);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [chartMode, setChartMode] = useState<"day" | "month" | "all">("day");
  const [activeTab, setActiveTab] = useState<TabKey>("resume");

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(false);

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
    if (!loading) {
      loadDashboard(defaultFrom, defaultTo, "day");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <main className="container">
        <div className="card">Chargement...</div>
      </main>
    );
  }

  const stats = data?.stats || {};
  const revenueChart = data?.revenue_chart || [];

  return (
    <main className="container">
      <PageHeader
        badge="Admin"
        title="Dashboard administration"
        text="Supervision des revenus, utilisateurs, psychologues, alertes, rendez-vous et paiements."
        actions={
          <>
            <Link className="btn" href="/admin/psychologists">
              Psychologues
            </Link>

            <Link className="btn secondary" href="/admin/payments">
              Paiements
            </Link>

            <Link className="btn light" href="/admin/alerts">
              Alertes
            </Link>
          </>
        }
      />

      {error && <AlertBox type="error">{error}</AlertBox>}

      <section className="card" style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2>Filtre par période</h2>
            <p className="muted" style={{ marginTop: 4 }}>
              Filtrer les revenus, paiements, alertes, utilisateurs et
              rendez-vous par date.
            </p>
          </div>

          {data?.filters && (
            <span className="badge neutral">
              {data.filters.from || "Début"} → {data.filters.to || "Fin"}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "end",
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          <div style={{ minWidth: 180 }}>
            <label>Du</label>
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <label>Au</label>
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <button
            className="btn"
            onClick={handleFilter}
            disabled={loadingDashboard}
            type="button"
          >
            <Search size={18} />
            Filtrer
          </button>

          <button
            className="btn secondary"
            onClick={handleCurrentMonth}
            disabled={loadingDashboard}
            type="button"
          >
            Mois actuel
          </button>

          <button
            className="btn light"
            onClick={handleFullMonth}
            disabled={loadingDashboard}
            type="button"
          >
            Mois complet
          </button>

          <button
            className="btn light"
            onClick={handleReset}
            disabled={loadingDashboard}
            type="button"
          >
            <RefreshCcw size={18} />
            Tout
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: 22, padding: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 18,
            rowGap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TabButton
            active={activeTab === "resume"}
            icon={<LayoutDashboard size={18} />}
            label="Résumé"
            onClick={() => setActiveTab("resume")}
          />

          <TabButton
            active={activeTab === "finances"}
            icon={<DollarSign size={18} />}
            label="Finances"
            onClick={() => setActiveTab("finances")}
          />

          <TabButton
            active={activeTab === "activite"}
            icon={<Activity size={18} />}
            label="Activité"
            onClick={() => setActiveTab("activite")}
          />

          <TabButton
            active={activeTab === "graphique"}
            icon={<BarChart3 size={18} />}
            label="Graphique"
            onClick={() => setActiveTab("graphique")}
          />

          <TabButton
            active={activeTab === "tables"}
            icon={<Table2 size={18} />}
            label="Tables"
            onClick={() => setActiveTab("tables")}
          />
        </div>
      </section>

      {activeTab === "resume" && (
        <section style={{ marginTop: 18 }}>
          <div className="grid grid-3">
            <StatCard
              icon={<DollarSign />}
              label="Revenu total brut"
              value={formatMoney(stats.revenue_total_brut)}
              helper="Selon la période choisie"
            />

            <StatCard
              icon={<TrendingUp />}
              label="Revenu aujourd’hui"
              value={formatMoney(stats.revenue_today)}
              helper="Toujours la journée actuelle"
            />

            <StatCard
              icon={<Wallet />}
              label="Revenu du mois"
              value={formatMoney(stats.revenue_month)}
              helper="Toujours le mois actuel"
            />

            <StatCard
              icon={<Stethoscope />}
              label="Psychologues en attente"
              value={stats.pending_psychologists || 0}
              helper="Comptes à valider"
            />

            <StatCard
              icon={<AlertTriangle />}
              label="Alertes critiques"
              value={stats.critical_alerts || 0}
              helper="Alertes ouvertes critiques"
            />

            <StatCard
              icon={<CalendarDays />}
              label="Total rendez-vous"
              value={stats.total_appointments || 0}
              helper="Selon la période choisie"
            />
          </div>
        </section>
      )}

      {activeTab === "finances" && (
        <section style={{ marginTop: 18 }}>
          <div className="grid grid-3">
            <StatCard
              icon={<DollarSign />}
              label="Revenu total brut"
              value={formatMoney(stats.revenue_total_brut)}
              helper="Total encaissé selon la période choisie"
            />

            <StatCard
              icon={<HandCoins />}
              label="Net admin"
              value={formatMoney(stats.admin_net)}
              helper="Commission plateforme"
            />

            <StatCard
              icon={<CreditCard />}
              label="À payer aux psychologues"
              value={formatMoney(stats.psychologist_amount_to_pay)}
              helper="Payouts en attente"
            />

            <StatCard
              icon={<CreditCard />}
              label="Paiements en attente"
              value={stats.pending_payments || 0}
              helper="Paiements non validés"
            />

            <StatCard
              icon={<TrendingUp />}
              label="Revenu aujourd’hui"
              value={formatMoney(stats.revenue_today)}
              helper="Toujours la journée actuelle"
            />

            <StatCard
              icon={<Wallet />}
              label="Revenu du mois"
              value={formatMoney(stats.revenue_month)}
              helper="Toujours le mois actuel"
            />
          </div>
        </section>
      )}

      {activeTab === "activite" && (
        <section style={{ marginTop: 18 }}>
          <div className="grid grid-3">
            <StatCard
              icon={<UsersRound />}
              label="Total utilisateurs"
              value={stats.total_users || 0}
              helper="Selon la période choisie"
            />

            <StatCard
              icon={<CalendarDays />}
              label="Total rendez-vous"
              value={stats.total_appointments || 0}
              helper="Selon la période choisie"
            />

            <StatCard
              icon={<Stethoscope />}
              label="Psychologues en attente"
              value={stats.pending_psychologists || 0}
              helper="Comptes à valider"
            />

            <StatCard
              icon={<AlertTriangle />}
              label="Alertes critiques"
              value={stats.critical_alerts || 0}
              helper="Alertes ouvertes critiques"
            />

            <StatCard
              icon={<CreditCard />}
              label="Paiements en attente"
              value={stats.pending_payments || 0}
              helper="Paiements non validés"
            />
          </div>
        </section>
      )}

      {activeTab === "graphique" && (
        <section className="card" style={{ marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div>
              <h2>Courbe des revenus</h2>
              <p className="muted" style={{ marginTop: 4 }}>
                Affichage :{" "}
                {chartMode === "day"
                  ? "par jour"
                  : chartMode === "month"
                  ? "par mois"
                  : "tout l’historique"}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className={chartMode === "day" ? "btn" : "btn light"}
                onClick={() => handleChartModeChange("day")}
                disabled={loadingDashboard}
              >
                Par jour
              </button>

              <button
                type="button"
                className={chartMode === "month" ? "btn" : "btn light"}
                onClick={() => handleChartModeChange("month")}
                disabled={loadingDashboard}
              >
                Par mois
              </button>

              <button
                type="button"
                className={chartMode === "all" ? "btn" : "btn light"}
                onClick={() => handleChartModeChange("all")}
                disabled={loadingDashboard}
              >
                Tout
              </button>
            </div>
          </div>

          <div style={{ width: "100%", height: 360 }}>
            {revenueChart.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  border: "1px dashed #cbd5e1",
                  borderRadius: 16,
                }}
              >
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

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />

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
      )}

      {activeTab === "tables" && (
        <section style={{ marginTop: 18 }}>
          <div className="grid grid-2">
            <section className="card">
              <h2>Utilisateurs récents</h2>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Risque</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(data?.recent_users || []).length === 0 ? (
                      <tr>
                        <td colSpan={3}>Aucun utilisateur récent.</td>
                      </tr>
                    ) : (
                      (data?.recent_users || []).map((user: any) => (
                        <tr key={user.id}>
                          <td>{user.full_name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className="badge neutral">
                              {user.risk_level || "unknown"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h2>Alertes récentes</h2>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Risque</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(data?.recent_alerts || []).length === 0 ? (
                      <tr>
                        <td colSpan={3}>Aucune alerte récente.</td>
                      </tr>
                    ) : (
                      (data?.recent_alerts || []).map((alert: any) => (
                        <tr key={alert.id}>
                          <td>{alert.full_name}</td>
                          <td>
                            <span className="badge danger">
                              {alert.risk_level || "-"}
                            </span>
                          </td>
                          <td>
                            <span className="badge neutral">
                              {alert.status || "-"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}