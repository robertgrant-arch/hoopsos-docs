import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";

const HAS_CLERK = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined);

function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ClerkGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [slowLoad, setSlowLoad] = React.useState(false);

  // If Clerk takes longer than 8s, give the user an escape hatch instead of a blank screen.
  React.useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setSlowLoad(true), 8000);
    return () => clearTimeout(t);
  }, [isLoaded]);

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const redirect =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(redirect)}`);
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded) {
    if (slowLoad) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <div>Still loading auth…</div>
          <button
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
            onClick={() => {
              try {
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("__clerk"))
                  .forEach((k) => localStorage.removeItem(k));
              } catch {}
              window.location.href = "/sign-in";
            }}
          >
            Reset session and sign in
          </button>
        </div>
      );
    }
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <LoadingScreen label="Redirecting to sign in…" />;
  }

  return <>{children}</>;
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  // No Clerk configured => allow through (demo/preview mode).
  if (!HAS_CLERK) return <>{children}</>;
  return <ClerkGate>{children}</ClerkGate>;
}
