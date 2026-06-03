import {
  apiFetch,
  clearAuthStorage,
  getStoredProfile,
  getStoredRole,
  getStoredToken,
  saveAuth,
} from "./api";

export type Role = "USER" | "PSYCHOLOGIST" | "ADMIN" | "SUPER_ADMIN";

export type LoginPayload = {
  email: string;
  password: string;
};

export function getToken() {
  return getStoredToken();
}

export function getRole(): Role | null {
  return getStoredRole() as Role | null;
}

export function getProfile<T = any>() {
  return getStoredProfile<T>();
}

export function isAuthenticated() {
  return !!getStoredToken();
}

export function logout() {
  clearAuthStorage();
  window.location.href = "/login";
}

export async function loginUser(payload: LoginPayload) {
  const data = await apiFetch<any>("/users/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });

  saveAuth({
    token: data.token,
    role: "USER",
    profile: data.user,
  });

  return data;
}

export async function loginPsychologist(payload: LoginPayload) {
  const data = await apiFetch<any>("/psychologists/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });

  saveAuth({
    token: data.token,
    role: "PSYCHOLOGIST",
    profile: data.psychologist,
  });

  return data;
}

export async function loginAdmin(payload: LoginPayload) {
  const data = await apiFetch<any>("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });

  saveAuth({
    token: data.token,
    role: data.admin?.role || "ADMIN",
    profile: data.admin,
  });

  return data;
}