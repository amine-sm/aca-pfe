"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getProfile,
  getRole,
  getToken,
  logout,
  Role,
} from "@/lib/auth";

type AuthContextValue = {
  token: string | null;
  role: Role | null;
  profile: any;
  loading: boolean;
  isLoggedIn: boolean;
  logout: () => void;
  refreshAuth: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  token: null,
  role: null,
  profile: null,
  loading: true,
  isLoggedIn: false,
  logout,
  refreshAuth: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function refreshAuth() {
    setToken(getToken());
    setRole(getRole());
    setProfile(getProfile());
  }

  useEffect(() => {
    refreshAuth();
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        profile,
        loading,
        isLoggedIn: !!token,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}