import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";

const HAS_CLERK = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined);

// Watchdog: if Clerk hasn't initialized within this window, force a recovery
// reload to /sign-in so the user is never permanently stuck on a blank screen.
const CLERK_LOAD_TIMEOUT_MS = 3000;

function clearClerkLocalState() {
  try {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("__clerk") || k.startsWith("clerk"))) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    if (window.sessionStorage) window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

function ClerkGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  // Watchdog: if Clerk never finishes initializing, recover to /sign-in.
  React.useEffect(() => {
    if (isLoaded) return;
    const t = window.setTimeout(() => {
      clearClerkLocalState();
      const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      window.location.replace(`/sign-in?redirect_url=${encodeURIComponent(here)}&recovered=1`);
    }, CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [isLoaded]);

  // Once Clerk has loaded but user is signed-out -> route to /sign-in.
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(here)}`);
    }
  }, [isLoaded, isSignedIn, setLocation]);

  // Render children optimistically. The watchdog/redirect effects above
  // guarantee we never get stuck on a permanent loading screen.
  return <>{children}</>;
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!HAS_CLERK) return <>{children}</>;
  return <ClerkGate>{children}</ClerkGate>;
}
