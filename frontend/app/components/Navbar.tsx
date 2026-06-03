"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserRound,
  ClipboardList,
  CalendarCheck,
  HandHeart,
  UsersRound,
  Bell,
  CreditCard,
  Banknote,
  Home,
  ListChecks,
  Target,
} from "lucide-react";
import { useAuth } from "./AuthProvider";

export function Navbar() {
  const { isLoggedIn, role, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const navLinkVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.04,
        duration: 0.25,
      },
    }),
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
    },
    open: {
      opacity: 1,
      x: 0,
    },
  };

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 dark:shadow-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.06, rotate: 4 }}
                whileTap={{ scale: 0.96 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B4F59] text-white shadow-lg shadow-teal-900/20 dark:bg-teal-500 dark:shadow-teal-500/20"
              >
                <HeartPulse size={25} />
              </motion.div>

              <div className="leading-tight">
                <p className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-100">
                  ACA
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Accompagnement &amp; soutien
                </p>
              </div>
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              <motion.div
                initial="hidden"
                animate="visible"
                className="flex items-center gap-1 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-1 dark:border-slate-700/60 dark:bg-slate-800/60"
              >
                <NavLink
                  href="/"
                  icon={<Home size={16} />}
                  variants={navLinkVariants}
                  custom={0}
                >
                  Accueil
                </NavLink>

                {!isLoggedIn && (
                  <>
                    <NavLink
                      href="/register"
                      icon={<UserRound size={16} />}
                      variants={navLinkVariants}
                      custom={1}
                    >
                      Créer un compte
                    </NavLink>

                    <NavLink
                      href="/login"
                      icon={<ShieldCheck size={16} />}
                      variants={navLinkVariants}
                      custom={2}
                    >
                      Connexion
                    </NavLink>
                  </>
                )}

                {isLoggedIn && role === "USER" && (
                  <>
                    <NavLink
                      href="/dashboard"
                      icon={<UserRound size={16} />}
                      variants={navLinkVariants}
                      custom={1}
                    >
                      Mon espace
                    </NavLink>

                    <NavLink
                      href="/questionnaire"
                      icon={<ClipboardList size={16} />}
                      variants={navLinkVariants}
                      custom={2}
                    >
                      Analyse Rapide
                    </NavLink>

                    <NavLink
                      href="/chat"
                      icon={<HandHeart size={16} />}
                      variants={navLinkVariants}
                      custom={3}
                    >
                      Soutien
                    </NavLink>

                    <NavLink
                      href="/tasks"
                      icon={<Target size={16} />}
                      variants={navLinkVariants}
                      custom={4}
                    >
                      Mes tâches
                    </NavLink>

                    <NavLink
                      href="/recommendations"
                      icon={<ShieldCheck size={16} />}
                      variants={navLinkVariants}
                      custom={5}
                    >
                      Orientation
                    </NavLink>

                    <NavLink
                      href="/appointments"
                      icon={<CalendarCheck size={16} />}
                      variants={navLinkVariants}
                      custom={6}
                    >
                      Rendez-vous
                    </NavLink>
                  </>
                )}

                {isLoggedIn && role === "PSYCHOLOGIST" && (
                  <>
                    <NavLink
                      href="/psychologist"
                      icon={<UserRound size={16} />}
                      variants={navLinkVariants}
                      custom={1}
                    >
                      Espace psychologue
                    </NavLink>

                    <NavLink
                      href="/psychologist/patients"
                      icon={<UsersRound size={16} />}
                      variants={navLinkVariants}
                      custom={2}
                    >
                      Patients suivis
                    </NavLink>

                    <NavLink
                      href="/psychologist/tasks"
                      icon={<ListChecks size={16} />}
                      variants={navLinkVariants}
                      custom={3}
                    >
                      Tâches
                    </NavLink>
                  </>
                )}

                {isLoggedIn && (role === "ADMIN" || role === "SUPER_ADMIN") && (
                  <>
                    <NavLink
                      href="/admin"
                      icon={<ShieldCheck size={16} />}
                      variants={navLinkVariants}
                      custom={1}
                    >
                      Administration
                    </NavLink>

                    <NavLink
                      href="/admin/psychologists"
                      icon={<UsersRound size={16} />}
                      variants={navLinkVariants}
                      custom={2}
                    >
                      Psychologues
                    </NavLink>

                    <NavLink
                      href="/admin/payments"
                      icon={<CreditCard size={16} />}
                      variants={navLinkVariants}
                      custom={3}
                    >
                      Paiements
                    </NavLink>

                    <NavLink
                      href="/admin/payment-methods"
                      icon={<Banknote size={16} />}
                      variants={navLinkVariants}
                      custom={4}
                    >
                      Méthodes paiement
                    </NavLink>

                    <NavLink
                      href="/admin/alerts"
                      icon={<Bell size={16} />}
                      variants={navLinkVariants}
                      custom={5}
                    >
                      Alertes
                    </NavLink>
                  </>
                )}
              </motion.div>

              {isLoggedIn && (
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={logout}
                  className="ml-2 inline-flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                >
                  <LogOut size={16} />
                  Déconnexion
                </motion.button>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Ouvrir le menu"
              >
                {isMobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileMenuVariants}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 30,
              }}
              className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 lg:hidden"
            >
              <div className="flex h-full flex-col">
                <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1B4F59] text-white dark:bg-teal-500">
                      <HeartPulse size={23} />
                    </div>

                    <div>
                      <p className="text-lg font-black text-slate-950 dark:text-slate-100">
                        ACA
                      </p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Accompagnement
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={closeMobileMenu}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    aria-label="Fermer le menu"
                  >
                    <X size={21} />
                  </button>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto px-5 py-6">
                  <MobileNavLink
                    href="/"
                    icon={<Home size={18} />}
                    onClick={closeMobileMenu}
                  >
                    Accueil
                  </MobileNavLink>

                  {!isLoggedIn && (
                    <>
                      <MobileNavLink
                        href="/register"
                        icon={<UserRound size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Créer un compte
                      </MobileNavLink>

                      <MobileNavLink
                        href="/login"
                        icon={<ShieldCheck size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Connexion
                      </MobileNavLink>
                    </>
                  )}

                  {isLoggedIn && role === "USER" && (
                    <>
                      <MobileSectionTitle>Mon parcours</MobileSectionTitle>

                      <MobileNavLink
                        href="/dashboard"
                        icon={<UserRound size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Mon espace
                      </MobileNavLink>

                      <MobileNavLink
                        href="/questionnaire"
                        icon={<ClipboardList size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Questionnaire
                      </MobileNavLink>

                      <MobileNavLink
                        href="/chat"
                        icon={<HandHeart size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Soutien
                      </MobileNavLink>

                      <MobileNavLink
                        href="/tasks"
                        icon={<Target size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Mes tâches
                      </MobileNavLink>

                      <MobileNavLink
                        href="/recommendations"
                        icon={<ShieldCheck size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Orientation
                      </MobileNavLink>

                      <MobileNavLink
                        href="/appointments"
                        icon={<CalendarCheck size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Rendez-vous
                      </MobileNavLink>
                    </>
                  )}

                  {isLoggedIn && role === "PSYCHOLOGIST" && (
                    <>
                      <MobileSectionTitle>Suivi professionnel</MobileSectionTitle>

                      <MobileNavLink
                        href="/psychologist"
                        icon={<UserRound size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Espace psychologue
                      </MobileNavLink>

                      <MobileNavLink
                        href="/psychologist/patients"
                        icon={<UsersRound size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Patients suivis
                      </MobileNavLink>

                      <MobileNavLink
                        href="/psychologist/tasks"
                        icon={<ListChecks size={18} />}
                        onClick={closeMobileMenu}
                      >
                        Gérer les tâches
                      </MobileNavLink>
                    </>
                  )}

                  {isLoggedIn &&
                    (role === "ADMIN" || role === "SUPER_ADMIN") && (
                      <>
                        <MobileSectionTitle>Gestion</MobileSectionTitle>

                        <MobileNavLink
                          href="/admin"
                          icon={<ShieldCheck size={18} />}
                          onClick={closeMobileMenu}
                        >
                          Administration
                        </MobileNavLink>

                        <MobileNavLink
                          href="/admin/psychologists"
                          icon={<UsersRound size={18} />}
                          onClick={closeMobileMenu}
                        >
                          Psychologues
                        </MobileNavLink>

                        <MobileNavLink
                          href="/admin/payments"
                          icon={<CreditCard size={18} />}
                          onClick={closeMobileMenu}
                        >
                          Paiements
                        </MobileNavLink>

                        <MobileNavLink
                          href="/admin/payment-methods"
                          icon={<Banknote size={18} />}
                          onClick={closeMobileMenu}
                        >
                          Méthodes paiement
                        </MobileNavLink>

                        <MobileNavLink
                          href="/admin/alerts"
                          icon={<Bell size={18} />}
                          onClick={closeMobileMenu}
                        >
                          Alertes
                        </MobileNavLink>
                      </>
                    )}
                </div>

                {isLoggedIn && (
                  <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                    <button
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                    >
                      <LogOut size={17} />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="h-20" />
    </>
  );
}

function NavLink({
  href,
  children,
  variants,
  custom,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  variants: any;
  custom: number;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div custom={custom} variants={variants}>
      <Link
        href={href}
        className="group relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-[#1B4F59] hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-teal-300"
      >
        <span className="text-slate-400 transition group-hover:text-[#1B4F59] dark:text-slate-500 dark:group-hover:text-teal-300">
          {icon}
        </span>
        {children}
      </Link>
    </motion.div>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
  icon,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-teal-50 hover:text-[#1B4F59] dark:text-slate-200 dark:hover:bg-teal-500/10 dark:hover:text-teal-300"
    >
      <span className="text-[#1B4F59] dark:text-teal-400">{icon}</span>
      {children}
    </Link>
  );
}

function MobileSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}