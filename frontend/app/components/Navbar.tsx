"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Bell,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  CreditCard,
  HandHeart,
  Home,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Target,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { useAuth } from "./AuthProvider";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, role, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const homeItem: NavItem = {
    href: "/",
    label: "Accueil",
    icon: <Home size={17} />,
  };

  const { principalItems, secondaryItems, sectionTitle } = useMemo(() => {
    if (!isLoggedIn) {
      return {
        principalItems: [
          homeItem,
          {
            href: "/register",
            label: "Créer un compte",
            icon: <UserPlus size={17} />,
          },
          {
            href: "/login",
            label: "Connexion",
            icon: <LogIn size={17} />,
          },
        ] satisfies NavItem[],

        secondaryItems: [] satisfies NavItem[],

        sectionTitle: "Navigation",
      };
    }

    if (role === "USER") {
      return {
        principalItems: [
          homeItem,
          {
            href: "/dashboard",
            label: "Mon espace",
            icon: <UserRound size={17} />,
          },
          {
            href: "/questionnaire",
            label: "Analyse rapide",
            icon: <ClipboardList size={17} />,
          },
          {
            href: "/chat",
            label: "Soutien",
            icon: <HandHeart size={17} />,
          },
        ] satisfies NavItem[],

        secondaryItems: [
          {
            href: "/tasks",
            label: "Mes tâches",
            icon: <Target size={17} />,
          },
          {
            href: "/recommendations",
            label: "Orientation",
            icon: <ShieldCheck size={17} />,
          },
          {
            href: "/appointments",
            label: "Rendez-vous",
            icon: <CalendarCheck size={17} />,
          },
        ] satisfies NavItem[],

        sectionTitle: "Mon parcours",
      };
    }

    if (role === "PSYCHOLOGIST") {
      return {
        principalItems: [
          homeItem,
          {
            href: "/psychologist",
            label: "Espace psychologue",
            icon: <UserRound size={17} />,
          },
          {
            href: "/psychologist/patients",
            label: "Patients suivis",
            icon: <UsersRound size={17} />,
          },
          {
            href: "/psychologist/tasks",
            label: "Tâches",
            icon: <ListChecks size={17} />,
          },
        ] satisfies NavItem[],

        secondaryItems: [] satisfies NavItem[],

        sectionTitle: "Suivi professionnel",
      };
    }

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return {
        principalItems: [
          homeItem,
          {
            href: "/admin",
            label: "Administration",
            icon: <ShieldCheck size={17} />,
          },
          {
            href: "/admin/psychologists",
            label: "Psychologues",
            icon: <UsersRound size={17} />,
          },
          {
            href: "/admin/payments",
            label: "Paiements",
            icon: <CreditCard size={17} />,
          },
        ] satisfies NavItem[],

        secondaryItems: [
          {
            href: "/admin/payment-methods",
            label: "Méthodes de paiement",
            icon: <Banknote size={17} />,
          },
          {
            href: "/admin/alerts",
            label: "Alertes",
            icon: <Bell size={17} />,
          },
        ] satisfies NavItem[],

        sectionTitle: "Administration",
      };
    }

    return {
      principalItems: [homeItem],
      secondaryItems: [],
      sectionTitle: "Navigation",
    };
  }, [isLoggedIn, role]);

  const allItems = useMemo(
    () => [...principalItems, ...secondaryItems],
    [principalItems, secondaryItems],
  );

  const activeHref = useMemo(() => {
    const sortedItems = [...allItems].sort(
      (firstItem, secondItem) =>
        secondItem.href.length - firstItem.href.length,
    );

    const matchedItem = sortedItems.find((item) => {
      if (item.href === "/") {
        return pathname === "/";
      }

      return (
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`)
      );
    });

    return matchedItem?.href ?? "";
  }, [allItems, pathname]);

  const hasActiveSecondaryItem = secondaryItems.some(
    (item) => item.href === activeHref,
  );

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((currentValue) => !currentValue);
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
    logout();
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeMoreMenuOnOutsideClick = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      closeMoreMenuOnOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeMoreMenuOnOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-[0_4px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="relative mx-auto flex h-[76px] max-w-[1500px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          {/* LOGO ET NOM */}
          <Link
            href="/"
            aria-label="Accueil EL MOUSANID AI"
            className="group flex shrink-0 items-center gap-3"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
                rotate: 2,
              }}
              whileTap={{
                scale: 0.96,
              }}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_8px_24px_rgba(27,79,89,0.15)] dark:border-slate-700 dark:bg-slate-900"
            >
              <Image
                src="/logo.png"
                alt="Logo EL MOUSANID AI"
                width={48}
                height={48}
                priority
                className="h-full w-full object-contain"
              />
            </motion.div>

            <div className="hidden leading-tight sm:block">
              <p className="whitespace-nowrap text-[17px] font-black tracking-tight text-[#143F47] transition group-hover:text-[#1B4F59] dark:text-teal-300">
                EL MOUSANID AI
              </p>

              <p className="mt-0.5 whitespace-nowrap text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Accompagnement &amp; soutien
              </p>
            </div>
          </Link>

          {/* NAVIGATION ORDINATEUR */}
          <div className="ml-auto hidden min-w-0 items-center gap-3 xl:flex">
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5 shadow-inner shadow-slate-200/20 dark:border-slate-700 dark:bg-slate-900">
              {principalItems.map((item) => (
                <DesktopNavLink
                  key={item.href}
                  item={item}
                  active={activeHref === item.href}
                />
              ))}

              {secondaryItems.length > 0 && (
                <div
                  ref={moreMenuRef}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(
                        (currentValue) => !currentValue,
                      );
                    }}
                    style={
                      hasActiveSecondaryItem
                        ? { color: "#ffffff" }
                        : undefined
                    }
                    className={[
                      "inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition",
                      hasActiveSecondaryItem
                        ? "bg-[#1B4F59] !text-white shadow-md shadow-teal-950/20 hover:!text-white"
                        : "text-slate-600 hover:bg-white hover:text-[#1B4F59] hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300",
                    ].join(" ")}
                    aria-expanded={isMoreMenuOpen}
                    aria-haspopup="menu"
                  >
                    <Menu
                      size={17}
                      color={
                        hasActiveSecondaryItem
                          ? "#ffffff"
                          : undefined
                      }
                    />

                    <span
                      className={
                        hasActiveSecondaryItem
                          ? "!text-white"
                          : ""
                      }
                    >
                      Plus
                    </span>

                    <ChevronDown
                      size={15}
                      color={
                        hasActiveSecondaryItem
                          ? "#ffffff"
                          : undefined
                      }
                      className={[
                        "transition-transform duration-200",
                        isMoreMenuOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  <AnimatePresence>
                    {isMoreMenuOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 8,
                          scale: 0.98,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: 8,
                          scale: 0.98,
                        }}
                        transition={{
                          duration: 0.16,
                        }}
                        role="menu"
                        className="absolute right-0 top-[calc(100%+14px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900"
                      >
                        <p className="px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Autres fonctionnalités
                        </p>

                        <div className="space-y-1">
                          {secondaryItems.map((item) => (
                            <DropdownNavLink
                              key={item.href}
                              item={item}
                              active={activeHref === item.href}
                              onClick={() =>
                                setIsMoreMenuOpen(false)
                              }
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* BOUTON DÉCONNEXION */}
            {isLoggedIn && (
              <motion.button
                type="button"
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                onClick={handleLogout}
                className="inline-flex h-[46px] shrink-0 items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-600 shadow-sm transition hover:border-red-200 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                <LogOut size={17} />
                <span>Déconnexion</span>
              </motion.button>
            )}
          </div>

          {/* BOUTON MENU MOBILE */}
          <div className="ml-auto flex items-center xl:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#1B4F59] shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-slate-800"
              aria-label={
                isMobileMenuOpen
                  ? "Fermer le menu"
                  : "Ouvrir le menu"
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X size={23} />
              ) : (
                <Menu size={23} />
              )}
            </button>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-300/60 to-transparent dark:via-teal-700/60" />
        </div>
      </nav>

      {/* MENU MOBILE ET TABLETTE */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={closeMobileMenu}
              aria-label="Fermer le menu"
              className="fixed inset-0 z-[60] cursor-default bg-slate-950/45 backdrop-blur-sm xl:hidden"
            />

            <motion.aside
              initial={{
                opacity: 0,
                x: "100%",
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: "100%",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 32,
              }}
              className="fixed right-0 top-0 z-[70] flex h-dvh w-[88%] max-w-[390px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950 xl:hidden"
            >
              {/* ENTÊTE MOBILE */}
              <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="flex min-w-0 items-center gap-3"
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <Image
                      src="/logo.png"
                      alt="Logo EL MOUSANID AI"
                      width={48}
                      height={48}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-base font-black text-[#143F47] dark:text-teal-300">
                      EL MOUSANID AI
                    </p>

                    <p className="mt-1 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Accompagnement &amp; soutien
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  aria-label="Fermer le menu"
                >
                  <X size={21} />
                </button>
              </div>

              {/* LIENS MOBILE */}
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#E9F7F6] to-[#F4FBFB] px-4 py-3 dark:from-teal-950/50 dark:to-slate-900">
                  <p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#1B4F59] dark:text-teal-300">
                    {sectionTitle}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Accédez rapidement à vos fonctionnalités.
                  </p>
                </div>

                <div className="space-y-1.5">
                  {allItems.map((item) => (
                    <MobileNavLink
                      key={item.href}
                      item={item}
                      active={activeHref === item.href}
                      onClick={closeMobileMenu}
                    />
                  ))}
                </div>
              </div>

              {/* DÉCONNEXION MOBILE */}
              {isLoggedIn && (
                <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ESPACE POUR LA NAVBAR FIXE */}
      <div className="h-[76px]" />
    </>
  );
}

/* LIEN ORDINATEUR */
function DesktopNavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      style={active ? { color: "#ffffff" } : undefined}
      className={[
        "group inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-sm font-bold transition",
        active
          ? "bg-[#1B4F59] !text-white shadow-md shadow-teal-950/20 hover:!text-white"
          : "text-slate-600 hover:bg-white hover:text-[#1B4F59] hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300",
      ].join(" ")}
    >
      <span
        style={active ? { color: "#ffffff" } : undefined}
        className={
          active
            ? "!text-white"
            : "text-slate-400 transition group-hover:text-[#1B4F59] dark:text-slate-500 dark:group-hover:text-teal-300"
        }
      >
        {item.icon}
      </span>

      <span
        style={active ? { color: "#ffffff" } : undefined}
        className={active ? "!text-white" : ""}
      >
        {item.label}
      </span>
    </Link>
  );
}

/* LIEN DU MENU PLUS */
function DropdownNavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition",
        active
          ? "bg-[#1B4F59] !text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-[#1B4F59] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300",
      ].join(" ")}
    >
      <span
        style={active ? { color: "#ffffff" } : undefined}
        className={
          active
            ? "!text-white"
            : "text-slate-400"
        }
      >
        {item.icon}
      </span>

      <span
        style={active ? { color: "#ffffff" } : undefined}
        className={active ? "!text-white" : ""}
      >
        {item.label}
      </span>
    </Link>
  );
}

/* LIEN MOBILE */
function MobileNavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={active ? { color: "#ffffff" } : undefined}
      className={[
        "flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
        active
          ? "bg-[#1B4F59] !text-white shadow-lg shadow-teal-950/15"
          : "text-slate-700 hover:bg-teal-50 hover:text-[#1B4F59] dark:text-slate-200 dark:hover:bg-teal-500/10 dark:hover:text-teal-300",
      ].join(" ")}
    >
      <span
        style={active ? { color: "#ffffff" } : undefined}
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          active
            ? "bg-white/15 !text-white"
            : "bg-[#E9F7F6] text-[#1B4F59] dark:bg-teal-500/10 dark:text-teal-300",
        ].join(" ")}
      >
        {item.icon}
      </span>

      <span
        style={active ? { color: "#ffffff" } : undefined}
        className={active ? "!text-white" : ""}
      >
        {item.label}
      </span>
    </Link>
  );
}