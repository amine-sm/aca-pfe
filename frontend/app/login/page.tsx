"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  loginAdmin,
  loginPsychologist,
  loginUser,
} from "@/lib/auth";
import type { Role } from "@/lib/auth";

import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();

  const [role, setRole] = useState<Role>("USER");
  const [email, setEmail] = useState("ahmed@test.com");
  const [password, setPassword] = useState("123456");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function selectRole(selectedRole: Role) {
    setRole(selectedRole);
    setError("");

    if (selectedRole === "USER") {
      setEmail("ahmed@test.com");
      setPassword("123456");
      return;
    }

    if (selectedRole === "PSYCHOLOGIST") {
      setEmail("sara@test.com");
      setPassword("123456");
      return;
    }

    if (
      selectedRole === "ADMIN" ||
      selectedRole === "SUPER_ADMIN"
    ) {
      setEmail("admin@aca.com");
      setPassword("admin123456");
    }
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (role === "USER") {
        await loginUser({
          email,
          password,
        });

        refreshAuth();
        router.push("/dashboard");
        return;
      }

      if (role === "PSYCHOLOGIST") {
        await loginPsychologist({
          email,
          password,
        });

        refreshAuth();
        router.push("/psychologist");
        return;
      }

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        await loginAdmin({
          email,
          password,
        });

        refreshAuth();
        router.push("/admin");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la connexion.";

      setError(message);
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

      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
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

          <div className="relative z-10 flex min-h-[620px] flex-col justify-between">
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

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <ShieldCheck size={17} />
                Espace sécurisé
              </div>

              <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight">
                Un accès adapté à chaque parcours
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-teal-50/85">
                Connectez-vous à votre espace pour continuer votre
                accompagnement, suivre vos rendez-vous et avancer
                avec un soutien professionnel.
              </p>
            </div>

            <div className="space-y-4">
              <InfoLine text="Connexion confidentielle" />

              <InfoLine text="Espace personnel protégé" />

              <InfoLine text="Suivi humain et progressif" />
            </div>
          </div>
        </motion.aside>

        {/* CARTE DE CONNEXION */}
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
          className="mx-auto w-full max-w-xl"
        >
          <div className="rounded-[34px] border border-slate-100 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
            {/* LOGO MOBILE ET TABLETTE */}
            <Link
              href="/"
              className="mb-7 flex items-center gap-3 lg:hidden"
              aria-label="Retour à l’accueil"
            >
              <motion.div
                whileHover={{
                  scale: 1.05,
                  rotate: 2,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-white p-1.5 shadow-lg shadow-teal-900/10"
              >
                <Image
                  src="/logo.png"
                  alt="Logo EL MOUSANID AI"
                  width={64}
                  height={64}
                  priority
                  className="h-full w-full object-contain"
                />
              </motion.div>

              <div className="leading-tight">
                <p className="text-xl font-black tracking-tight text-[#1B4F59]">
                  EL MOUSANID AI
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Accompagnement &amp; soutien
                </p>
              </div>
            </Link>

            {/* EN-TÊTE */}
            <div className="mb-8 flex items-start justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                  <LockKeyhole size={16} />
                  Connexion
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  Bienvenue sur EL MOUSANID AI
                </h2>

                <p className="mt-3 leading-7 text-slate-500">
                  Choisissez votre profil puis entrez vos
                  identifiants pour accéder à votre espace.
                </p>
              </div>

              <div className="hidden rounded-3xl bg-[#1B4F59] p-4 text-white shadow-lg shadow-teal-900/20 sm:block">
                <ShieldCheck size={30} />
              </div>
            </div>

            {/* CHOIX DU RÔLE */}
            <div className="grid gap-3 sm:grid-cols-3">
              <RoleButton
                active={role === "USER"}
                icon={<UserRound size={19} />}
                title="Patient"
                subtitle="Mon espace"
                onClick={() => selectRole("USER")}
              />

              <RoleButton
                active={role === "PSYCHOLOGIST"}
                icon={<Stethoscope size={19} />}
                title="Psychologue"
                subtitle="Suivi patient"
                onClick={() =>
                  selectRole("PSYCHOLOGIST")
                }
              />

              <RoleButton
                active={
                  role === "ADMIN" ||
                  role === "SUPER_ADMIN"
                }
                icon={<ShieldCheck size={19} />}
                title="Admin"
                subtitle="Gestion"
                onClick={() => selectRole("ADMIN")}
              />
            </div>

            {/* ERREUR */}
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
                className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </motion.div>
            )}

            {/* FORMULAIRE */}
            <form
              onSubmit={handleLogin}
              className="mt-6 space-y-5"
            >
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Adresse email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                    autoComplete="email"
                    placeholder="exemple@email.com"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </div>

              {/* MOT DE PASSE */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Mot de passe
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4F59] focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previousValue) =>
                          !previousValue,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#1B4F59]"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* BOUTON CONNEXION */}
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
                  ? "Connexion en cours..."
                  : "Se connecter"}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm font-medium leading-6 text-slate-500">
              En vous connectant, vous accédez à un espace
              confidentiel dédié à votre accompagnement.
            </p>

            <p className="mt-3 text-center text-sm font-semibold text-slate-500">
              Vous n’avez pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-black text-[#1B4F59] transition hover:text-teal-700 hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </motion.section>
      </section>
    </main>
  );
}

type RoleButtonProps = {
  active: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
};

function RoleButton({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: RoleButtonProps) {
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
        {icon}
      </div>

      <p
        className={
          active
            ? "text-sm font-black text-white"
            : "text-sm font-black"
        }
      >
        {title}
      </p>

      <p
        className={[
          "mt-1 text-xs font-semibold",
          active
            ? "text-white/75"
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
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/10 px-4 py-3 backdrop-blur">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
        <ShieldCheck size={17} />
      </div>

      <span className="text-sm font-bold text-white/90">
        {text}
      </span>
    </div>
  );
}