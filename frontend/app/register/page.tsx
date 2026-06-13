"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Globe2,
  HeartPulse,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import { registerUser } from "@/lib/usersApi";
import { saveAuth } from "@/lib/api";
import { useAuth } from "../components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    city: "Alger",
    country: "Algeria",
    preferred_language: "français",
    addiction_type: "cannabis",
    consumption_level: "moyen",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((previousForm) => ({
      ...previousForm,
      [key]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data: any = await registerUser(form);

      saveAuth({
        token: data.token,
        role: "USER",
        profile: data.user,
      });

      refreshAuth();
      router.push("/questionnaire");
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue pendant l’inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7FAFB] text-slate-900">
      {/* ARRIÈRE-PLAN */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="absolute right-[-180px] top-40 h-[460px] w-[460px] rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      </div>

      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        {/* PARTIE GAUCHE */}
        <motion.aside
          initial={{
            opacity: 0,
            x: -35,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative hidden overflow-hidden rounded-[34px] bg-[#1B4F59] p-10 text-white shadow-2xl shadow-teal-900/25 lg:block"
        >
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative z-10 flex min-h-[680px] flex-col justify-between">
            <div>
              {/* LOGO */}
              <Link
                href="/"
                className="inline-flex items-center gap-4"
                aria-label="Retour à l’accueil"
              >
                <motion.div
                  whileHover={{
                    scale: 1.06,
                    rotate: 2,
                  }}
                  whileTap={{
                    scale: 0.96,
                  }}
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/20 bg-white p-2 shadow-xl"
                >
                  <Image
                    src="/logo.png"
                    alt="Logo EL MOUSANID AI"
                    width={80}
                    height={80}
                    priority
                    className="h-full w-full object-contain"
                  />
                </motion.div>

                <div className="leading-tight">
                  <p className="text-2xl font-black tracking-tight text-white">
                    EL MOUSANID AI
                  </p>

                  <p className="mt-1 text-sm font-semibold text-teal-100/80">
                    Accompagnement &amp; soutien
                  </p>
                </div>
              </Link>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <ShieldCheck size={17} />
                Accompagnement confidentiel
              </div>

              <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight">
                Commencer un parcours de soutien
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-teal-50/85">
                Créez votre espace personnel pour répondre au questionnaire,
                recevoir une orientation adaptée et bénéficier d’un suivi humain
                avec des professionnels.
              </p>
            </div>

            <div className="space-y-4">
              <InfoLine text="Espace personnel sécurisé" />

              <InfoLine text="Questionnaire confidentiel" />

              <InfoLine text="Orientation adaptée à votre situation" />

              <InfoLine text="Suivi progressif avec un spécialiste" />
            </div>
          </div>
        </motion.aside>

        {/* CARTE D’INSCRIPTION */}
        <motion.section
          initial={{
            opacity: 0,
            y: 32,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto w-full max-w-3xl"
        >
          <div className="rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
            {/* LOGO MOBILE */}
            <Link
              href="/"
              className="mb-7 flex items-center gap-3 lg:hidden"
              aria-label="Retour à l’accueil"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-teal-900/10">
                <Image
                  src="/logo.png"
                  alt="Logo EL MOUSANID AI"
                  width={56}
                  height={56}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="leading-tight">
                <p className="text-lg font-black text-[#1B4F59]">
                  EL MOUSANID AI
                </p>

                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Accompagnement &amp; soutien
                </p>
              </div>
            </Link>

            {/* EN-TÊTE */}
            <div className="mb-8 flex items-start justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                  <UserPlus size={16} />
                  Créer un compte
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  Inscription utilisateur
                </h2>

                <p className="mt-3 max-w-xl leading-7 text-slate-500">
                  Remplissez vos informations pour créer votre profil et
                  commencer votre parcours d’accompagnement.
                </p>
              </div>

              <div className="hidden rounded-3xl bg-[#1B4F59] p-4 text-white shadow-lg shadow-teal-900/20 sm:block">
                <ShieldCheck size={30} />
              </div>
            </div>

            {/* MESSAGE D’ERREUR */}
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </motion.div>
            )}

            <form
              onSubmit={submit}
              className="space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  label="Nom complet"
                  icon={<UserRound size={18} />}
                  value={form.full_name}
                  onChange={(value) => update("full_name", value)}
                  placeholder="Votre nom complet"
                  autoComplete="name"
                  required
                />

                <InputField
                  label="Adresse email"
                  icon={<Mail size={18} />}
                  value={form.email}
                  onChange={(value) => update("email", value)}
                  placeholder="exemple@email.com"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  label="Mot de passe"
                  icon={<LockKeyhole size={18} />}
                  value={form.password}
                  onChange={(value) => update("password", value)}
                  placeholder="Votre mot de passe"
                  type="password"
                  autoComplete="new-password"
                  required
                />

                <InputField
                  label="Téléphone"
                  icon={<Phone size={18} />}
                  value={form.phone}
                  onChange={(value) => update("phone", value)}
                  placeholder="Votre numéro de téléphone"
                  type="tel"
                  autoComplete="tel"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  label="Ville"
                  icon={<MapPin size={18} />}
                  value={form.city}
                  onChange={(value) => update("city", value)}
                  placeholder="Votre ville"
                  autoComplete="address-level2"
                />

                <InputField
                  label="Pays"
                  icon={<Globe2 size={18} />}
                  value={form.country}
                  onChange={(value) => update("country", value)}
                  placeholder="Votre pays"
                  autoComplete="country-name"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Langue préférée"
                  icon={<ClipboardList size={18} />}
                  value={form.preferred_language}
                  onChange={(value) =>
                    update("preferred_language", value)
                  }
                  options={[
                    {
                      value: "français",
                      label: "Français",
                    },
                    {
                      value: "arabe",
                      label: "Arabe",
                    },
                    {
                      value: "anglais",
                      label: "Anglais",
                    },
                  ]}
                />

                <SelectField
                  label="Type d’addiction"
                  icon={<HeartPulse size={18} />}
                  value={form.addiction_type}
                  onChange={(value) =>
                    update("addiction_type", value)
                  }
                  options={[
                    {
                      value: "cannabis",
                      label: "Cannabis",
                    },
                    {
                      value: "alcool",
                      label: "Alcool",
                    },
                    {
                      value: "medicaments",
                      label: "Médicaments",
                    },
                    {
                      value: "autre",
                      label: "Autre",
                    },
                  ]}
                />
              </div>

              {/* NIVEAU DE CONSOMMATION */}
              <div>
                <label className="mb-3 block text-sm font-bold text-slate-700">
                  Niveau de consommation
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <LevelButton
                    active={form.consumption_level === "faible"}
                    title="Faible"
                    subtitle="Consommation occasionnelle"
                    onClick={() =>
                      update("consumption_level", "faible")
                    }
                  />

                  <LevelButton
                    active={form.consumption_level === "moyen"}
                    title="Moyen"
                    subtitle="Besoin d’un suivi"
                    onClick={() =>
                      update("consumption_level", "moyen")
                    }
                  />

                  <LevelButton
                    active={form.consumption_level === "élevé"}
                    title="Élevé"
                    subtitle="Accompagnement prioritaire"
                    onClick={() =>
                      update("consumption_level", "élevé")
                    }
                  />
                </div>
              </div>

              {/* BOUTON D’INSCRIPTION */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={
                  !loading
                    ? {
                        y: -2,
                      }
                    : undefined
                }
                whileTap={
                  !loading
                    ? {
                        scale: 0.98,
                      }
                    : undefined
                }
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-6 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition hover:bg-[#153f47] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? "Création du compte..."
                  : "Créer mon compte"}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm font-medium leading-6 text-slate-500">
              Après l’inscription, vous serez redirigé vers le questionnaire
              pour commencer votre accompagnement.
            </p>

            <p className="mt-3 text-center text-sm font-semibold text-slate-500">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-black text-[#1B4F59] transition hover:text-teal-700 hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </motion.section>
      </section>
    </main>
  );
}

type InputFieldProps = {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
};

function InputField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required = false,
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
        />
      </div>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
};

function SelectField({
  label,
  icon,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-11 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          ▼
        </div>
      </div>
    </div>
  );
}

type LevelButtonProps = {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
};

function LevelButton({
  active,
  title,
  subtitle,
  onClick,
}: LevelButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale: 0.97,
      }}
      aria-pressed={active}
      className={[
        "rounded-3xl border p-4 text-left transition",
        active
          ? "border-[#1B4F59] bg-[#1B4F59] text-white shadow-xl shadow-teal-900/20"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "mb-3 inline-flex rounded-2xl p-3",
          active
            ? "bg-white/15 text-white"
            : "bg-white text-[#1B4F59]",
        ].join(" ")}
      >
        <Activity size={19} />
      </div>

      <p className="text-sm font-black">
        {title}
      </p>

      <p
        className={[
          "mt-1 text-xs font-semibold",
          active
            ? "text-white/70"
            : "text-slate-400",
        ].join(" ")}
      >
        {subtitle}
      </p>
    </motion.button>
  );
}

function InfoLine({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <ShieldCheck size={17} />
      </div>

      <span className="text-sm font-bold text-white/90">
        {text}
      </span>
    </div>
  );
}