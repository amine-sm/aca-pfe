"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";

import { useAuthGuard } from "../../hooks/useAuthGuard";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getAdminPaymentMethods,
  PaymentMethod,
  updatePaymentMethod,
} from "@/lib/paymentMethodsApi";

type FormState = {
  id?: number | string;
  method_type: string;
  name: string;
  account_holder: string;
  ccp_number: string;
  rip_key: string;
  bank_name: string;
  phone_number: string;
  instructions: string;
  is_active: boolean;
  sort_order: string;
};

const emptyForm: FormState = {
  method_type: "ccp",
  name: "Paiement CCP",
  account_holder: "",
  ccp_number: "",
  rip_key: "",
  bank_name: "Algérie Poste",
  phone_number: "",
  instructions: "Envoyez le paiement puis joignez une preuve PNG/JPG/PDF.",
  is_active: true,
  sort_order: "1",
};

export default function AdminPaymentMethodsPage() {
  const { loading: authLoading } = useAuthGuard(["ADMIN", "SUPER_ADMIN"]);

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => methods.filter((method) => method.is_active).length,
    [methods]
  );

  async function loadMethods() {
    try {
      setError("");
      setLoadingList(true);
      const data: any = await getAdminPaymentMethods();
      setMethods(data.methods || []);
    } catch (err: any) {
      setError(err.message || "Erreur chargement méthodes de paiement");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadMethods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  function handleEdit(method: PaymentMethod) {
    setForm({
      id: method.id,
      method_type: method.method_type || "ccp",
      name: method.name || "",
      account_holder: method.account_holder || "",
      ccp_number: method.ccp_number || "",
      rip_key: method.rip_key || "",
      bank_name: method.bank_name || "",
      phone_number: method.phone_number || "",
      instructions: method.instructions || "",
      is_active: Boolean(method.is_active),
      sort_order: String(method.sort_order || 0),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Nom de la méthode obligatoire.");
      return;
    }

    if (form.method_type === "ccp" && !form.ccp_number.trim()) {
      setError("Numéro CCP obligatoire.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        method_type: form.method_type,
        name: form.name,
        account_holder: form.account_holder,
        ccp_number: form.ccp_number,
        rip_key: form.rip_key,
        bank_name: form.bank_name,
        phone_number: form.phone_number,
        instructions: form.instructions,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      const data: any = form.id
        ? await updatePaymentMethod(form.id, payload)
        : await createPaymentMethod(payload);

      setMessage(data.message || "Méthode sauvegardée.");
      setForm(emptyForm);
      await loadMethods();
    } catch (err: any) {
      setError(err.message || "Erreur sauvegarde méthode");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(method: PaymentMethod) {
    if (!confirm(`Désactiver la méthode "${method.name}" ?`)) return;

    try {
      setError("");
      setMessage("");
      const data: any = await deletePaymentMethod(method.id);
      setMessage(data.message || "Méthode désactivée.");
      await loadMethods();
    } catch (err: any) {
      setError(err.message || "Erreur désactivation méthode");
    }
  }

  async function toggleActive(method: PaymentMethod) {
    try {
      setError("");
      setMessage("");
      const data: any = await updatePaymentMethod(method.id, {
        is_active: !method.is_active,
      });
      setMessage(data.message || "Statut modifié.");
      await loadMethods();
    } catch (err: any) {
      setError(err.message || "Erreur modification statut");
    }
  }

  if (authLoading) {
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
      <BackgroundDecor />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8 overflow-hidden rounded-[34px] bg-[#1B4F59] p-7 text-white shadow-2xl shadow-teal-900/20 md:p-10"
        >
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <Wallet size={16} />
                Administration
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
                Méthodes de paiement
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50/85">
                Ajoutez les méthodes de paiement visibles par le patient : CCP,
                clé/RIP, titulaire, téléphone et instructions.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMethods}
              disabled={loadingList}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#1B4F59] shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-50 disabled:opacity-70"
            >
              {loadingList ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCcw size={18} />
              )}
              Actualiser
            </button>
          </div>
        </motion.section>

        {error && <AlertMessage type="error" message={error} />}
        {message && <AlertMessage type="success" message={message} />}

        <section className="mb-8 grid gap-5 sm:grid-cols-3">
          <StatBox
            icon={<CreditCard size={24} />}
            label="Méthodes"
            value={methods.length}
            helper="Total ajouté"
          />
          <StatBox
            icon={<CheckCircle2 size={24} />}
            label="Actives"
            value={activeCount}
            helper="Affichées au patient"
            success
          />
          <StatBox
            icon={<XCircle size={24} />}
            label="Inactives"
            value={methods.length - activeCount}
            helper="Masquées côté patient"
            danger
          />
        </section>

        <div className="grid gap-8 lg:grid-cols-[430px_1fr] lg:items-start">
          <section className="rounded-[34px] border border-slate-100 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
              <Plus size={16} />
              {form.id ? "Modifier" : "Nouvelle méthode"}
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              {form.id ? "Modifier méthode" : "Ajouter méthode"}
            </h2>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <SelectField
                label="Type"
                value={form.method_type}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, method_type: value }))
                }
                options={[
                  { value: "ccp", label: "CCP" },
                  { value: "baridimob", label: "BaridiMob" },
                  { value: "cash", label: "Cash" },
                  { value: "bank", label: "Virement bancaire" },
                  { value: "other", label: "Autre" },
                ]}
              />

              <InputField
                label="Nom affiché au patient"
                value={form.name}
                onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                placeholder="Ex: CCP - Cabinet Amine"
              />

              <InputField
                label="Titulaire"
                value={form.account_holder}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, account_holder: value }))
                }
                placeholder="Nom du titulaire"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Numéro CCP"
                  value={form.ccp_number}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, ccp_number: value }))
                  }
                  placeholder="Ex: 1234567890"
                />

                <InputField
                  label="Clé / RIP"
                  value={form.rip_key}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, rip_key: value }))
                  }
                  placeholder="Ex: 12"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Banque / Service"
                  value={form.bank_name}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, bank_name: value }))
                  }
                  placeholder="Algérie Poste"
                />

                <InputField
                  label="Téléphone"
                  value={form.phone_number}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, phone_number: value }))
                  }
                  placeholder="05 XX XX XX XX"
                />
              </div>

              <InputField
                label="Ordre affichage"
                value={form.sort_order}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, sort_order: value }))
                }
                placeholder="1"
                type="number"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Instructions affichées au patient
                </label>
                <textarea
                  value={form.instructions}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  placeholder="Ex: Faites le virement puis joignez la preuve de paiement."
                  className="min-h-28 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="font-black text-slate-900">Active</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Si active, le patient peut choisir cette méthode.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="h-5 w-5 accent-[#1B4F59]"
                />
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/20 transition hover:bg-[#163f47] disabled:opacity-70"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {form.id ? "Modifier" : "Ajouter"}
                </button>

                {form.id && (
                  <button
                    type="button"
                    onClick={() => setForm(emptyForm)}
                    className="inline-flex h-13 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-[34px] border border-slate-100 bg-white/95 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
            <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                  <Wallet size={16} />
                  Liste
                </div>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Méthodes disponibles
                </h2>

                <p className="mt-2 max-w-3xl leading-7 text-slate-500">
                  Les méthodes actives seront affichées côté patient dans l’espace paiement.
                </p>
              </div>
            </div>

            {loadingList ? (
              <LoadingBox />
            ) : methods.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className="rounded-[28px] border border-slate-100 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1B4F59] shadow-sm">
                          <CreditCard size={22} />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-black text-slate-950">
                              {method.name}
                            </p>
                            <StatusBadge active={method.is_active} />
                          </div>

                          <p className="mt-1 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                            {method.method_type}
                          </p>

                          <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                            {method.account_holder && <p>Titulaire : {method.account_holder}</p>}
                            {method.ccp_number && <p>CCP : {method.ccp_number}</p>}
                            {method.rip_key && <p>Clé/RIP : {method.rip_key}</p>}
                            {method.bank_name && <p>Service : {method.bank_name}</p>}
                            {method.phone_number && <p>Téléphone : {method.phone_number}</p>}
                            <p>Ordre : {method.sort_order || 0}</p>
                          </div>

                          {method.instructions && (
                            <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-slate-600">
                              {method.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => handleEdit(method)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-[#1B4F59] shadow-sm transition hover:bg-teal-50"
                        >
                          <Edit3 size={15} />
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleActive(method)}
                          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black shadow-sm transition ${
                            method.is_active
                              ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {method.is_active ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                          {method.is_active ? "Désactiver" : "Activer"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDisable(method)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-black text-red-600 shadow-sm transition hover:bg-red-100"
                        >
                          <Trash2 size={15} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
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

function AlertMessage({ type, message }: { type: "error" | "success"; message: string }) {
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
      {type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{message}</span>
    </motion.div>
  );
}

function StatBox({ icon, label, value, helper, success = false, danger = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; helper: string; success?: boolean; danger?: boolean; }) {
  const iconClass = success
    ? "bg-emerald-50 text-emerald-600"
    : danger
    ? "bg-red-50 text-red-600"
    : "bg-teal-50 text-[#1B4F59]";

  return (
    <div className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
      <div className={`mb-5 inline-flex rounded-2xl p-4 ${iconClass}`}>{icon}</div>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
      <p className="mt-2 text-sm font-semibold text-slate-400">{helper}</p>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
      Inactive
    </span>
  );
}

function LoadingBox() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-slate-100 bg-slate-50">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
        <p className="font-bold text-slate-600">Chargement...</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <div className="mx-auto mb-5 inline-flex rounded-3xl bg-white p-4 text-[#1B4F59] shadow-sm">
          <Wallet size={34} />
        </div>
        <h3 className="text-xl font-black text-slate-950">Aucune méthode</h3>
        <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
          Ajoutez une méthode comme CCP pour l'afficher au patient.
        </p>
      </div>
    </div>
  );
}
