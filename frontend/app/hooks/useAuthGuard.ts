"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/auth";
import { useAuth } from "../components/AuthProvider";

export function useAuthGuard(allowedRoles?: Role[]) {
  const router = useRouter();
  const { loading, isLoggedIn, role } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      if (role === "USER") router.replace("/dashboard");
      else if (role === "PSYCHOLOGIST") router.replace("/psychologist");
      else router.replace("/admin");
    }
  }, [loading, isLoggedIn, role, router, allowedRoles]);

  return { loading, isLoggedIn, role };
}