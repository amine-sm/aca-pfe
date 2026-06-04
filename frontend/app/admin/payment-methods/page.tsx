"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  Landmark,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { useAuthGuard } from "../../hooks/useAuthGuard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type PaymentMethod = {
  id: number;
  name: string;
  method_type: string;
  account_holder?: string;
  ccp_number?: string;
  rip_key?: string;
  bank_name?: string;
  phone_number?: string;
  instructions?: string;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
};

type MethodForm = {
  name: string;
  method_type: string;
  account_holder: string;
  ccp_number: string;
  rip_key: string;
  bank_name: string;
  phone_number: string;
  instructions: string;
  is_active: boolean;
};

const emptyForm: MethodForm = {
  name: "",
  method_type: "ccp",
  account_holder: "",
  ccp_number: "",
  rip_key: "",
  bank_name: "",
  phone_number: "",
  instructions: "",
  is_active: true,
};

async function api(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("aca_token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Erreur ${res.status}`);
  }

  return data;
}

function copyText(value: any) {
  if (!value) return;
  navigator.clipboard?.writeText(String(value)).catch(() => {});
}

function getMethodIcon(type: string) {
  const value = String(type || "").toLowerCase();

  if (value.includes("ccp")) return <Landmark size={22} />;
  if (value.includes("baridi")) return <Wallet size={22} />;
  if (value.includes("bank") || value.includes("banque")) {
    return <Landmark size={22} />;
  }
  if (value.includes("cash")) return <Banknote size={22} />;

  return <CreditCard size={22} />;
}

function getMethodLabel(type: string) {
  const value = String(type || "").toLowerCase();

  if (value === "ccp") return "Compte CCP";
  if (value === "baridimob") return "BaridiMob";
  if (value === "bank") return "Virement bancaire";
  if (value === "cash") return "Paiement cash";

  return type || "Méthode";
}

export default function AdminPaymentMethodsPage() {
  const { loading } = useAuthGuard(["ADMIN", "SUPER_ADMIN"]);

  const [mounted, setMounted] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [form, setForm] = useState<MethodForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadMethods() {
    setError("");
    setLoadingList(true);

    try {
      const data = await api("/payment-methods/admin");
      setMethods(data.methods || data.paymentMethods || []);
    } catch (err: any) {
      setError(err.message || "Erreur chargement méthodes de paiement");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (mounted && !loading) {
      loadMethods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, loading]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(method: PaymentMethod) {
    setEditingId(method.id);

    setForm({
      name: method.name || "",
      method_type: method.method_type || "ccp",
      account_holder: method.account_holder || "",
      ccp_number: method.ccp_number || "",
      rip_key: method.rip_key || "",
      bank_name: method.bank_name || "",
      phone_number: method.phone_number || "",
      instructions: method.instructions || "",
      is_active: Boolean(method.is_active),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Le nom de la méthode est obligatoire.");
      return;
    }

    if (!form.method_type.trim()) {
      setError("Le type de paiement est obligatoire.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        method_type: form.method_type,
        account_holder: form.account_holder.trim() || null,
        ccp_number: form.ccp_number.trim() || null,
        rip_key: form.rip_key.trim() || null,
        bank_name: form.bank_name.trim() || null,
        phone_number: form.phone_number.trim() || null,
        instructions: form.instructions.trim() || null,
        is_active: form.is_active,
      };

      if (editingId) {
        const data = await api(`/payment-methods/admin/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setMessage(data.message || "Méthode modifiée avec succès.");
      } else {
        const data = await api("/payment-methods/admin", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage(data.message || "Méthode ajoutée avec succès.");
      }

      resetForm();
      await loadMethods();
    } catch (err: any) {
      setError(err.message || "Erreur sauvegarde méthode de paiement");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(method: PaymentMethod) {
    setError("");
    setMessage("");
    setActionLoadingId(method.id);

    try {
      const data = await api(`/payment-methods/admin/${method.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...method,
          is_active: !Boolean(method.is_active),
        }),
      });

      setMessage(data.message || "Statut modifié avec succès.");
      await loadMethods();
    } catch (err: any) {
      setError(err.message || "Erreur modification statut");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function deleteMethod(id: number) {
    if (!confirm("Supprimer cette méthode de paiement ?")) return;

    setError("");
    setMessage("");
    setActionLoadingId(id);

    try {
      const data = await api(`/payment-methods/admin/${id}`, {
        method: "DELETE",
      });

      setMessage(data.message || "Méthode supprimée avec succès.");
      await loadMethods();
    } catch (err: any) {
      setError(err.message || "Erreur suppression méthode");
    } finally {
      setActionLoadingId(null);
    }
  }

  const activeCount = useMemo(() => {
    return methods.filter((method) => Boolean(method.is_active)).length;
  }, [methods]);

  if (!mounted) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-[28px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/70">
            <Loader2 className="animate-spin text-[#1B4F59]" size={24} />
            <p className="font-bold text-slate-700">Chargement...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="absolute right-[-180px] top-40 h-[460px] w-[460px] rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full bg-emerald-100/70 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 overflow-hidden rounded-[34px] border border-slate-100 bg-white p-7 shadow-2xl shadow-slate-200/70 md:p-10"
        >
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-[#1B4F59]">
                <CreditCard size={16} />
                Administration
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Méthodes de paiement
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">
                Ajoutez les comptes CCP, BaridiMob, banque ou cash affichés aux
                patients avant l’envoi du reçu de paiement.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMethods}
              disabled={loadingList}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-5 py-3 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:text-white"
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

        <AnimatePresence>
          {error && <AlertMessage type="error" message={error} />}
          {message && <AlertMessage type="success" message={message} />}
        </AnimatePresence>

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon={<CreditCard size={24} />}
            label="Méthodes"
            value={methods.length}
            helper="Total enregistré"
            delay={0.1}
          />
          <StatBox
            icon={<CheckCircle2 size={24} />}
            label="Actives"
            value={activeCount}
            helper="Affichées au patient"
            delay={0.15}
            success
          />
          <StatBox
            icon={<Landmark size={24} />}
            label="CCP / Banque"
            value={
              methods.filter((m) =>
                ["ccp", "bank"].includes(String(m.method_type).toLowerCase())
              ).length
            }
            helper="Comptes bancaires"
            delay={0.2}
          />
          <StatBox
            icon={<Wallet size={24} />}
            label="Autres"
            value={
              methods.filter(
                (m) =>
                  !["ccp", "bank"].includes(String(m.method_type).toLowerCase())
              ).length
            }
            helper="Cash / BaridiMob"
            delay={0.25}
          />
        </section>

        <section className="mb-8 grid gap-8 xl:grid-cols-[0.9fr_1.4fr]">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-[34px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/70 md:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                  <Plus size={16} />
                  {editingId ? "Modification" : "Nouvelle méthode"}
                </div>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  {editingId ? "Modifier la méthode" : "Ajouter une méthode"}
                </h2>

                <p className="mt-2 leading-7 text-slate-500">
                  Les informations seront visibles par le patient.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-4 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47] [&_svg]:text-white"
                >
                  <X size={16} />
                  Annuler
                </button>
              )}
            </div>

            <div className="space-y-4">
              <InputField
                label="Nom méthode *"
                value={form.name}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, name: value }))
                }
                placeholder="Ex: CCP Cabinet ACA"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Type *
                </label>

                <select
                  value={form.method_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      method_type: e.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
                >
                  <option value="ccp">CCP</option>
                  <option value="baridimob">BaridiMob</option>
                  <option value="bank">Virement bancaire</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <InputField
                label="Titulaire"
                value={form.account_holder}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, account_holder: value }))
                }
                placeholder="Nom du titulaire"
              />

              <InputField
                label="Numéro CCP"
                value={form.ccp_number}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, ccp_number: value }))
                }
                placeholder="Ex: 0012345678"
              />

              <InputField
                label="Clé / RIP"
                value={form.rip_key}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, rip_key: value }))
                }
                placeholder="Ex: 12"
              />

              <InputField
                label="Banque"
                value={form.bank_name}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, bank_name: value }))
                }
                placeholder="Ex: Banque CPA"
              />

              <InputField
                label="Téléphone"
                value={form.phone_number}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, phone_number: value }))
                }
                placeholder="Ex: 0550 00 00 00"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Instructions
                </label>

                <textarea
                  value={form.instructions}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  placeholder="Ex: Envoyez le reçu après paiement..."
                  className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="font-black text-slate-900">Méthode active</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Si activée, elle sera affichée aux patients.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-[#1B4F59]"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-5 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:text-white"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : editingId ? (
                  <Save size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {saving
                  ? "Sauvegarde..."
                  : editingId
                  ? "Modifier"
                  : "Ajouter"}
              </button>
            </div>
          </motion.form>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="rounded-[34px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/70 md:p-8"
          >
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                <CreditCard size={16} />
                Liste
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Méthodes enregistrées
              </h2>

              <p className="mt-2 leading-7 text-slate-500">
                Activez, modifiez ou supprimez les méthodes de paiement.
              </p>
            </div>

            {loadingList ? (
              <LoadingBox />
            ) : methods.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {methods.map((method) => (
                    <MethodCard
                      key={method.id}
                      method={method}
                      loading={actionLoadingId === method.id}
                      onEdit={() => startEdit(method)}
                      onDelete={() => deleteMethod(method.id)}
                      onToggle={() => toggleActive(method)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.section>
        </section>
      </div>
    </main>
  );
}

function MethodCard({
  method,
  loading,
  onEdit,
  onDelete,
  onToggle,
}: {
  method: PaymentMethod;
  loading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const active = Boolean(method.is_active);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      whileHover={{ y: -3 }}
      className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#1B4F59]">
            {getMethodIcon(method.method_type)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-950">
                {method.name}
              </h3>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="mt-1 text-sm font-bold text-slate-500">
              {getMethodLabel(method.method_type)}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoLine label="Titulaire" value={method.account_holder} />
              <InfoLine label="CCP" value={method.ccp_number} copy />
              <InfoLine label="Clé/RIP" value={method.rip_key} copy />
              <InfoLine label="Banque" value={method.bank_name} />
              <InfoLine label="Téléphone" value={method.phone_number} copy />
            </div>

            {method.instructions && (
              <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#1B4F59]">
                  Instructions
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {method.instructions}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onToggle}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-4 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:text-white"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : active ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
            {active ? "Désactiver" : "Activer"}
          </button>

          <button
            type="button"
            onClick={onEdit}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-4 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:text-white"
          >
            <Edit3 size={16} />
            Modifier
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-4 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:text-white"
          >
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InfoLine({
  label,
  value,
  copy = false,
}: {
  label: string;
  value: any;
  copy?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="break-words text-sm font-black text-slate-800">
          {value}
        </p>

        {copy && (
          <button
            type="button"
            onClick={() => copyText(value)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1B4F59] text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#153f47] [&_svg]:text-white"
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </div>
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60"
    >
      <div
        className={`mb-5 inline-flex rounded-2xl p-4 ${
          success ? "bg-emerald-50 text-emerald-600" : "bg-teal-50 text-[#1B4F59]"
        }`}
      >
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{label}</p>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
      <p className="mt-2 text-sm font-semibold text-slate-400">{helper}</p>
    </motion.div>
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
      exit={{ opacity: 0, y: -8 }}
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
          <CreditCard size={34} />
        </div>

        <h3 className="text-xl font-black text-slate-950">
          Aucune méthode trouvée
        </h3>

        <p className="mx-auto mt-2 max-w-md leading-7 text-slate-500">
          Ajoutez une méthode de paiement pour l’afficher aux patients.
        </p>
      </div>
    </div>
  );
}