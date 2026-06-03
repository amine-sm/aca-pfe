"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  FileText,
  Filter,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react";

import { getMyPatients } from "@/lib/psychologistsApi";
import { useAuthGuard } from "../../hooks/useAuthGuard";

function normalizeRisk(value: any) {
  return String(value || "").toLowerCase().trim();
}

function getRiskLabel(value: any) {
  const risk = normalizeRisk(value);

  if (risk === "critical" || risk === "critique") return "Critique";
  if (risk === "high" || risk === "eleve" || risk === "élevé") return "Élevé";

  if (
    risk === "medium" ||
    risk === "moyen" ||
    risk === "modéré" ||
    risk === "modere"
  ) {
    return "Moyen";
  }

  if (risk === "low" || risk === "faible") return "Faible";

  return value || "Non défini";
}

function getPatientId(patient: any) {
  return (
    patient.user_id ||
    patient.patient_id ||
    patient.patient?.id ||
    patient.id
  );
}

export default function PatientsPage() {
  const { loading } = useAuthGuard(["PSYCHOLOGIST"]);

  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);

  const [riskFilter, setRiskFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(false);

  function applyFilterAndSearch(list: any[], filter: string, search: string) {
    let result = [...list];

    if (filter !== "all") {
      result = result.filter((patient) => {
        const risk = normalizeRisk(patient.risk_level);

        if (filter === "critical") {
          return risk === "critical" || risk === "critique";
        }

        if (filter === "high") {
          return risk === "high" || risk === "eleve" || risk === "élevé";
        }

        if (filter === "medium") {
          return (
            risk === "medium" ||
            risk === "moyen" ||
            risk === "modéré" ||
            risk === "modere"
          );
        }

        if (filter === "low") {
          return risk === "low" || risk === "faible";
        }

        return true;
      });
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((patient) => {
        return (
          String(patient.full_name || "").toLowerCase().includes(query) ||
          String(patient.email || "").toLowerCase().includes(query) ||
          String(patient.phone || "").toLowerCase().includes(query) ||
          String(patient.city || "").toLowerCase().includes(query) ||
          String(patient.risk_level || "").toLowerCase().includes(query) ||
          String(patient.addiction_type || "").toLowerCase().includes(query)
        );
      });
    }

    return result;
  }

  async function loadPatients() {
    try {
      setError("");
      setLoadingData(true);

      const data: any = await getMyPatients();
      const list = data.patients || data.data || [];

      const cleanList = Array.isArray(list) ? list : [];

      setPatients(cleanList);
      setFilteredPatients(
        applyFilterAndSearch(cleanList, riskFilter, searchText)
      );
    } catch (err: any) {
      setError(err.message || "Erreur chargement patients");
    } finally {
      setLoadingData(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearchText(value);
    setFilteredPatients(applyFilterAndSearch(patients, riskFilter, value));
  }

  function handleRiskChange(value: string) {
    setRiskFilter(value);
    setFilteredPatients(applyFilterAndSearch(patients, value, searchText));
  }

  useEffect(() => {
    if (!loading) {
      loadPatients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const criticalCount = useMemo(() => {
    return patients.filter((patient) =>
      ["critical", "critique"].includes(normalizeRisk(patient.risk_level))
    ).length;
  }, [patients]);

  const highCount = useMemo(() => {
    return patients.filter((patient) =>
      ["high", "eleve", "élevé"].includes(normalizeRisk(patient.risk_level))
    ).length;
  }, [patients]);

  const mediumCount = useMemo(() => {
    return patients.filter((patient) =>
      ["medium", "moyen", "modéré", "modere"].includes(
        normalizeRisk(patient.risk_level)
      )
    ).length;
  }, [patients]);

  const lowCount = useMemo(() => {
    return patients.filter((patient) =>
      ["low", "faible"].includes(normalizeRisk(patient.risk_level))
    ).length;
  }, [patients]);

  if (loading) {
    return (
      <main className="relative min-h-screen bg-[#F7FAFB]">
        <BackgroundDecor />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
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
      <BackgroundDecor />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8 overflow-hidden rounded-[34px] bg-gradient-to-br from-[#1B4F59] via-[#236876] to-[#2E6F7E] p-7 text-white shadow-2xl shadow-teal-900/20 md:p-10"
        >
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <UsersRound size={16} />
                Espace psychologue
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
                Patients affectés
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50/85">
                Consultez les patients affectés à votre suivi, leur niveau de
                risque et leur dossier clinique complet.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPatients}
              disabled={loadingData}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#1B4F59] shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingData ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCcw size={18} />
              )}
              Actualiser
            </button>
          </div>
        </motion.section>

        {error && <AlertMessage message={error} />}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon={<UsersRound size={24} />}
            label="Patients"
            value={patients.length}
            helper="Total affecté"
            delay={0.1}
          />

          <StatBox
            icon={<ShieldAlert size={24} />}
            label="Critiques"
            value={criticalCount}
            helper={`Élevés : ${highCount}`}
            delay={0.15}
            danger
          />

          <StatBox
            icon={<AlertCircle size={24} />}
            label="Moyens"
            value={mediumCount}
            helper="Risque à surveiller"
            delay={0.2}
            warn
          />

          <StatBox
            icon={<BadgeCheck size={24} />}
            label="Faibles"
            value={lowCount}
            helper="Suivi standard"
            delay={0.25}
            success
          />
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="mb-8 rounded-[34px] border border-slate-100 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
            <Filter size={16} />
            Filtres
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
            Rechercher et filtrer
          </h2>

          <p className="mt-2 max-w-3xl leading-7 text-slate-500">
            Recherchez par nom, email, téléphone, ville, risque ou type
            d’addiction.
          </p>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_280px]">
            <SearchInput
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Rechercher un patient..."
            />

            <RiskFilter value={riskFilter} onChange={handleRiskChange} />
          </div>
        </motion.section>

        <section className="rounded-[34px] border border-slate-100 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <UserRound size={16} />
                Liste
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Liste des patients
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                Les patients apparaissent ici après une recommandation acceptée
                ou une affectation active.
              </p>
            </div>

            <div className="hidden rounded-3xl bg-teal-50 p-4 text-[#1B4F59] md:block">
              <UsersRound size={30} />
            </div>
          </div>

          {loadingData ? (
            <LoadingBox />
          ) : filteredPatients.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-hidden rounded-[26px] border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <TableHead>Patient</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Risque</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dossier</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPatients.map((patient, index) => {
                      const patientId = getPatientId(patient);

                      return (
                        <tr
                          key={`${patient.assignment_id || "a"}-${
                            patientId || index
                          }`}
                          className="transition hover:bg-slate-50/80"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59]">
                                <UserRound size={22} />
                              </div>

                              <div>
                                <p className="font-black text-slate-950">
                                  {patient.full_name || "Patient"}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                  ID patient #{patientId || "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail size={16} className="text-slate-400" />
                              <span>{patient.email || "—"}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone size={16} className="text-slate-400" />
                              <span>{patient.phone || "—"}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-slate-400" />
                              <span>{patient.city || "—"}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <RiskBadge risk={patient.risk_level} />
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {patient.addiction_type || "—"}
                            </span>
                          </TableCell>

                          <TableCell>
                            {patientId ? (
                              <Link
                                href={`/psychologist/patient/${patientId}`}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#163f47]"
                              >
                                <FileText size={15} className="text-white" />
                                <span className="text-white">Voir dossier</span>
                              </Link>
                            ) : (
                              <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                                ID manquant
                              </span>
                            )}
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

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="absolute right-[-180px] top-40 h-[460px] w-[460px] rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
    </div>
  );
}

function AlertMessage({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-sm"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
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
  warn = false,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper: string;
  delay: number;
  success?: boolean;
  warn?: boolean;
  danger?: boolean;
}) {
  const iconClass = success
    ? "bg-emerald-50 text-emerald-600"
    : danger
    ? "bg-red-50 text-red-600"
    : warn
    ? "bg-orange-50 text-orange-600"
    : "bg-teal-50 text-[#1B4F59]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur"
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

function RiskFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        Risque
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
          <option value="critical">Critique</option>
          <option value="high">Élevé</option>
          <option value="medium">Moyen</option>
          <option value="low">Faible</option>
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const value = normalizeRisk(risk);

  if (value === "critical" || value === "critique") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
        <ShieldAlert size={14} />
        Critique
      </span>
    );
  }

  if (value === "high" || value === "eleve" || value === "élevé") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
        <AlertCircle size={14} />
        Élevé
      </span>
    );
  }

  if (
    value === "medium" ||
    value === "moyen" ||
    value === "modéré" ||
    value === "modere"
  ) {
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
      {getRiskLabel(risk)}
    </span>
  );
}

function LoadingBox() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
        <p className="font-bold text-slate-600">
          Chargement des patients...
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto mb-5 inline-flex rounded-3xl bg-white p-4 text-[#1B4F59] shadow-sm">
          <UsersRound size={34} />
        </div>

        <h3 className="text-xl font-black text-slate-950">
          Aucun patient affecté
        </h3>

        <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
          Les patients apparaîtront ici après une recommandation acceptée ou une
          affectation.
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