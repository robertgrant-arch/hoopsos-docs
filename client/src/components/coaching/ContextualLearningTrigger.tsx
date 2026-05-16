import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Props = {
  moduleId: string;
  headline: string;
  body: string;
  ctaLabel: string;
  onDismiss?: () => void;
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

function storageKey(moduleId: string): string {
  return `dismissed_trigger_${moduleId}`;
}

function isDismissedInStorage(moduleId: string): boolean {
  try {
    return localStorage.getItem(storageKey(moduleId)) === "true";
  } catch {
    return false;
  }
}

function setDismissedInStorage(moduleId: string): void {
  try {
    localStorage.setItem(storageKey(moduleId), "true");
  } catch {
    // localStorage unavailable — ignore
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContextualLearningTrigger({
  moduleId,
  headline,
  body,
  ctaLabel,
  onDismiss,
}: Props) {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  // Read localStorage on mount
  useEffect(() => {
    if (isDismissedInStorage(moduleId)) {
      setDismissed(true);
    } else {
      // Small delay for mount animation
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [moduleId]);

  if (dismissed) return null;

  function handleDismiss() {
    setAnimatingOut(true);
    setTimeout(() => {
      setDismissedInStorage(moduleId);
      setDismissed(true);
      onDismiss?.();
    }, 220);
  }

  function handleCta() {
    navigate(`/app/coach/education/module/${moduleId}`);
  }

  return (
    <div
      role="complementary"
      aria-label="Learning tip"
      className="flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-200"
      style={{
        background: "oklch(0.72 0.18 290 / 0.07)",
        borderLeft: "3px solid oklch(0.72 0.18 290 / 0.45)",
        border: "1px solid oklch(0.72 0.18 290 / 0.18)",
        borderLeftWidth: "3px",
        opacity: animatingOut ? 0 : visible ? 1 : 0,
        transform: animatingOut ? "translateY(-4px)" : visible ? "translateY(0)" : "translateY(4px)",
      }}
    >
      {/* Icon */}
      <span
        className="mt-0.5 shrink-0"
        style={{ color: "oklch(0.72 0.18 290)" }}
        aria-hidden
      >
        <Sparkles className="w-4 h-4" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold leading-snug"
          style={{ color: "oklch(0.72 0.18 290)" }}
        >
          {headline}
        </p>
        <p
          className="text-[12px] mt-1 leading-relaxed line-clamp-2"
          style={{ color: "oklch(0.72 0.18 290 / 0.75)" }}
        >
          {body}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={handleCta}
        className="shrink-0 text-[12px] font-semibold px-3 py-2 rounded-lg transition-all min-h-[44px] whitespace-nowrap"
        style={{
          background: "oklch(0.72 0.18 290 / 0.14)",
          color: "oklch(0.72 0.18 290)",
          border: "1px solid oklch(0.72 0.18 290 / 0.22)",
        }}
        aria-label={ctaLabel}
      >
        {ctaLabel}
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 flex items-center justify-center w-[44px] h-[44px] rounded-lg transition-opacity opacity-50 hover:opacity-100 -mr-2 -mt-1"
        style={{ color: "oklch(0.72 0.18 290)" }}
        aria-label="Dismiss this tip"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
