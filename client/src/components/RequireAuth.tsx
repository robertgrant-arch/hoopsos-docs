import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";

const HAS_CLERK = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined);

// Hard timeout: if Clerk hasn't initialized within this window, we stop
// blocking the UI. Clerk's SDK can hang when there's a stale/corrupted
// session in localStorage — in that case we wipe the local state and
// route to /sign-in so the user can recover instead of staring at a
// permanent blank "Loading…" screen.
const CLERK_LOAD_TIMEOUT_MS = 4000;

function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function clearClerkLocalState() {
  try {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("__clerk") || k.startsWith("clerk"))) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

function ClerkGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [timedOut, setTimedOut] = React.useState(false);

  // Watchdog: if Clerk never finishes initializing, recover instead of hanging.
  React.useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isLoaded]);

  // Successful Clerk load but signed-out -> route to sign-in.
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const redirect =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(redirect)}`);
    }
  }, [isLoaded, isSignedIn, setLocation]);

  // Watchdog fired -> Clerk is hung. Wipe local Clerk state and force sign-in.
  React.useEffect(() => {
    if (!timedOut || isLoaded) return;
    clearClerkLocalState();
    const redirect =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/";
    // Use a full reload so a fresh ClerkProvider boots up.
    if (typeof window !== "undefined") {
      window.location.replace(
        `/sign-in?redirect_url=${encodeURIComponent(redirect)}`,
      );
    }
  }, [timedOut, isLoaded]);

  if (!isLoaded && !timedOut) {
    return <LoadingScreen />;
  }

  if (isLoaded && !isSignedIn) {
    return <LoadingScreen label="Redirecting to sign in…" />;
  }

  if (!isLoaded && timedOut) {
    return <LoadingScreen label="Recovering session…" />;
  }

  return <>{children}</>;
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  // No Clerk configured => allow through (demo/preview mode).
  if (!HAS_CLERK) return <>{children}</>;
  return <ClerkGate>{children}</ClerkGate>;
}
