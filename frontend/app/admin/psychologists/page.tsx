"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  HandCoins,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UsersRound,
  XCircle,
  Mail,
  MapPin,
  BadgeCheck,
  Search,
} from "lucide-react";

import {
  disablePsychologist,
  enablePsychologist,
  getAdminPsychologists,
  verifyPsychologist,
} from "@/lib/adminApi";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export default function AdminPsychologistsPage() {
  const { loading } = useAuthGuard(["ADMIN", "SUPER_ADMIN"]);

  const [psychologists, setPsychologists] = useState<any[]>([]);
  const [filteredPsychologists, setFilteredPsychologists] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

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
      const data: any = await getAdminPsychologists();
      const list = data.psychologists || [];

      setPsychologists(list);
      setFilteredPsychologists(applyFilterAndSearch(list, statusFilter, searchText));
    } catch (err: any) {
      setError(err.message || "Erreur chargement psychologues");
    } finally {
      setLoadingList(false);
    }
  }

  function applyFilterAndSearch(list: any[], filter: string, search: string) {
    let result = [...list];

    if (filter === "verified") {
      result = result.filter((p) => p.is_verified);
    }

    if (filter === "not_verified") {
      result = result.filter((p) => !p.is_verified);
    }

    if (filter === "active") {
      result = result.filter((p) => p.is_active);
    }

    if (filter === "inactive") {
      result = result.filter((p) => !p.is_active);
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((p) => {
        return (
          String(p.full_name || "").toLowerCase().includes(query) ||
          String(p.email || "").toLowerCase().includes(query) ||
          String(p.city || "").toLowerCase().includes(query) ||
          String(p.specialization || "").toLowerCase().includes(query)
        );
      });
    }

    return result;
  }

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setFilteredPsychologists(applyFilterAndSearch(psychologists, value, searchText));
  }

  function handleSearchChange(value: string) {
    setSearchText(value);
    setFilteredPsychologists(applyFilterAndSearch(psychologists, statusFilter, value));
  }

  async function handleAction(actionValue: string, psychologist: any) {
    if (!actionValue) return;

    setError("");
    setMessage("");
    setActionLoadingId(psychologist.id);

    try {
      let data: any = null;

      if (actionValue === "verify") {
        data = await verifyPsychologist(psychologist.id);
      }

      if (actionValue === "disable") {
        data = await disablePsychologist(psychologist.id);
      }

      if (actionValue === "enable") {
        data = await enablePsychologist(psychologist.id);
      }

      setMessage(data?.message || "Action effectuée avec succès");

      const refreshed: any = await getAdminPsychologists();
      const list = refreshed.psychologists || [];

      setPsychologists(list);
      setFilteredPsychologists(applyFilterAndSearch(list, statusFilter, searchText));
    } catch (err: any) {
      setError(err.message || "Erreur action");
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

  const verifiedCount = psychologists.filter((p) => p.is_verified).length;
  const pendingCount = psychologists.filter((p) => !p.is_verified).length;
  const activeCount = psychologists.filter((p) => p.is_active).length;
  const inactiveCount = psychologists.filter((p) => !p.is_active).length;

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
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute right-[-180px] top-40 h-[460px] w-[460px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Header */}
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
                  <Stethoscope size={16} />
                  Administration
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
                  Validation des psychologues
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50/85">
                  Gérez les comptes psychologues, vérifiez les profils, activez
                  ou désactivez les accès avec une interface claire.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin/psychologists/commissions"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  <HandCoins size={18} />
                  Commissions
                </Link>

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
          </div>
        </motion.section>

        {/* Alerts */}
        {error && <AlertMessage type="error" message={error} />}
        {message && <AlertMessage type="success" message={message} />}

        {/* Stats */}
        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon={<Stethoscope size={24} />}
            label="Psychologues"
            value={psychologists.length}
            helper="Total des comptes"
            delay={0.1}
          />

          <StatBox
            icon={<ShieldCheck size={24} />}
            label="Vérifiés"
            value={verifiedCount}
            helper={`En attente : ${pendingCount}`}
            delay={0.15}
          />

          <StatBox
            icon={<UserCheck size={24} />}
            label="Actifs"
            value={activeCount}
            helper={`Inactifs : ${inactiveCount}`}
            delay={0.2}
          />

          <StatBox
            icon={<UsersRound size={24} />}
            label="Affichés"
            value={filteredPsychologists.length}
            helper="Selon le filtre"
            delay={0.25}
          />
        </section>

        {/* Filters */}
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
                Filtrez les psychologues par statut ou recherchez par nom,
                email, ville ou spécialité.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_280px]">
            <SearchInput
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Rechercher un psychologue..."
            />

            <FilterSelect value={statusFilter} onChange={handleFilterChange} />
          </div>
        </motion.section>

        {/* Table */}
        <section className="rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <Stethoscope size={16} />
                Liste
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Liste des psychologues
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                Choisissez une action dans le menu pour valider, activer ou
                désactiver un compte.
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
                  Chargement des psychologues...
                </p>
              </div>
            </div>
          ) : filteredPsychologists.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-hidden rounded-[26px] border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <TableHead>ID</TableHead>
                      <TableHead>Psychologue</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Vérification</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead align="right">Action</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPsychologists.map((psychologist) => (
                      <tr
                        key={psychologist.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <TableCell>
                          <span className="font-black text-slate-950">
                            #{psychologist.id}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59]">
                              <Stethoscope size={22} />
                            </div>

                            <div>
                              <p className="font-black text-slate-950">
                                {psychologist.full_name || "Sans nom"}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {psychologist.specialization ||
                                  "Spécialité non définie"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-slate-400" />
                            <span>{psychologist.email || "—"}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            <span>{psychologist.city || "—"}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <VerificationBadge verified={psychologist.is_verified} />
                        </TableCell>

                        <TableCell>
                          <ActiveBadge active={psychologist.is_active} />
                        </TableCell>

                        <TableCell align="right">
                          <ActionSelect
                            psychologist={psychologist}
                            loading={actionLoadingId === psychologist.id}
                            onAction={handleAction}
                          />
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
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur"
    >
      <div className="mb-5 inline-flex rounded-2xl bg-teal-50 p-4 text-[#1B4F59]">
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
          <option value="verified">Vérifiés</option>
          <option value="not_verified">Non vérifiés</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>
    </div>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        <CheckCircle2 size={14} />
        Vérifié
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
      <AlertCircle size={14} />
      En attente
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-[#1B4F59]">
        <UserCheck size={14} />
        Actif
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
      <XCircle size={14} />
      Inactif
    </span>
  );
}

function ActionSelect({
  psychologist,
  loading,
  onAction,
}: {
  psychologist: any;
  loading: boolean;
  onAction: (actionValue: string, psychologist: any) => void;
}) {
  return (
    <div className="relative ml-auto w-[230px]">
      {loading ? (
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
        disabled={loading}
        onChange={(e) => onAction(e.target.value, psychologist)}
        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-black text-[#1B4F59] outline-none transition hover:bg-white focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {loading ? "Traitement..." : "Choisir action"}
        </option>

        {!psychologist.is_verified && (
          <option value="verify">Valider psychologue</option>
        )}

        {psychologist.is_active ? (
          <option value="disable">Désactiver compte</option>
        ) : (
          <option value="enable">Activer compte</option>
        )}
      </select>

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#1B4F59]">
        ▾
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto mb-5 inline-flex rounded-3xl bg-white p-4 text-[#1B4F59] shadow-sm">
          <Stethoscope size={34} />
        </div>

        <h3 className="text-xl font-black text-slate-950">
          Aucun psychologue trouvé
        </h3>

        <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
          Aucun résultat ne correspond au filtre ou à la recherche actuelle.
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