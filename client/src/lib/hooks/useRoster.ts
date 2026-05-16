// Fetches the org's roster from the real API and maps it to the shape
// ClipActionBar needs. Falls back to hardcoded demo data on auth failure
// (demo mode / unauthenticated).

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api/client";

export type RosterEntry = {
  id: string;
  name: string;
  position: string;
  initials: string;
};

// "Full Team" sentinel + demo fallback players
const FALLBACK: RosterEntry[] = [
  { id: "team", name: "Full Team",    position: "",   initials: "" },
  { id: "p1",   name: "Marcus Davis", position: "PG", initials: "MD" },
  { id: "p2",   name: "Jordan Smith", position: "SG", initials: "JS" },
  { id: "p3",   name: "Tyler Brown",  position: "SF", initials: "TB" },
  { id: "p4",   name: "Chris Evans",  position: "PF", initials: "CE" },
  { id: "p5",   name: "Devon Carter", position: "C",  initials: "DC" },
];

type ApiPlayer = {
  id: string;
  name: string;
  position?: string | null;
};

export function useRoster() {
  const [roster,  setRoster]  = useState<RosterEntry[]>(FALLBACK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<ApiPlayer[]>("/roster")
      .then((players) => {
        if (cancelled || !Array.isArray(players) || players.length === 0) return;
        const entries: RosterEntry[] = players.map((p) => ({
          id:       p.id,
          name:     p.name,
          position: p.position ?? "",
          initials: p.name
            .split(" ")
            .map((w) => w[0] ?? "")
            .slice(0, 2)
            .join("")
            .toUpperCase(),
        }));
        setRoster([{ id: "team", name: "Full Team", position: "", initials: "" }, ...entries]);
      })
      .catch(() => { /* keep fallback — demo mode */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { roster, loading };
}
