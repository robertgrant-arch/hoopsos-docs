/**
 * RecipientSelector — audience targeting control for the message compose flow.
 *
 * Renders the audience mode toggle (Players / Parents / Both / Individuals),
 * conditional scope controls, and the individual picker. Calls onChange
 * whenever the spec changes so the parent can request a live audience preview.
 */
import { Separator } from "@/components/ui/separator";
import type { RosterAthlete } from "@/lib/mock/data";
import type { AudienceMode, GuardianEntry, IndividualRecipient, PlayerScope, RecipientSpec } from "./types";
import { IndividualPicker } from "./IndividualPicker";

interface RecipientSelectorProps {
  roster:    RosterAthlete[];
  guardians: GuardianEntry[];
  value:     RecipientSpec;
  onChange:  (spec: RecipientSpec) => void;
}

const MODES: { value: AudienceMode; label: string; description: string }[] = [
  { value: "players",     label: "Players",     description: "Your roster" },
  { value: "parents",     label: "Parents",     description: "Linked guardians" },
  { value: "both",        label: "Both",        description: "Players + guardians" },
  { value: "individuals", label: "Individuals", description: "Specific people" },
];

export function RecipientSelector({ roster, guardians, value, onChange }: RecipientSelectorProps) {
  const { mode, playerScope, selectedPlayerIds, individuals } = value;

  function setMode(next: AudienceMode) {
    onChange({ ...value, mode: next });
  }

  function setPlayerScope(next: PlayerScope) {
    onChange({ ...value, playerScope: next, selectedPlayerIds: [] });
  }

  function togglePlayer(id: string) {
    const next = selectedPlayerIds.includes(id)
      ? selectedPlayerIds.filter((x) => x !== id)
      : [...selectedPlayerIds, id];
    onChange({ ...value, selectedPlayerIds: next });
  }

  function setIndividuals(items: IndividualRecipient[]) {
    onChange({ ...value, individuals: items });
  }

  const showScopeControl = mode === "players" || mode === "parents" || mode === "both";
  const showPlayerList   = showScopeControl && playerScope === "specific";

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div>
        <SectionLabel>Audience</SectionLabel>
        <div className="grid grid-cols-4 gap-1 mt-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`px-2 py-2 rounded text-left transition-colors border ${
                mode === m.value
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              <div className="text-[12px] font-semibold leading-tight">{m.label}</div>
              <div className="text-[10.5px] mt-0.5 leading-tight opacity-70">{m.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scope control — Players / Parents / Both modes */}
      {showScopeControl && (
        <div>
          <SectionLabel>Scope</SectionLabel>
          <div className="flex gap-2 mt-1.5">
            <ScopeButton
              active={playerScope === "all"}
              onClick={() => setPlayerScope("all")}
              label={`All Active Players (${roster.length})`}
            />
            <ScopeButton
              active={playerScope === "specific"}
              onClick={() => setPlayerScope("specific")}
              label="Choose players…"
            />
          </div>

          {showPlayerList && (
            <div className="mt-2 rounded border border-border bg-muted/20 max-h-[180px] overflow-y-auto">
              {roster.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-muted-foreground text-center">
                  No active players on roster
                </div>
              ) : (
                roster.map((player) => {
                  const checked = selectedPlayerIds.includes(player.id);
                  return (
                    <label
                      key={player.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors border-b border-border last:border-0"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-primary border-primary" : "border-border"
                        }`}
                        onClick={() => togglePlayer(player.id)}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 10">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => togglePlayer(player.id)}
                        aria-label={player.name}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[12.5px] font-medium">{player.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-2">
                          {player.position} · {player.height}
                        </span>
                      </div>
                      {player.isMinor && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Minor
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          )}

          {showScopeControl && playerScope === "specific" && selectedPlayerIds.length > 0 && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              {selectedPlayerIds.length} player{selectedPlayerIds.length !== 1 ? "s" : ""} selected
              {mode !== "players" && (
                <span className="ml-1">
                  — guardian contacts resolved from selection
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Individuals picker */}
      {mode === "individuals" && (
        <div>
          <SectionLabel>Recipients</SectionLabel>
          <div className="mt-1.5">
            <IndividualPicker
              roster={roster}
              guardians={guardians}
              selected={individuals}
              onChange={setIndividuals}
            />
            {individuals.length === 0 && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Search and select one or more players or guardians.
              </p>
            )}
          </div>
        </div>
      )}

      <Separator />
    </div>
  );
}

/* Small reusable sub-components */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.13em] font-mono text-muted-foreground">
      {children}
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-1.5 px-3 rounded border text-[12px] font-medium transition-colors text-left ${
        active
          ? "bg-primary/10 border-primary/40 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
