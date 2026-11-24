import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const PORTAL_TOKEN_KEY = "portal_auth_token";

interface PortalAuthContextType {
  authenticated: boolean;
  loading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextType>({
  authenticated: false,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const loginMutation = trpc.portal.login.useMutation();

  // On mount, check localStorage token
  useEffect(() => {
    const token = localStorage.getItem(PORTAL_TOKEN_KEY);
    if (token === "authenticated") {
      setAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (password: string) => {
    // Call backend to verify password
    await loginMutation.mutateAsync({ password });
    // If no error thrown, password is correct
    localStorage.setItem(PORTAL_TOKEN_KEY, "authenticated");
    setAuthenticated(true);
    // Redirect to students page
    window.location.href = "/students";
  };

  const logout = () => {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    setAuthenticated(false);
  };

  return (
    <PortalAuthContext.Provider value={{ authenticated, loading, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  return useContext(PortalAuthContext);
}
