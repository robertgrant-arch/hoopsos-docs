/**
 * FilmAnalysisPages.tsx
 *
 * Coach-facing Film AI Analysis frontend module for HoopsOS.
 * Layered into the existing Coach HQ pages folder.
 *
 * Uses wouter (the router used by the rest of this app) — see App.tsx.
 *
 * Exports route-level page components:
 *   - FilmRoomPage         (list of sessions, upload entry point)
 *   - FilmUploadPage       (conceptual upload + ingest trigger)
 *   - FilmSessionPage      (single session: status, team stats, timeline)
 *   - PlayerHighlightsPage (player-facing highlight reel surface)
 *
 * Data is sourced from the shared mock layer via the useFilmAnalysis hook.
 */

import * as React from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilmAnalysis } from "@/hooks/useFilmAnalysis";
import type {
  FilmSession,
  FilmSessionStatus,
  TimelineEvent,
  PlayerHighlight,
  TeamGameStats,
} from "@shared/film-analysis/types";

/* ---------- helpers ---------- */

const statusColor: Record<FilmSessionStatus, string> = {
  uploaded: "bg-slate-500",
  queued: "bg-amber-500",
  processing: "bg-blue-500",
  ready: "bg-emerald-500",
  failed: "bg-red-500",
};

function StatusBadge({ status }: { status: FilmSessionStatus }) {
  return (
    <Badge className={`${statusColor[status]} text-white capitalize`}>
      {status}
    </Badge>
  );
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ---------- FilmRoomPage ---------- */

export function FilmRoomPage() {
  const { sessions, isLoading } = useFilmAnalysis();
  const [, setLocation] = useLocation();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Film Room</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered film analysis. Upload game film and get team & player
            insights, timeline events, and highlight reels.
          </p>
        </div>
        <Button onClick={() => setLocation("/app/coach/film/upload")}>
          Upload Film
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No film sessions yet. Upload your first game film to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: FilmSession }) {
  return (
    <Link href={`/app/coach/film/${session.id}`}>
      <a>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base truncate">{session.title}</CardTitle>
            <StatusBadge status={session.status} />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {new Date(session.gameDate).toLocaleDateString()} ·{" "}
              {session.opponent ?? "Practice"}
            </div>
            {session.status === "processing" && (
              <Progress value={session.progressPct ?? 0} />
            )}
            <div className="text-xs text-muted-foreground">
              {session.durationSec ? formatClock(session.durationSec) : "—"} duration
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}

/* ---------- FilmUploadPage ---------- */

export function FilmUploadPage() {
  const { createSession } = useFilmAnalysis();
  const [, setLocation] = useLocation();
  const [title, setTitle] = React.useState("");
  const [opponent, setOpponent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const session = await createSession({
      title,
      opponent,
      gameDate: new Date().toISOString(),
    });
    setSubmitting(false);
    setLocation(`/app/coach/film/${session.id}`);
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Upload Film</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="vs. Eagles - 11/14"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Opponent</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Eagles"
              />
            </div>
            <div className="rounded-md border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
              Drag & drop video file here
              <div className="text-xs mt-1">
                (Conceptual — backend ingest is mocked in this build)
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating session…" : "Start Analysis"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- FilmSessionPage ---------- */

export function FilmSessionPage() {
  const [, params] = useRoute<{ sessionId: string }>("/app/coach/film/:sessionId");
  const sessionId = params?.sessionId ?? "";
  const { getSession } = useFilmAnalysis();
  const session = getSession(sessionId);

  if (!session) {
    return <div className="p-6">Session not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{session.title}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(session.gameDate).toLocaleDateString()} ·{" "}
            {session.opponent ?? "Practice"}
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {session.status === "processing" && (
        <Card>
          <CardContent className="py-4">
            <div className="text-sm mb-2">AI analysis in progress…</div>
            <Progress value={session.progressPct ?? 0} />
          </CardContent>
        </Card>
      )}

      {session.status === "ready" && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <TeamStatsPanel stats={session.teamStats} />
          </TabsContent>
          <TabsContent value="timeline">
            <TimelinePanel events={session.timeline ?? []} />
          </TabsContent>
          <TabsContent value="players">
            <PlayerStatsPanel session={session} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function TeamStatsPanel({ stats }: { stats?: TeamGameStats }) {
  if (!stats) return <div className="text-muted-foreground">No team stats available.</div>;
  const rows: [string, number | string][] = [
    ["Points", stats.points],
    ["FG%", `${stats.fgPct.toFixed(1)}%`],
    ["3P%", `${stats.threePct.toFixed(1)}%`],
    ["Rebounds", stats.rebounds],
    ["Assists", stats.assists],
    ["Turnovers", stats.turnovers],
    ["Pace", stats.pace.toFixed(1)],
  ];
  return (
    <Card>
      <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0)
    return <div className="text-muted-foreground">No timeline events.</div>;
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <Card key={e.id}>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium capitalize">
                {e.type.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-muted-foreground">{e.description}</div>
            </div>
            <div className="text-sm tabular-nums">{formatClock(e.timeSec)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PlayerStatsPanel({ session }: { session: FilmSession }) {
  const players = session.playerStats ?? [];
  if (players.length === 0)
    return <div className="text-muted-foreground">No player stats available.</div>;
  return (
    <div className="space-y-2">
      {players.map((p) => (
        <Card key={p.playerId}>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.playerName}</div>
              <div className="text-xs text-muted-foreground">
                {p.minutes} min · {p.points} pts · {p.rebounds} reb · {p.assists} ast
              </div>
            </div>
            <Link href={`/app/player/highlights/${p.playerId}`}>
              <a className="text-sm text-blue-600 hover:underline">
                View highlights →
              </a>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------- PlayerHighlightsPage ---------- */

export function PlayerHighlightsPage() {
  const [, params] = useRoute<{ playerId: string }>("/app/player/highlights/:playerId");
  const playerId = params?.playerId ?? "";
  const { getPlayerHighlights } = useFilmAnalysis();
  const highlights = getPlayerHighlights(playerId);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Highlights</h1>
      {highlights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No highlights yet. Once your coach uploads film, AI-generated
            highlights will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {highlights.map((h) => (
            <HighlightCard key={h.id} highlight={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: PlayerHighlight }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base capitalize">
          {highlight.kind.replace(/_/g, " ")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="aspect-video bg-slate-900 rounded-md flex items-center justify-center text-white text-xs">
          ▶ Clip {formatClock(highlight.startSec)}–{formatClock(highlight.endSec)}
        </div>
        <div className="text-xs text-muted-foreground">{highlight.caption}</div>
      </CardContent>
    </Card>
  );
}

export default {
  FilmRoomPage,
  FilmUploadPage,
  FilmSessionPage,
  PlayerHighlightsPage,
};
