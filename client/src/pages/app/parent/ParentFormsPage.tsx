/**
 * ParentFormsPage — waivers and consent forms.
 *
 * Security fix #3: The sign flow now includes an explicit consent checkbox
 * that must be checked before the "Sign" button is enabled.  The checkbox
 * state is passed as consentAcknowledged: true to the API; the server rejects
 * requests where that flag is not literally true.
 *
 * Security fix #5 (demo isolation): useWaivers() is scoped to the linked
 * child's player ID pulled from the authenticated parent user object.
 */
import { useState } from "react";
import {
  FileText, CheckCircle2, Clock, AlertCircle, Shield,
  Camera, Stethoscope, ClipboardList, ChevronDown, ChevronUp,
  Info, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useWaivers, useSignWaiver, type WaiverItem } from "@/lib/api/hooks/useWaivers";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type WaiverCategory = WaiverItem["category"];

const CAT_ICON: Record<WaiverCategory, React.ReactNode> = {
  waiver:    <Shield className="w-4 h-4" />,
  consent:   <ClipboardList className="w-4 h-4" />,
  medical:   <Stethoscope className="w-4 h-4" />,
  media:     <Camera className="w-4 h-4" />,
  emergency: <AlertCircle className="w-4 h-4" />,
};

const CAT_LABEL: Record<WaiverCategory, string> = {
  waiver:    "Liability Waiver",
  consent:   "Consent Form",
  medical:   "Medical",
  media:     "Media Release",
  emergency: "Emergency",
};

const STATUS_CONFIG = {
  signed:  { label: "Signed",             icon: CheckCircle2, color: "oklch(0.75 0.12 140)" },
  pending: { label: "Pending signature",   icon: Clock,        color: "oklch(0.72 0.17 75)" },
  expired: { label: "Expired",            icon: AlertCircle,   color: "oklch(0.68 0.22 25)" },
  voided:  { label: "Voided",             icon: AlertCircle,   color: "oklch(0.5 0 0)" },
} as const;

function deriveStatus(item: WaiverItem): keyof typeof STATUS_CONFIG {
  if (!item.signature) return "pending";
  return (item.signature.status === "signed" || item.signature.status === "expired" || item.signature.status === "voided")
    ? item.signature.status
    : "pending";
}

/* -------------------------------------------------------------------------- */
/* Summary strip                                                                */
/* -------------------------------------------------------------------------- */

function SummaryStrip({ items }: { items: WaiverItem[] }) {
  const signed  = items.filter((f) => f.signature?.status === "signed").length;
  const pending = items.filter((f) => !f.signature || f.signature.status === "pending").length;
  const required = items.filter((f) => f.required).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Signed",       value: signed,   color: "oklch(0.75 0.12 140)" },
        { label: "Pending",      value: pending,  color: pending > 0 ? "oklch(0.72 0.17 75)" : undefined },
        { label: "Required total", value: required },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div className="font-mono text-[24px] font-bold leading-none"
            style={s.color ? { color: s.color } : undefined}>
            {s.value}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Consent dialog — shown inline when user clicks "Review & sign"              */
/* -------------------------------------------------------------------------- */

function ConsentPanel({
  item,
  onSign,
  onCancel,
  signing,
}: {
  item: WaiverItem;
  onSign: (consentAcknowledged: true) => void;
  onCancel: () => void;
  signing: boolean;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <h4 className="font-semibold text-[13px]">Review & Sign — {item.title}</h4>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        {item.description}
      </p>

      {/* Explicit consent checkbox — required before sign button is enabled */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 rounded accent-purple-600"
        />
        <span className="text-[12px] text-foreground leading-snug">
          I have read and understand this document, and I am signing on behalf of my
          athlete. I acknowledge that my signature, IP address, and timestamp will be
          recorded for verification purposes.
        </span>
      </label>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />
        Your IP address and browser information will be recorded when you sign.
        This document does not constitute a legally binding e-signature in all
        jurisdictions.
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={!checked || signing}
          onClick={() => onSign(true)}
          style={checked ? { background: "oklch(0.72 0.18 290)" } : undefined}
          className="gap-1.5 text-white"
        >
          {signing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Sign document
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form card                                                                    */
/* -------------------------------------------------------------------------- */

function FormCard({
  item,
  playerId,
}: {
  item: WaiverItem;
  playerId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);

  const status = deriveStatus(item);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const catIcon = CAT_ICON[item.category];

  const signMutation = useSignWaiver(playerId);

  async function handleSign(consentAcknowledged: true) {
    setSigningId(item.id);
    try {
      await signMutation.mutateAsync({ templateId: item.id, consentAcknowledged });
      toast.success(`${item.title} signed successfully`);
      setSigningId(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Signing failed");
      setSigningId(null);
    }
  }

  return (
    <div
      className="rounded-xl border bg-card overflow-hidden"
      style={{ borderColor: status === "pending" ? "oklch(0.72 0.17 75 / 0.4)" : undefined }}
    >
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${cfg.color}15`, color: cfg.color }}>
          {catIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="font-semibold text-[13px]">{item.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{CAT_LABEL[item.category]}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1"
                style={{ color: cfg.color, background: `${cfg.color}15`, borderColor: `${cfg.color}30` }}>
                <Icon className="w-2.5 h-2.5" />
                {cfg.label}
              </span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <p className="text-[12px] text-muted-foreground mb-3">{item.description}</p>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3 flex-wrap">
            {item.required && <span className="font-medium text-foreground">Required</span>}
            {item.signature?.signedAt && (
              <span>Signed {formatDate(item.signature.signedAt)}</span>
            )}
            {item.dueDate && status === "pending" && (
              <span style={{ color: "oklch(0.72 0.17 75)" }}>Due {formatDate(item.dueDate)}</span>
            )}
            {item.expiresAt && <span>Expires {formatDate(item.expiresAt)}</span>}
          </div>

          {status === "pending" && signingId !== item.id && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setSigningId(item.id)}
            >
              Review & sign
            </Button>
          )}

          {status === "pending" && signingId === item.id && (
            <ConsentPanel
              item={item}
              onSign={handleSign}
              onCancel={() => setSigningId(null)}
              signing={signMutation.isPending}
            />
          )}

          {status === "signed" && (
            <div className="flex items-center gap-1.5 text-[11px]"
              style={{ color: "oklch(0.75 0.12 140)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Signed {item.signature?.signedAt ? `on ${formatDate(item.signature.signedAt)}` : "on file"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function ParentFormsPage() {
  const { user } = useAuth();
  // Security fix #5: scope to the authenticated parent's linked child only
  const playerId = user?.linkedChildId ?? "";

  const { data: forms = [], isLoading, isError } = useWaivers(playerId);

  const pending  = forms.filter((f) => !f.signature || f.signature.status === "pending");
  const signed   = forms.filter((f) => f.signature?.status === "signed");
  const optional = forms.filter((f) => !f.required && !f.signature);

  if (!playerId) {
    return (
      <AppShell>
        <PageHeader eyebrow="Family Portal" title="Forms & Waivers" />
        <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
          <FileText className="w-8 h-8 text-muted-foreground/30" />
          <p className="font-semibold">No linked athlete</p>
          <p className="text-[12px] text-muted-foreground">
            Contact your program administrator to link your athlete account.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Family Portal"
        title="Forms & Waivers"
        subtitle="Sign and manage required program documents."
        actions={
          pending.length > 0 ? (
            <Badge variant="secondary" style={{ color: "oklch(0.72 0.17 75)" }}>
              {pending.length} pending
            </Badge>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-[12px] text-red-400">
          Failed to load forms. Please refresh.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-6">
          <SummaryStrip items={forms} />

          <div className="flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/20 px-3 py-2 text-[11px] text-muted-foreground">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
            All signed documents are stored securely. Your IP address and timestamp
            are recorded when you sign. Waivers reset annually at the start of each season.
          </div>

          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-[13px] mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.17 75)" }} />
                <span style={{ color: "oklch(0.72 0.17 75)" }}>
                  Needs your signature ({pending.length})
                </span>
              </h2>
              <div className="space-y-3">
                {pending.map((f) => (
                  <FormCard key={f.id} item={f} playerId={playerId} />
                ))}
              </div>
            </div>
          )}

          {signed.length > 0 && (
            <div>
              <h2 className="font-semibold text-[13px] mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "oklch(0.75 0.12 140)" }} />
                Completed ({signed.length})
              </h2>
              <div className="space-y-3">
                {signed.map((f) => (
                  <FormCard key={f.id} item={f} playerId={playerId} />
                ))}
              </div>
            </div>
          )}

          {optional.length > 0 && (
            <div>
              <h2 className="font-semibold text-[13px] mb-3 text-muted-foreground">
                Optional
              </h2>
              <div className="space-y-3">
                {optional.map((f) => (
                  <FormCard key={f.id} item={f} playerId={playerId} />
                ))}
              </div>
            </div>
          )}

          {pending.length === 0 && signed.length === forms.length && forms.length > 0 && (
            <div className="rounded-xl border border-border bg-card px-6 py-10 flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="w-10 h-10" style={{ color: "oklch(0.75 0.12 140)" }} />
              <p className="font-semibold text-[15px]">All forms complete</p>
              <p className="text-[12px] text-muted-foreground max-w-xs">
                All required forms are signed. New forms will appear here when the program adds them.
              </p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
