/**
 * NewBroadcastDialog — compose dialog for targeted audience messaging.
 *
 * Handles:
 *   1. Recipient targeting (RecipientSelector)
 *   2. Live audience preview (AudienceSummaryBar)
 *   3. Message composition
 *   4. Send to POST /api/messages/compose
 *
 * Opens as a Dialog modal to keep the compose flow focused and explicit.
 * The recipient summary is always visible above the send action — the coach
 * must see who they're sending to before they can submit.
 */
import { useState, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast }    from "sonner";
import { apiFetch } from "@/lib/api/client";
import type { RosterAthlete } from "@/lib/mock/data";
import { RecipientSelector }  from "./RecipientSelector";
import { AudienceSummaryBar } from "./AudienceSummaryBar";
import {
  type RecipientSpec,
  type ResolvedAudience,
  type GuardianEntry,
  defaultRecipientSpec,
} from "./types";

// Mock guardians derived from roster isMinor flag.
// In production this comes from GET /api/roster/guardians.
// Assumption: guardian API endpoint returns GuardianEntry[].
function buildMockGuardians(roster: RosterAthlete[]): GuardianEntry[] {
  return roster
    .filter((p) => p.isMinor)
    .map((p, i) => ({
      id:                 `g_${p.id}`,
      playerId:           p.id,
      playerName:         p.name,
      name:               `${p.name.split(" ")[1] ?? p.name} Sr.`,
      email:              `parent_${i}@example.com`,
      phone:              `+1555${String(i).padStart(7, "0")}`,
      relationship:       "parent",
      isPrimary:          true,
      canReceiveMessages: true,
    }));
}

interface NewBroadcastDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onCreated:     (threadId: string, label: string) => void;
  roster:        RosterAthlete[];
}

export function NewBroadcastDialog({
  open,
  onOpenChange,
  onCreated,
  roster,
}: NewBroadcastDialogProps) {
  const [spec,     setSpec]     = useState<RecipientSpec>(defaultRecipientSpec());
  const [title,    setTitle]    = useState("");
  const [body,     setBody]     = useState("");
  const [audience, setAudience] = useState<ResolvedAudience | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending,  setSending]  = useState(false);

  // In production this is fetched from /api/roster/guardians
  const guardians = buildMockGuardians(roster);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSpec(defaultRecipientSpec());
      setTitle("");
      setBody("");
      setAudience(null);
    }
  }, [open]);

  // Resolve audience preview whenever spec changes.
  // In production: debounce + call POST /api/messages/resolve-audience.
  // Here: pure client-side resolution using the same logic as the server.
  const resolveAudience = useCallback(
    (s: RecipientSpec) => {
      setPreviewLoading(true);
      // Simulate async resolution (replace with real API call)
      setTimeout(() => {
        const resolved = resolveAudienceClient(s, roster, guardians);
        setAudience(resolved);
        setPreviewLoading(false);
      }, 0);
    },
    [roster, guardians]
  );

  function handleSpecChange(next: RecipientSpec) {
    setSpec(next);
    resolveAudience(next);
  }

  const canSend =
    !sending &&
    body.trim().length > 0 &&
    audience !== null &&
    audience.totalContacts > 0;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      const result = await apiFetch<{ thread: { id: string }; audience: { totalContacts: number } }>(
        "/messages/compose",
        {
          method: "POST",
          body:   JSON.stringify({ spec, title: title.trim() || null, body: body.trim() }),
        }
      );
      toast.success(
        `Message sent to ${result.audience.totalContacts} recipient${result.audience.totalContacts !== 1 ? "s" : ""}`
      );
      onCreated(result.thread.id, buildThreadLabel(spec, audience!));
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-[15px] font-semibold tracking-tight">
            New Message
          </DialogTitle>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Choose your audience, then compose your message.
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Recipient targeting */}
          <RecipientSelector
            roster={roster}
            guardians={guardians}
            value={spec}
            onChange={handleSpecChange}
          />

          {/* Optional subject line */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.13em] font-mono text-muted-foreground">
              Subject <span className="normal-case">(optional)</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Film session tomorrow at 4 PM"
              className="text-[13px] h-8"
              maxLength={120}
            />
          </div>

          {/* Message body */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.13em] font-mono text-muted-foreground">
              Message
            </Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your message…"
              className="resize-none text-[13.5px] min-h-[100px] max-h-[200px]"
              rows={4}
            />
            <div className="text-[10.5px] text-muted-foreground">
              ⌘ + Enter to send
            </div>
          </div>

          {/* Audience summary */}
          <AudienceSummaryBar
            audience={audience}
            loading={previewLoading}
            empty={audience === null}
          />
        </div>

        <Separator />

        <DialogFooter className="px-5 py-3.5 flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-[13px] h-8 px-3"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="h-8 text-[13px] px-4 gap-2"
          >
            {sending ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Client-side audience resolver                                               */
/* Mirrors server/modules/messaging/recipient-resolver.ts                     */
/* Replace preview calls with POST /api/messages/resolve-audience in prod.    */
/* -------------------------------------------------------------------------- */

function resolveAudienceClient(
  spec: RecipientSpec,
  roster: RosterAthlete[],
  guardians: GuardianEntry[]
): ResolvedAudience {
  const { mode, playerScope, selectedPlayerIds, individuals } = spec;

  function targetPlayers(): RosterAthlete[] {
    return playerScope === "all"
      ? roster
      : roster.filter((p) => selectedPlayerIds.includes(p.id));
  }

  function guardiansFor(players: RosterAthlete[]): GuardianEntry[] {
    const ids = new Set(players.map((p) => p.id));
    return guardians.filter((g) => ids.has(g.playerId) && g.canReceiveMessages);
  }

  if (mode === "players") {
    const targets = targetPlayers();
    return { playerCount: targets.length, guardianCount: 0, totalContacts: targets.length, playerWarnings: [], guardianWarnings: [] };
  }

  if (mode === "parents") {
    const targets  = targetPlayers();
    const resolved = guardiansFor(targets);
    const warnings = targets
      .filter((p) => !resolved.some((g) => g.playerId === p.id))
      .map((p) => ({ playerId: p.id, playerName: p.name, message: "No linked guardian" }));
    return { playerCount: 0, guardianCount: resolved.length, totalContacts: resolved.length, playerWarnings: warnings, guardianWarnings: [] };
  }

  if (mode === "both") {
    const targets   = targetPlayers();
    const resolvedG = guardiansFor(targets);
    const warnings  = targets
      .filter((p) => !resolvedG.some((g) => g.playerId === p.id))
      .map((p) => ({ playerId: p.id, playerName: p.name, message: "No linked guardian — guardian message will not be sent" }));
    return { playerCount: targets.length, guardianCount: resolvedG.length, totalContacts: targets.length + resolvedG.length, playerWarnings: warnings, guardianWarnings: [] };
  }

  if (mode === "individuals") {
    const players  = individuals.filter((i) => i.type === "player").length;
    const guards   = individuals.filter((i) => i.type === "guardian").length;
    return { playerCount: players, guardianCount: guards, totalContacts: individuals.length, playerWarnings: [], guardianWarnings: [] };
  }

  return { playerCount: 0, guardianCount: 0, totalContacts: 0, playerWarnings: [], guardianWarnings: [] };
}

function buildThreadLabel(spec: RecipientSpec, audience: ResolvedAudience): string {
  if (spec.mode === "players")     return `Team Broadcast — Players (${audience.playerCount})`;
  if (spec.mode === "parents")     return `Parent Broadcast (${audience.guardianCount})`;
  if (spec.mode === "both")        return `Team + Parents (${audience.totalContacts})`;
  if (spec.mode === "individuals") return `Individual Message (${audience.totalContacts})`;
  return "New Message";
}
