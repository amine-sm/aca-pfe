"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Filter,
  Loader2,
  Mail,
  RefreshCcw,
  Search,
  UserRound,
  Wallet,
  XCircle,
  Stethoscope,
  ReceiptText,
  BadgeCheck,
  Banknote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getAdminPayments } from "@/lib/adminApi";
import { markManualPaid, rejectPayment } from "@/lib/paymentsApi";
import { useAuthGuard } from "../../hooks/useAuthGuard";

function formatMoney(value: any, currency = "DZD") {
  const numberValue = Number(value || 0);

  return `${numberValue.toLocaleString("fr-DZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency || "DZD"}`;
}

function parseMetadata(metadata: any) {
  if (!metadata) return {};

  if (typeof metadata === "object") {
    return metadata;
  }

  const clean = String(metadata).trim();

  if (!clean || clean === "undefined" || clean === "null") {
    return {};
  }

  try {
    return JSON.parse(clean);
  } catch {
    return {};
  }
}

function getBackendBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

function getProofUrl(metadata: any) {
  const fileUrl = metadata?.proof_file_url || metadata?.proofUrl || metadata?.proof_url;
  if (!fileUrl) return "";
  if (String(fileUrl).startsWith("http")) return String(fileUrl);
  return `${getBackendBaseUrl()}${fileUrl}`;
}

export default function AdminPaymentsPage() {
  const { loading } = useAuthGuard(["ADMIN", "SUPER_ADMIN"]);

  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
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
      const data: any = await getAdminPayments();
      const list = data.payments || [];

      setPayments(list);
      setFilteredPayments(applyFilterAndSearch(list, statusFilter, searchText));
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Erreur chargement paiements");
    } finally {
      setLoadingList(false);
    }
  }

  function applyFilterAndSearch(list: any[], filter: string, search: string) {
    let result = [...list];

    if (filter === "paid") {
      result = result.filter((payment) => payment.status === "paid");
    }

    if (filter === "pending") {
      result = result.filter((payment) => payment.status === "pending");
    }

    if (filter === "failed") {
      result = result.filter(
        (payment) => payment.status === "failed" || payment.status === "rejected"
      );
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((payment) => {
        const metadata = parseMetadata(payment.metadata);

        return (
          String(payment.id || "").toLowerCase().includes(query) ||
          String(payment.user_name || "").toLowerCase().includes(query) ||
          String(payment.user_email || "").toLowerCase().includes(query) ||
          String(payment.psychologist_name || "").toLowerCase().includes(query) ||
          String(payment.payment_method || "").toLowerCase().includes(query) ||
          String(metadata.proof_reference || "").toLowerCase().includes(query) ||
          String(metadata.proof_original_name || "").toLowerCase().includes(query)
        );
      });
    }

    return result;
  }

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setCurrentPage(1);
    setFilteredPayments(applyFilterAndSearch(payments, value, searchText));
  }

  function handleSearchChange(value: string) {
    setSearchText(value);
    setCurrentPage(1);
    setFilteredPayments(applyFilterAndSearch(payments, statusFilter, value));
  }

  function handleItemsPerPageChange(value: string) {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }

  async function handleAction(actionValue: string, payment: any) {
    if (!actionValue) return;

    setError("");
    setMessage("");
    setActionLoadingId(payment.id);

    try {
      let data: any = null;

      if (actionValue === "validate") {
        data = await markManualPaid(payment.id);
      }

      if (actionValue === "reject") {
        data = await rejectPayment(payment.id, "Paiement refusé par admin");
      }

      setMessage(data?.message || "Action effectuée avec succès");

      const refreshed: any = await getAdminPayments();
      const list = refreshed.payments || [];

      setPayments(list);
      setFilteredPayments(applyFilterAndSearch(list, statusFilter, searchText));
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Erreur action paiement");
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

  const totalAmount = payments.reduce((sum, payment) => {
    if (payment.status === "paid") {
      return sum + Number(payment.amount || 0);
    }

    return sum;
  }, 0);

  const paidCount = payments.filter((payment) => payment.status === "paid")
    .length;

  const pendingCount = payments.filter((payment) => payment.status === "pending")
    .length;

  const failedCount = payments.filter(
    (payment) => payment.status === "failed" || payment.status === "rejected"
  ).length;

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPayments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, safeCurrentPage, itemsPerPage]);

  const startItem =
    filteredPayments.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(safeCurrentPage * itemsPerPage, filteredPayments.length);

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
                  <CreditCard size={16} />
                  Administration
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
                  Validation des paiements
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50/85">
                  Gérez les paiements manuels, validez les preuves, confirmez
                  les rendez-vous et suivez les revenus validés.
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
            icon={<CreditCard size={24} />}
            label="Paiements"
            value={payments.length}
            helper="Total des paiements"
            delay={0.1}
          />

          <StatBox
            icon={<CheckCircle2 size={24} />}
            label="Payés"
            value={paidCount}
            helper="Paiements validés"
            delay={0.15}
            success
          />

          <StatBox
            icon={<Wallet size={24} />}
            label="Revenus validés"
            value={formatMoney(totalAmount)}
            helper="Somme des paiements payés"
            delay={0.2}
          />

          <StatBox
            icon={<XCircle size={24} />}
            label="Refusés"
            value={failedCount}
            helper={`En attente : ${pendingCount}`}
            delay={0.25}
            danger
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
                Filtrez les paiements par statut ou recherchez par patient,
                psychologue, référence, méthode ou identifiant.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_280px]">
            <SearchInput
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Rechercher un paiement..."
            />

            <FilterSelect value={statusFilter} onChange={handleFilterChange} />
          </div>
        </motion.section>

        <section className="rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <ReceiptText size={16} />
                Liste
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Liste des paiements
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                Choisissez une action dans le menu pour valider ou refuser un
                paiement.
              </p>
            </div>

            <div className="hidden rounded-3xl bg-teal-50 p-4 text-[#1B4F59] md:block">
              <BadgeCheck size={30} />
            </div>
          </div>

          {loadingList ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
                <p className="font-bold text-slate-600">
                  Chargement des paiements...
                </p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    Affichage {startItem} - {endItem} sur{" "}
                    {filteredPayments.length} paiement(s)
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
                  <table className="w-full min-w-[1280px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <TableHead>ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Psychologue</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Reçu</TableHead>
                        <TableHead align="right">Action</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedPayments.map((payment) => {
                        const metadata = parseMetadata(payment.metadata);

                        return (
                          <tr
                            key={payment.id}
                            className="transition hover:bg-slate-50/80"
                          >
                            <TableCell>
                              <span className="font-black text-slate-950">
                                #{payment.id}
                              </span>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59]">
                                  <UserRound size={22} />
                                </div>

                                <div>
                                  <p className="font-black text-slate-950">
                                    {payment.user_name || "—"}
                                  </p>

                                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                                    <Mail size={13} />
                                    {payment.user_email || "Email non défini"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Stethoscope
                                  size={16}
                                  className="text-slate-400"
                                />
                                <span>{payment.psychologist_name || "—"}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <strong className="text-slate-950">
                                {formatMoney(payment.amount, payment.currency)}
                              </strong>
                            </TableCell>

                            <TableCell>
                              <StatusBadge status={payment.status} />
                            </TableCell>

                            <TableCell>
                              <PaymentMethodBadge
                                method={payment.payment_method || "—"}
                              />
                            </TableCell>

                            <TableCell>
                              <span className="font-semibold text-slate-700">
                                {metadata.proof_reference || "—"}
                              </span>
                            </TableCell>

                            <TableCell>
                              {getProofUrl(metadata) ? (
                                <a
                                  href={getProofUrl(metadata)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-4 py-2 text-xs font-black text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#163f47]"
                                >
                                  <ReceiptText size={14} />
                                  Voir reçu
                                </a>
                              ) : (
                                <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                                  Aucun fichier
                                </span>
                              )}
                            </TableCell>

                            <TableCell align="right">
                              <ActionSelect
                                payment={payment}
                                loadingId={actionLoadingId}
                                onAction={handleAction}
                              />
                            </TableCell>
                          </tr>
                        );
                      })}
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
      <p className="text-sm font-bold text-slate-500">
        Navigation des pages
      </p>

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
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="paid">Payés</option>
          <option value="failed">Refusés</option>
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>
    </div>
  );
}

function ActionSelect({
  payment,
  loadingId,
  onAction,
}: {
  payment: any;
  loadingId: number | string | null;
  onAction: (actionValue: string, payment: any) => void;
}) {
  const isLoading = loadingId === payment.id;
  const isPaid = payment.status === "paid";
  const isFailed =
    payment.status === "failed" || payment.status === "rejected";

  return (
    <div className="relative ml-auto w-[220px]">
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
        disabled={isLoading || isPaid || isFailed}
        onChange={(e) => onAction(e.target.value, payment)}
        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-black text-[#1B4F59] outline-none transition hover:bg-white focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {isLoading
            ? "Traitement..."
            : isPaid
            ? "Déjà payé"
            : isFailed
            ? "Déjà refusé"
            : "Choisir action"}
        </option>

        {!isPaid && !isFailed && (
          <>
            <option value="validate">Valider paiement</option>
            <option value="reject">Refuser paiement</option>
          </>
        )}
      </select>

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#1B4F59]">
        ▾
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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

  if (value === "failed" || value === "rejected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
        <XCircle size={14} />
        Refusé
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      {status || "unknown"}
    </span>
  );
}

function PaymentMethodBadge({ method }: { method: string }) {
  const value = String(method || "").toLowerCase();

  if (value === "ccp") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
        <Banknote size={14} />
        CCP
      </span>
    );
  }

  if (value === "baridimob") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
        <Wallet size={14} />
        BaridiMob
      </span>
    );
  }

  if (value === "cash") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        <Wallet size={14} />
        Cash
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      <CreditCard size={14} />
      {method || "—"}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto mb-5 inline-flex rounded-3xl bg-white p-4 text-[#1B4F59] shadow-sm">
          <CreditCard size={34} />
        </div>

        <h3 className="text-xl font-black text-slate-950">
          Aucun paiement trouvé
        </h3>

        <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
          Aucun paiement ne correspond au filtre ou à la recherche actuelle.
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