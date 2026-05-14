/**
 * IndividualPicker — searchable selector for Individuals audience mode.
 *
 * Displays player and guardian result groups separately in a Command menu.
 * Selected items are shown as a labeled list below the trigger.
 */
import { useState, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RosterAthlete } from "@/lib/mock/data";
import type { GuardianEntry, IndividualRecipient } from "./types";

interface IndividualPickerProps {
  roster:    RosterAthlete[];
  guardians: GuardianEntry[];
  selected:  IndividualRecipient[];
  onChange:  (items: IndividualRecipient[]) => void;
}

function recipientKey(item: IndividualRecipient) {
  return `${item.type}:${item.id}`;
}

const RECIPIENT_TYPE_LABELS: Record<IndividualRecipient["type"], string> = {
  player:   "Player",
  guardian: "Guardian",
};

export function IndividualPicker({ roster, guardians, selected, onChange }: IndividualPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedKeys = useMemo(
    () => new Set(selected.map(recipientKey)),
    [selected]
  );

  function toggle(item: IndividualRecipient) {
    const key = recipientKey(item);
    if (selectedKeys.has(key)) {
      onChange(selected.filter((s) => recipientKey(s) !== key));
    } else {
      onChange([...selected, item]);
    }
  }

  function remove(key: string) {
    onChange(selected.filter((s) => recipientKey(s) !== key));
  }

  // Build candidate lists
  const playerCandidates: IndividualRecipient[] = roster.map((p) => ({
    type:        "player",
    id:          p.id,
    playerId:    p.id,
    displayName: p.name,
    subtitle:    `${p.position} · ${p.height}`,
  }));

  const guardianCandidates: IndividualRecipient[] = guardians
    .filter((g) => g.canReceiveMessages)
    .map((g) => ({
      type:         "guardian",
      id:           g.id,
      playerId:     g.playerId,
      displayName:  g.name,
      subtitle:     `Guardian · ${g.playerName}`,
      relationship: g.relationship,
    }));

  const hasSelected = selected.length > 0;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-[12.5px] font-normal h-8 px-3"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="w-3.5 h-3.5" />
              Search players and guardians…
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[380px] p-0"
          align="start"
          sideOffset={4}
        >
          <Command>
            <CommandInput placeholder="Search by name…" className="text-[13px]" />
            <CommandList className="max-h-[260px]">
              <CommandEmpty className="py-4 text-center text-[12.5px] text-muted-foreground">
                No matches found
              </CommandEmpty>

              <CommandGroup heading="Players">
                {playerCandidates.map((item) => {
                  const key     = recipientKey(item);
                  const checked = selectedKeys.has(key);
                  return (
                    <CommandItem
                      key={key}
                      value={item.displayName}
                      onSelect={() => toggle(item)}
                      className="gap-3 cursor-pointer"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          checked
                            ? "bg-primary border-primary"
                            : "border-border"
                        }`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 10">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{item.displayName}</div>
                        <div className="text-[11px] text-muted-foreground">{item.subtitle}</div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                        Player
                      </Badge>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {guardianCandidates.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Guardians">
                    {guardianCandidates.map((item) => {
                      const key     = recipientKey(item);
                      const checked = selectedKeys.has(key);
                      return (
                        <CommandItem
                          key={key}
                          value={`${item.displayName} ${item.subtitle}`}
                          onSelect={() => toggle(item)}
                          className="gap-3 cursor-pointer"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              checked
                                ? "bg-primary border-primary"
                                : "border-border"
                            }`}
                          >
                            {checked && (
                              <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 10">
                                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium truncate">{item.displayName}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
                          </div>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0 text-muted-foreground">
                            Guardian
                          </Badge>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items list */}
      {hasSelected && (
        <div className="space-y-0.5">
          {selected.map((item) => {
            const key = recipientKey(item);
            return (
              <div
                key={key}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-muted/40 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] font-medium">{item.displayName}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">{item.subtitle}</span>
                </div>
                <Badge
                  variant={item.type === "player" ? "secondary" : "outline"}
                  className="text-[10px] h-4 px-1.5 shrink-0"
                >
                  {RECIPIENT_TYPE_LABELS[item.type]}
                </Badge>
                <button
                  type="button"
                  onClick={() => remove(key)}
                  className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label={`Remove ${item.displayName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
