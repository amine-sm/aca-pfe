export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  error?: string;
} & T;

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aca_token");
}

export function getStoredRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aca_role");
}

export function getStoredProfile<T = any>(): T | null {
  if (typeof window === "undefined") return null;

  try {
    const value = localStorage.getItem("aca_profile");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function saveAuth({
  token,
  role,
  profile,
}: {
  token: string;
  role: "USER" | "PSYCHOLOGIST" | "ADMIN" | "SUPER_ADMIN";
  profile: any;
}) {
  localStorage.setItem("aca_token", token);
  localStorage.setItem("aca_role", role);
  localStorage.setItem("aca_profile", JSON.stringify(profile));
}

export function clearAuthStorage() {
  localStorage.removeItem("aca_token");
  localStorage.removeItem("aca_role");
  localStorage.removeItem("aca_profile");
}

type ApiFetchOptions = RequestInit & {
  token?: string | null;
  auth?: boolean;
};

export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const token = options.token ?? getStoredToken();

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...((options.headers || {}) as Record<string, string>),
  };

  // IMPORTANT:
  // Si body = FormData, ne jamais mettre Content-Type.
  // Le navigateur ajoute automatiquement:
  // multipart/form-data; boundary=----
  if (!isFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token && options.auth !== false) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Erreur API ${response.status}`
    );
  }

  return data;
}

export function getRiskBadgeClass(risk?: string | null) {
  const value = String(risk || "").toLowerCase();

  if (
    value.includes("critique") ||
    value.includes("eleve") ||
    value.includes("élevé")
  ) {
    return "badge danger";
  }

  if (value.includes("moyen") || value.includes("mod")) {
    return "badge warn";
  }

  if (value.includes("faible")) {
    return "badge";
  }

  return "badge neutral";
}