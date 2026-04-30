import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";

const HAS_CLERK = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined);

function ClerkGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    const redirect =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    setTimeout(
      () => setLocation(`/sign-in?redirect_url=${encodeURIComponent(redirect)}`),
      0,
    );
    return null;
  }

  return <>{children}</>;
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  // No Clerk configured => allow through (demo/preview mode).
  if (!HAS_CLERK) return <>{children}</>;
  return <ClerkGate>{children}</ClerkGate>;
}
