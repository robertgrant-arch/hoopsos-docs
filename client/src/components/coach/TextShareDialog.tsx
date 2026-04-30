/**
 * TextShareDialog
 * ---------------------------------------------------------------------------
 * Drop-in dialog used by the Practice Plan Builder "Print / share" panel.
 *
 * Lets a coach text the read-only share link for a plan to a phone number
 * via the `/api/send-sms` Vercel function (Twilio backend).
 *
 * Usage:
 *   <TextShareDialog
 *     planTitle={plan.title}
 *     shareUrl={`${origin}/share/practice-plan/${plan.id}`}
 *     senderName={coach.displayName}
 *     trigger={<Button variant="ghost"><MessageSquare /> Text link</Button>}
 *   />
 */
import { useState, type ReactNode } from "react";
import { Loader2, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TextShareDialogProps = {
  planTitle: string;
  shareUrl: string;
  senderName?: string;
  trigger: ReactNode;
};

/** Format raw digits as a friendly US mask while typing: (555) 123-4567. */
function formatUsMask(value: string): string {
  const digits = value.replace(/\D+/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Front-end mirror of the server's E.164 check — keeps the button disabled until valid. */
function isLikelyValid(value: string): boolean {
  const digits = value.replace(/\D+/g, "");
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith("1")) return true;
  if (/^\+[1-9]\d{7,14}$/.test(value.trim())) return true;
  return false;
}

export function TextShareDialog({
  planTitle,
  shareUrl,
  senderName,
  trigger,
}: TextShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const valid = isLikelyValid(phone);

  async function handleSend() {
    if (!valid || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          link: shareUrl,
          planTitle,
          senderName,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        const map: Record<string, string> = {
          invalid_phone: "That phone number doesn't look right.",
          invalid_link: "The share link is invalid.",
          rate_limited: "You've sent too many texts recently. Try again in a minute.",
          twilio_not_configured:
            "Texting isn't configured on this environment yet. Contact an admin.",
          twilio_send_failed: "We couldn't deliver the text. Double-check the number.",
        };
        toast.error(map[data.error ?? ""] ?? "Couldn't send the text.");
        return;
      }
      toast.success(`Texted plan to ${phone}`);
      setOpen(false);
      setPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Network error — couldn't reach the texting service.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Text this practice plan
          </DialogTitle>
          <DialogDescription>
            We'll send a read-only link to <strong>{planTitle}</strong> as an SMS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="sms-phone">Phone number</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="sms-phone"
              autoFocus
              inputMode="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(formatUsMask(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid && !sending) handleSend();
              }}
              className="pl-9"
              aria-invalid={phone.length > 0 && !valid}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            US numbers only for now. Standard message rates may apply for the recipient.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!valid || sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" /> Send text
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TextShareDialog;
