import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";

const HAS_CLERK = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined);

// Hard timeout: if Clerk hasn't initialized within this window, we stop
// blocking the UI so the user is never stuck on a permanent loading screen.
const CLERK_LOAD_TIMEOUT_MS = 4000;

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
  const [timedOut, setTimedOut] = React.useState(false);

  // If Clerk never finishes initializing, fall through to the children after
  // a short timeout. The page can render its own (signed-out) state instead
  // of being permanently stuck on a blank "Loading…" screen.
  React.useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
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

  if (!isLoaded && !timedOut) {
    return <LoadingScreen />;
  }

  // Clerk loaded successfully but user is not signed in -> redirect handled above.
  if (isLoaded && !isSignedIn) {
    return <LoadingScreen label="Redirecting to sign in…" />;
  }

  // Either Clerk is signed in OR Clerk failed to load in time. In both cases
  // we render the children so the app is usable.
  return <>{children}</>;
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  // No Clerk configured => allow through (demo/preview mode).
  if (!HAS_CLERK) return <>{children}</>;
  return <ClerkGate>{children}</ClerkGate>;
}
