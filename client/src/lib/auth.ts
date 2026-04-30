import { useEffect, useState, useCallback } from "react";
import { demoUsers, type DemoUser } from "@/lib/mock/users";

const STORAGE_KEY = "hoopsos.demoUserId";

function readStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function writeStoredUserId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(STORAGE_KEY, id);
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("hoopsos-user-changed"));
}

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(() => readStoredUserId());

  useEffect(() => {
    const handler = () => setUserId(readStoredUserId());
    window.addEventListener("hoopsos-user-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("hoopsos-user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const user: DemoUser | null =
    demoUsers.find((u) => u.id === userId) || null;

  const signIn = useCallback((id: string) => {
    writeStoredUserId(id);
    setUserId(id);
  }, []);

  const signOut = useCallback(() => {
    writeStoredUserId(null);
    setUserId(null);
  }, []);

  return { user, signIn, signOut };
}
