"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  UserCheck,
  Lock,
  HandHeart,
  BadgeCheck,
} from "lucide-react";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardMotion = {
  hidden: {
    opacity: 0,
    y: 26,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const features = [
  {
    title: "Évaluation personnalisée",
    text: "Un questionnaire simple permet de mieux comprendre la situation, les besoins et le niveau d’accompagnement nécessaire.",
    icon: Brain,
  },
  {
    title: "Accompagnement professionnel",
    text: "Des psychologues peuvent suivre les patients, proposer une orientation adaptée et accompagner chaque étape du parcours.",
    icon: Stethoscope,
  },
  {
    title: "Rendez-vous simplifiés",
    text: "Le patient peut réserver une séance, suivre ses rendez-vous et avancer progressivement dans son programme de soutien.",
    icon: CalendarCheck,
  },
];

const steps = [
  {
    title: "Répondre au questionnaire",
    text: "Le patient commence par quelques questions pour mieux identifier sa situation.",
    icon: ClipboardList,
  },
  {
    title: "Recevoir une orientation",
    text: "La plateforme propose un accompagnement adapté selon les réponses et le besoin détecté.",
    icon: HandHeart,
  },
  {
    title: "Être suivi par un spécialiste",
    text: "Un psychologue accompagne le patient avec un suivi humain, confidentiel et progressif.",
    icon: UserCheck,
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7FAFB] text-slate-900">
      {/* Background professionnel */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute right-[-180px] top-40 h-[460px] w-[460px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        {/* HERO */}
        <section className="grid min-h-[640px] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm backdrop-blur"
            >
              <Sparkles size={16} />
              Plateforme d’accompagnement et de soutien
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-7 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl"
            >
              Un parcours de soutien{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#1B4F59] via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  confidentiel
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
                  className="absolute -bottom-2 left-0 h-3 w-full origin-left rounded-full bg-teal-200/70"
                />
              </span>{" "}
              et humain
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl"
            >
              ACA accompagne les personnes concernées par l’addiction à travers
              un questionnaire guidé, une orientation personnalisée, des
              recommandations adaptées et un suivi avec des psychologues.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4F59] px-7 py-4 text-sm font-bold text-white shadow-xl shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-[#153f47]"
              >
                <MessageCircle size={18} />
                Commencer le parcours
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-800 shadow-lg shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/40"
              >
                <ShieldCheck size={18} />
                Connexion sécurisée
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-black text-[#1B4F59]">Privé</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Données protégées
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-black text-[#1B4F59]">Guidé</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Parcours clair
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-black text-[#1B4F59]">Humain</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Suivi spécialisé
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT DASHBOARD PATIENT */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative overflow-hidden rounded-[34px] border border-white/50 bg-slate-950 p-5 shadow-2xl shadow-slate-900/25"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1B4F59]/80 via-slate-950 to-cyan-950" />
              <div className="absolute right-[-90px] top-[-90px] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute bottom-[-100px] left-[-100px] h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />

              <div className="relative z-10 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-teal-100">
                      Espace patient
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                      Suivi du parcours
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-emerald-400/20 p-3 text-emerald-200">
                    <Activity size={26} />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/10 p-3 text-cyan-100">
                        <HeartPulse size={24} />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-white/55">
                          Bien-être actuel
                        </p>
                        <p className="text-2xl font-black text-white">Bon</p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "78%" }}
                        transition={{ delay: 0.7, duration: 1 }}
                        className="h-full rounded-full bg-cyan-300"
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/10 p-3 text-emerald-100">
                        <CheckCircle2 size={24} />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-white/55">
                          Niveau d’urgence
                        </p>
                        <p className="text-2xl font-black text-white">Faible</p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "36%" }}
                        transition={{ delay: 0.85, duration: 1 }}
                        className="h-full rounded-full bg-emerald-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-white/55">
                        Prochaine étape
                      </p>
                      <p className="mt-1 text-lg font-bold text-white">
                        Prendre rendez-vous avec un psychologue
                      </p>
                    </div>

                    <CalendarCheck className="text-teal-100" size={26} />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 p-3 text-center">
                      <p className="text-sm font-black text-white">
                        Question.
                      </p>
                      <p className="mt-1 text-xs text-white/50">Terminé</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3 text-center">
                      <p className="text-sm font-black text-white">Suivi</p>
                      <p className="mt-1 text-xs text-white/50">En cours</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3 text-center">
                      <p className="text-sm font-black text-white">Séance</p>
                      <p className="mt-1 text-xs text-white/50">À planifier</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    "Questionnaire confidentiel",
                    "Orientation adaptée au patient",
                    "Suivi avec un psychologue",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.15 }}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
                    >
                      <CheckCircle2 size={18} className="text-emerald-300" />
                      <span className="text-sm font-semibold text-white/85">
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-8 -left-5 hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-300/70 lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-teal-50 p-3 text-[#1B4F59]">
                  <Lock size={22} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-900">
                    Confidentialité
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Espace sécurisé
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURES */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                variants={cardMotion}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.25 },
                }}
                className="group rounded-[30px] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/60 transition"
              >
                <div className="mb-6 inline-flex rounded-2xl bg-teal-50 p-4 text-[#1B4F59] transition group-hover:scale-110 group-hover:bg-[#1B4F59] group-hover:text-white">
                  <Icon size={32} />
                </div>

                <h3 className="text-xl font-black text-slate-950">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-500">
                  {feature.text}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1B4F59]">
                  Découvrir
                  <ArrowRight
                    size={16}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.section>

        {/* PROCESS */}
        <section className="mt-20 rounded-[34px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/60 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-[#1B4F59]">
                Parcours patient
              </span>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Un accompagnement simple, progressif et rassurant
              </h2>
            </div>

            <p className="max-w-xl leading-7 text-slate-500">
              ACA aide le patient à avancer étape par étape, sans jugement, avec
              un suivi clair et un accompagnement humain.
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-10 grid gap-5 md:grid-cols-3"
          >
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.title}
                  variants={cardMotion}
                  className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-6"
                >
                  <div className="absolute right-5 top-5 text-5xl font-black text-slate-200">
                    0{index + 1}
                  </div>

                  <div className="relative z-10">
                    <div className="mb-6 inline-flex rounded-2xl bg-white p-4 text-[#1B4F59] shadow-sm">
                      <Icon size={30} />
                    </div>

                    <h3 className="text-xl font-black text-slate-950">
                      {step.title}
                    </h3>

                    <p className="mt-3 leading-7 text-slate-500">
                      {step.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* CONFIDENTIALITY SECTION */}
        <section className="mt-20 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/60">
            <div className="mb-5 inline-flex rounded-2xl bg-teal-50 p-4 text-[#1B4F59]">
              <Lock size={30} />
            </div>
            <h3 className="text-xl font-black text-slate-950">
              Confidentialité
            </h3>
            <p className="mt-3 leading-7 text-slate-500">
              Le patient bénéficie d’un espace discret et sécurisé pour avancer
              dans son parcours.
            </p>
          </div>

          <div className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/60">
            <div className="mb-5 inline-flex rounded-2xl bg-teal-50 p-4 text-[#1B4F59]">
              <HandHeart size={30} />
            </div>
            <h3 className="text-xl font-black text-slate-950">
              Sans jugement
            </h3>
            <p className="mt-3 leading-7 text-slate-500">
              L’objectif est d’aider, d’écouter et d’orienter la personne vers
              un soutien adapté.
            </p>
          </div>

          <div className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/60">
            <div className="mb-5 inline-flex rounded-2xl bg-teal-50 p-4 text-[#1B4F59]">
              <BadgeCheck size={30} />
            </div>
            <h3 className="text-xl font-black text-slate-950">
              Suivi structuré
            </h3>
            <p className="mt-3 leading-7 text-slate-500">
              Chaque étape du parcours est organisée pour faciliter la prise en
              charge et le suivi.
            </p>
          </div>
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 overflow-hidden rounded-[34px] bg-[#1B4F59] p-8 text-center shadow-2xl shadow-teal-900/20 md:p-12"
        >
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto mb-6 inline-flex rounded-3xl bg-white/10 p-4 text-white">
              <HeartPulse size={36} />
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Commencez votre accompagnement dès aujourd’hui
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-teal-50/80">
              Créez un compte, répondez au questionnaire et avancez avec un
              suivi adapté à votre situation.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-[#1B4F59] shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-50"
              >
                <MessageCircle size={18} />
                Commencer maintenant
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}