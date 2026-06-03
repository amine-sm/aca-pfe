"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Mail,
  RefreshCcw,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";

import { closeAlert, getAdminAlerts } from "@/lib/adminApi";
import { useAuthGuard } from "../../hooks/useAuthGuard";

function formatDate(value: any) {
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

export default function AdminAlertsPage() {
  const { loading } = useAuthGuard(["ADMIN", "SUPER_ADMIN"]);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(
    null
  );

  async function load() {
    setError("");
    setLoadingList(true);

    try {
      const data: any = await getAdminAlerts();
      const list = data.alerts || [];

      setAlerts(list);
      setFilteredAlerts(applyFilterAndSearch(list, statusFilter, searchText));
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Erreur chargement alertes");
    } finally {
      setLoadingList(false);
    }
  }

  function applyFilterAndSearch(list: any[], filter: string, search: string) {
    let result = [...list];

    if (filter === "open") {
      result = result.filter((alert) => alert.status === "open");
    }

    if (filter === "closed") {
      result = result.filter((alert) => alert.status === "closed");
    }

    if (filter === "critique") {
      result = result.filter((alert) => {
        const risk = String(alert.risk_level || "").toLowerCase();

        return risk === "critique" || risk === "critical";
      });
    }

    if (filter === "eleve") {
      result = result.filter((alert) => {
        const risk = String(alert.risk_level || "").toLowerCase();

        return risk === "eleve" || risk === "élevé" || risk === "high";
      });
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((alert) => {
        return (
          String(alert.id || "").toLowerCase().includes(query) ||
          String(alert.full_name || alert.user_name || "")
            .toLowerCase()
            .includes(query) ||
          String(alert.email || alert.user_email || "")
            .toLowerCase()
            .includes(query) ||
          String(alert.risk_level || "").toLowerCase().includes(query) ||
          String(alert.alert_type || "").toLowerCase().includes(query) ||
          String(alert.status || "").toLowerCase().includes(query) ||
          String(alert.message_excerpt || "").toLowerCase().includes(query)
        );
      });
    }

    return result;
  }

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setCurrentPage(1);
    setFilteredAlerts(applyFilterAndSearch(alerts, value, searchText));
  }

  function handleSearchChange(value: string) {
    setSearchText(value);
    setCurrentPage(1);
    setFilteredAlerts(applyFilterAndSearch(alerts, statusFilter, value));
  }

  function handleItemsPerPageChange(value: string) {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }

  async function handleAction(actionValue: string, alert: any) {
    if (!actionValue) return;

    setError("");
    setMessage("");
    setActionLoadingId(alert.id);

    try {
      let data: any = null;

      if (actionValue === "close") {
        data = await closeAlert(alert.id);
      }

      setMessage(data?.message || "Alerte fermée avec succès");

      const refreshed: any = await getAdminAlerts();
      const list = refreshed.alerts || [];

      setAlerts(list);
      setFilteredAlerts(applyFilterAndSearch(list, statusFilter, searchText));
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Erreur action alerte");
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

  const openCount = alerts.filter((alert) => alert.status === "open").length;

  const closedCount = alerts.filter((alert) => alert.status === "closed").length;

  const criticalCount = alerts.filter((alert) => {
    const risk = String(alert.risk_level || "").toLowerCase();
    return risk === "critique" || risk === "critical";
  }).length;

  const highCount = alerts.filter((alert) => {
    const risk = String(alert.risk_level || "").toLowerCase();
    return risk === "eleve" || risk === "élevé" || risk === "high";
  }).length;

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAlerts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return filteredAlerts.slice(startIndex, endIndex);
  }, [filteredAlerts, safeCurrentPage, itemsPerPage]);

  const startItem =
    filteredAlerts.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(safeCurrentPage * itemsPerPage, filteredAlerts.length);

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
                  <ShieldAlert size={16} />
                  Administration
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
                  Alertes de risque
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50/85">
                  Surveillez les alertes importantes, filtrez les situations
                  ouvertes et fermez les alertes déjà traitées.
                </p>
              </div>

              <button
                type="button"
                onClick={load}
                disabled={loadingList}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#1B4F59] shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingList ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCcw size={18} />
                )}
                Actualiser
              </button>
            </div>
          </div>
        </motion.section>

        {error && <AlertMessage type="error" message={error} />}
        {message && <AlertMessage type="success" message={message} />}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon={<ShieldAlert size={24} />}
            label="Alertes"
            value={alerts.length}
            helper="Total des alertes"
            delay={0.1}
          />

          <StatBox
            icon={<AlertTriangle size={24} />}
            label="Ouvertes"
            value={openCount}
            helper="À traiter"
            delay={0.15}
            danger
          />

          <StatBox
            icon={<XCircle size={24} />}
            label="Critiques"
            value={criticalCount}
            helper={`Élevées : ${highCount}`}
            delay={0.2}
            danger
          />

          <StatBox
            icon={<CheckCircle2 size={24} />}
            label="Fermées"
            value={closedCount}
            helper="Déjà traitées"
            delay={0.25}
            success
          />
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="mb-8 rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <Filter size={16} />
                Filtres
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Rechercher et filtrer
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                Filtrez les alertes par statut, criticité ou recherchez par
                utilisateur, email, type, message ou identifiant.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_280px]">
            <SearchInput
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Rechercher une alerte..."
            />

            <FilterSelect value={statusFilter} onChange={handleFilterChange} />
          </div>
        </motion.section>

        <section className="rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <AlertTriangle size={16} />
                Liste
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Liste des alertes
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                Consultez les alertes et fermez celles qui sont déjà traitées.
              </p>
            </div>

            <div className="hidden rounded-3xl bg-red-50 p-4 text-red-600 md:block">
              <BadgeCheck size={30} />
            </div>
          </div>

          {loadingList ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
                <p className="font-bold text-slate-600">
                  Chargement des alertes...
                </p>
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    Affichage {startItem} - {endItem} sur{" "}
                    {filteredAlerts.length} alerte(s)
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
                    <option value="8">8</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-[26px] border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <TableHead>ID</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Risque</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead align="right">Action</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedAlerts.map((alert) => (
                        <tr
                          key={alert.id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <TableCell>
                            <span className="font-black text-slate-950">
                              #{alert.id}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                <UserRound size={22} />
                              </div>

                              <div>
                                <p className="font-black text-slate-950">
                                  {alert.full_name || alert.user_name || "—"}
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                                  <Mail size={13} />
                                  {alert.email ||
                                    alert.user_email ||
                                    "Email non défini"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <RiskBadge risk={alert.risk_level} />
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {alert.alert_type || "—"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="max-w-[280px] whitespace-normal text-sm font-semibold leading-6 text-slate-600">
                              {alert.message_excerpt || "—"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <StatusBadge status={alert.status} />
                          </TableCell>

                          <TableCell>{formatDate(alert.created_at)}</TableCell>

                          <TableCell align="right">
                            <ActionSelect
                              alert={alert}
                              loadingId={actionLoadingId}
                              onAction={handleAction}
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
      </div>
    </main>
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

function StatBox({
  icon,
  label,
  value,
  helper,
  delay,
  success = false,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
  delay: number;
  success?: boolean;
  danger?: boolean;
}) {
  const iconClass = success
    ? "bg-emerald-50 text-emerald-600"
    : danger
    ? "bg-red-50 text-red-600"
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
        <Filter
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-10 text-sm font-black text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
        >
          <option value="all">Toutes</option>
          <option value="open">Ouvertes</option>
          <option value="closed">Fermées</option>
          <option value="critique">Critiques</option>
          <option value="eleve">Élevées</option>
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>
    </div>
  );
}

function ActionSelect({
  alert,
  loadingId,
  onAction,
}: {
  alert: any;
  loadingId: number | string | null;
  onAction: (actionValue: string, alert: any) => void;
}) {
  const isLoading = loadingId === alert.id;
  const isClosed = alert.status === "closed";

  return (
    <div className="relative ml-auto w-[190px]">
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
        disabled={isLoading || isClosed}
        onChange={(e) => onAction(e.target.value, alert)}
        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-black text-[#1B4F59] outline-none transition hover:bg-white focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {isLoading
            ? "Traitement..."
            : isClosed
            ? "Déjà fermée"
            : "Choisir action"}
        </option>

        {!isClosed && <option value="close">Fermer alerte</option>}
      </select>

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#1B4F59]">
        ▾
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const value = String(status || "").toLowerCase();

  if (value === "open") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
        <AlertCircle size={14} />
        Ouverte
      </span>
    );
  }

  if (value === "closed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        <CheckCircle2 size={14} />
        Fermée
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
        <ShieldAlert size={14} />
        Critique
      </span>
    );
  }

  if (value === "eleve" || value === "élevé" || value === "high") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
        <AlertTriangle size={14} />
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
            <PageButton page={1} active={currentPage === 1} onClick={onPageChange} />
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

function EmptyState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto mb-5 inline-flex rounded-3xl bg-white p-4 text-red-600 shadow-sm">
          <ShieldAlert size={34} />
        </div>

        <h3 className="text-xl font-black text-slate-950">
          Aucune alerte trouvée
        </h3>

        <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
          Aucune alerte ne correspond au filtre ou à la recherche actuelle.
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