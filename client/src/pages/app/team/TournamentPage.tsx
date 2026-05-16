import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Hotel,
  Car,
  Package,
  Phone,
  Film,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  AlertTriangle,
  Star,
  CheckCircle2,
  Circle,
  CalendarPlus,
  Users,
  Utensils,
  DollarSign,
  Clipboard,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Color tokens ───────────────────────────────────────────────────────────────

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";

// ── Types ──────────────────────────────────────────────────────────────────────

type GameResult = {
  id: string;
  time: string;
  court: string;
  opponent: string;
  score: string | null;
  result: "win" | "loss" | "upcoming";
  filmUrl: string | null;
  clipCount: number | null;
  coachNotes: string | null;
};

type DaySchedule = {
  day: string;
  date: string;
  events: Array<
    | { kind: "game"; data: GameResult }
    | { kind: "activity"; time: string; label: string; icon: string }
  >;
};

type GearSection = { heading: string; items: Array<{ id: string; label: string; checked: boolean }> };

// ── Mock data ──────────────────────────────────────────────────────────────────

const TOURNAMENT = {
  id: "spring26",
  name: "Spring Invitational 2026",
  venue: "Prudential Center",
  address: "25 Lafayette St, Newark, NJ 07102",
  dates: "May 23 – 25, 2026",
  record: "2–1",
  wins: 2,
  losses: 1,
  totalPlayers: 12,
  travelingPlayers: 12,
  localPlayers: 0,
  teamHighlight: "Semifinal tonight — 6 PM, Court A",
};

const ROSTER_TRAVEL = [
  { id: "p1",  name: "Marcus Davis",   initials: "MD", traveling: true  },
  { id: "p2",  name: "Jordan Smith",   initials: "JS", traveling: true  },
  { id: "p3",  name: "Tyler Brown",    initials: "TB", traveling: true  },
  { id: "p4",  name: "Devon Williams", initials: "DW", traveling: true  },
  { id: "p5",  name: "Caleb Moore",    initials: "CM", traveling: true  },
  { id: "p6",  name: "Isaiah Jones",   initials: "IJ", traveling: true  },
  { id: "p7",  name: "Nathan Reed",    initials: "NR", traveling: true  },
  { id: "p8",  name: "Chris Evans",    initials: "CE", traveling: true  },
  { id: "p9",  name: "Malik Thompson", initials: "MT", traveling: true  },
  { id: "p10", name: "Dante Garcia",   initials: "DG", traveling: true  },
  { id: "p11", name: "Zion Patterson", initials: "ZP", traveling: true  },
  { id: "p12", name: "Aiden Cruz",     initials: "AC", traveling: true  },
];

const SCHEDULE: DaySchedule[] = [
  {
    day: "Friday",
    date: "May 23",
    events: [
      { kind: "activity", time: "8:00 AM",  label: "Bus departs Barnegat Park & Ride",   icon: "bus"  },
      { kind: "activity", time: "10:00 AM", label: "Arrive & check in at venue",          icon: "map"  },
      { kind: "activity", time: "10:30 AM", label: "Walkthrough / shoot-around — Court B", icon: "ball" },
      { kind: "game", data: { id: "g1", time: "12:00 PM", court: "Court B", opponent: "Westfield Warriors", score: "58–47", result: "win", filmUrl: "/app/coach/film/t1g1", clipCount: 12, coachNotes: "Strong defensive half — held them to 22 in the 2nd. Marcus had 18." } },
      { kind: "activity", time: "2:30 PM",  label: "Team lunch — Panera (Newark Penn)",   icon: "food" },
      { kind: "game", data: { id: "g2", time: "4:00 PM",  court: "Court C", opponent: "Linden Eagles",     score: "44–51", result: "loss", filmUrl: "/app/coach/film/t1g2", clipCount: 9,  coachNotes: "Turnover-heavy 2nd quarter cost us. 14 TOs — must clean up ball movement." } },
      { kind: "activity", time: "6:30 PM",  label: "Check in — Marriott Courtyard Newark", icon: "hotel" },
      { kind: "activity", time: "8:00 PM",  label: "Film session — Hotel conference room", icon: "film"  },
    ],
  },
  {
    day: "Saturday",
    date: "May 24",
    events: [
      { kind: "activity", time: "7:30 AM",  label: "Team breakfast — hotel lobby",          icon: "food"  },
      { kind: "activity", time: "9:00 AM",  label: "Shoot-around — Court A (30 min)",       icon: "ball"  },
      { kind: "game", data: { id: "g3", time: "10:30 AM", court: "Court A", opponent: "Newark Central Knights", score: "62–55", result: "win", filmUrl: "/app/coach/film/t1g3", clipCount: 14, coachNotes: "Devon dominated the paint with 14/8. Great defensive effort from the whole unit." } },
      { kind: "activity", time: "1:00 PM",  label: "Rest & recovery — hotel rooms",         icon: "rest"  },
      { kind: "activity", time: "4:00 PM",  label: "Pre-game shootaround",                  icon: "ball"  },
      { kind: "game", data: { id: "g4", time: "6:00 PM",  court: "Court A", opponent: "Edison Prep Panthers", score: null, result: "upcoming", filmUrl: null, clipCount: null, coachNotes: null } },
    ],
  },
  {
    day: "Sunday",
    date: "May 25",
    events: [
      { kind: "activity", time: "8:00 AM",  label: "Checkout — hotel",                      icon: "hotel" },
      { kind: "activity", time: "9:00 AM",  label: "Team breakfast & debrief",               icon: "food"  },
      { kind: "game", data: { id: "g5", time: "11:00 AM", court: "Main Court", opponent: "TBD — Championship", score: null, result: "upcoming", filmUrl: null, clipCount: null, coachNotes: null } },
      { kind: "activity", time: "2:00 PM",  label: "Awards ceremony",                       icon: "trophy" },
      { kind: "activity", time: "3:30 PM",  label: "Bus departs for Barnegat",               icon: "bus"   },
    ],
  },
];

const HOTEL = {
  name: "Marriott Courtyard Newark Downtown",
  address: "858 McCarter Hwy, Newark, NJ 07102",
  groupRate: "$129/night",
  blockDeadline: "Friday, May 16, 2026",
  bookingUrl: "https://www.marriott.com",
  confirmationCode: "HOOPS26NJ",
  checkIn: "Friday, May 23 · After 3 PM",
  checkOut: "Sunday, May 25 · By 12 PM",
  phone: "(973) 555-0288",
};

const TRANSPORTATION = [
  { id: "t1", name: "Coach Williams",  initials: "CW", role: "Head Coach",  seats: "7-passenger van", departs: "8:00 AM from Park & Ride" },
  { id: "t2", name: "Coach Martinez",  initials: "CM", role: "Asst. Coach", seats: "5-passenger SUV",  departs: "8:00 AM from Park & Ride" },
  { id: "t3", name: "James Davis",     initials: "JD", role: "Parent",      seats: "6 seats available", departs: "8:00 AM from Park & Ride" },
];

const GEAR_SECTIONS: GearSection[] = [
  {
    heading: "Game Gear",
    items: [
      { id: "gg1", label: "Home uniform (#___)",          checked: false },
      { id: "gg2", label: "Away uniform (#___)",           checked: false },
      { id: "gg3", label: "Game sneakers",                 checked: false },
      { id: "gg4", label: "Ankle braces / support wraps",  checked: false },
    ],
  },
  {
    heading: "Warm-ups & Recovery",
    items: [
      { id: "wu1", label: "Warm-up jacket",               checked: false },
      { id: "wu2", label: "Warm-up pants",                checked: false },
      { id: "wu3", label: "Practice sneakers (backup)",    checked: false },
      { id: "wu4", label: "Foam roller",                   checked: false },
      { id: "wu5", label: "Resistance band",               checked: false },
      { id: "wu6", label: "Ice packs (2)",                 checked: false },
    ],
  },
  {
    heading: "Nutrition & Hydration",
    items: [
      { id: "nu1", label: "32+ oz water bottle (x2)",     checked: false },
      { id: "nu2", label: "Electrolyte packets",           checked: false },
      { id: "nu3", label: "Energy bars / snacks (3+)",     checked: false },
      { id: "nu4", label: "Fruit / real food snack",       checked: false },
    ],
  },
  {
    heading: "Travel Essentials",
    items: [
      { id: "tr1", label: "Phone charger + battery pack",  checked: false },
      { id: "tr2", label: "Headphones",                    checked: false },
      { id: "tr3", label: "Change of clothes (1–2 days)",  checked: false },
      { id: "tr4", label: "Toiletries",                    checked: false },
      { id: "tr5", label: "Cash / meal stipend ($25/day)", checked: false },
      { id: "tr6", label: "Team ID / school ID",           checked: false },
    ],
  },
];

const EMERGENCY_CONTACTS = [
  { label: "Tournament Director",  name: "Mark Henderson",  phone: "(973) 555-0101" },
  { label: "Venue Operations",     name: "Prudential Ctr",  phone: "(973) 555-0200" },
  { label: "Nearest Hospital",     name: "University Hosp.", phone: "(973) 972-4300", note: "150 Bergen St, Newark" },
];

// ── Bracket data (4-team single elimination) ────────────────────────────────

type BracketTeam = { name: string; seed: number; isOurs: boolean };
type BracketGame = {
  id: string;
  round: string;
  team1: BracketTeam;
  team2: BracketTeam;
  score1: string | null;
  score2: string | null;
  winner: "team1" | "team2" | null;
  time: string;
  court: string;
};

const BRACKET_GAMES: BracketGame[] = [
  {
    id: "sf1",
    round: "Semifinal",
    team1: { name: "Barnegat Bengals", seed: 1, isOurs: true },
    team2: { name: "Edison Prep Panthers", seed: 4, isOurs: false },
    score1: null,
    score2: null,
    winner: null,
    time: "Sat May 24 · 6:00 PM",
    court: "Court A",
  },
  {
    id: "sf2",
    round: "Semifinal",
    team1: { name: "Newark Central Knights", seed: 2, isOurs: false },
    team2: { name: "Westfield Warriors", seed: 3, isOurs: false },
    score1: "62",
    score2: "55",
    winner: "team1",
    time: "Fri May 23 · 2:00 PM",
    court: "Court A",
  },
  {
    id: "ch1",
    round: "Championship",
    team1: { name: "Barnegat Bengals", seed: 1, isOurs: true },
    team2: { name: "Newark Central Knights", seed: 2, isOurs: false },
    score1: null,
    score2: null,
    winner: null,
    time: "Sun May 25 · 11:00 AM",
    court: "Main Court",
  },
];

// Pool play results
const POOL_RESULTS = [
  { opponent: "Westfield Warriors",       score: "58–47", result: "W" as const },
  { opponent: "Linden Eagles",            score: "44–51", result: "L" as const },
  { opponent: "Newark Central Knights",   score: "62–55", result: "W" as const },
];

// ── Film cards ─────────────────────────────────────────────────────────────────

const FILM_CARDS = [
  { id: "f1", opponent: "Westfield Warriors",     score: "W 58–47", date: "Fri May 23", coachNotes: "Strong defensive half — held them to 22 in the 2nd. Marcus had 18 & 6.", filmUrl: "/app/coach/film/t1g1", clipCount: 12, completed: true  },
  { id: "f2", opponent: "Linden Eagles",          score: "L 44–51", date: "Fri May 23", coachNotes: "Turnover-heavy 2nd quarter cost us. 14 TOs — must clean up ball movement.", filmUrl: "/app/coach/film/t1g2", clipCount: 9,  completed: true  },
  { id: "f3", opponent: "Newark Central Knights", score: "W 62–55", date: "Sat May 24", coachNotes: "Devon dominated the paint with 14/8. Great defensive effort from the whole unit.", filmUrl: "/app/coach/film/t1g3", clipCount: 14, completed: true  },
  { id: "f4", opponent: "Edison Prep Panthers",   score: "Semifinal", date: "Sat May 24 · 6 PM", coachNotes: null, filmUrl: null, clipCount: null, completed: false },
  { id: "f5", opponent: "TBD — Championship",     score: "Championship", date: "Sun May 25 · 11 AM", coachNotes: null, filmUrl: null, clipCount: null, completed: false },
];

// ── Helper components ──────────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
      style={{ background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY }}
    >
      {initials}
    </div>
  );
}

function ResultBadge({ result }: { result: "win" | "loss" | "upcoming" | "W" | "L" }) {
  if (result === "win" || result === "W")
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${SUCCESS.replace(")", " / 0.14)")}`, color: SUCCESS }}>
        W
      </span>
    );
  if (result === "loss" || result === "L")
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${DANGER.replace(")", " / 0.14)")}`, color: DANGER }}>
        L
      </span>
    );
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY }}>
      Upcoming
    </span>
  );
}

// ── SVG Bracket ────────────────────────────────────────────────────────────────

function TournamentBracket() {
  const W = 560;
  const H = 280;
  const boxW = 160;
  const boxH = 36;
  const gap = 16;

  // Semifinal positions (left column)
  const sf1y = 40;
  const sf2y = sf1y + boxH * 2 + gap * 2 + 30;

  // Championship y (right column) — centered between the two semis
  const chY = (sf1y + sf2y) / 2 + boxH / 2 - boxH;

  // Connector x positions
  const sfRight = boxW + 20;
  const chLeft  = W / 2 + 20;

  function TeamBox({
    x, y, team, score, isWinner,
  }: {
    x: number; y: number;
    team: BracketTeam;
    score: string | null;
    isWinner: boolean;
  }) {
    const fill  = team.isOurs
      ? PRIMARY.replace(")", " / 0.12)")
      : isWinner
      ? "oklch(0.22 0.005 260)"
      : "oklch(0.17 0.005 260)";
    const stroke = team.isOurs ? PRIMARY.replace(")", " / 0.40)") : "oklch(0.25 0.005 260)";
    const textColor = team.isOurs ? PRIMARY : isWinner ? "oklch(0.90 0.01 260)" : "oklch(0.65 0.01 260)";

    return (
      <g>
        <rect x={x} y={y} width={boxW} height={boxH} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
        {team.isOurs && (
          <rect x={x} y={y} width={4} height={boxH} rx={2} fill={PRIMARY} />
        )}
        <text x={x + 14} y={y + 22} fontSize={12} fontWeight={team.isOurs ? "700" : "500"} fill={textColor}>
          {team.seed}. {team.name.length > 16 ? team.name.slice(0, 16) + "…" : team.name}
        </text>
        {score && (
          <text x={x + boxW - 8} y={y + 22} fontSize={12} fontWeight="700" fill={textColor} textAnchor="end">
            {score}
          </text>
        )}
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="max-w-[560px]"
      style={{ fontFamily: "inherit" }}
      aria-label="Tournament bracket"
    >
      {/* Background */}
      <rect width={W} height={H} fill="oklch(0.14 0.005 260)" rx={16} />

      {/* Labels */}
      <text x={boxW / 2 + 20} y={22} fontSize={10} fill="oklch(0.55 0.01 260)" textAnchor="middle" fontWeight="600" letterSpacing="0.08em">
        SEMIFINALS
      </text>
      <text x={W / 2 + 20 + boxW / 2} y={22} fontSize={10} fill="oklch(0.55 0.01 260)" textAnchor="middle" fontWeight="600" letterSpacing="0.08em">
        CHAMPIONSHIP
      </text>

      {/* SF 1 */}
      <TeamBox x={20} y={sf1y}           team={BRACKET_GAMES[0].team1} score={BRACKET_GAMES[0].score1} isWinner={BRACKET_GAMES[0].winner === "team1"} />
      <TeamBox x={20} y={sf1y + boxH + gap} team={BRACKET_GAMES[0].team2} score={BRACKET_GAMES[0].score2} isWinner={BRACKET_GAMES[0].winner === "team2"} />

      {/* SF 2 */}
      <TeamBox x={20} y={sf2y}              team={BRACKET_GAMES[1].team1} score={BRACKET_GAMES[1].score1} isWinner={BRACKET_GAMES[1].winner === "team1"} />
      <TeamBox x={20} y={sf2y + boxH + gap} team={BRACKET_GAMES[1].team2} score={BRACKET_GAMES[1].score2} isWinner={BRACKET_GAMES[1].winner === "team2"} />

      {/* Championship */}
      <TeamBox x={W / 2 + 20} y={chY}              team={BRACKET_GAMES[2].team1} score={BRACKET_GAMES[2].score1} isWinner={BRACKET_GAMES[2].winner === "team1"} />
      <TeamBox x={W / 2 + 20} y={chY + boxH + gap} team={BRACKET_GAMES[2].team2} score={BRACKET_GAMES[2].score2} isWinner={BRACKET_GAMES[2].winner === "team2"} />

      {/* Connector lines — SF1 → CH */}
      <path
        d={`M ${sfRight} ${sf1y + boxH / 2 + boxH / 2 + gap / 2} H ${(sfRight + chLeft) / 2} V ${chY + boxH / 2} H ${chLeft}`}
        fill="none" stroke="oklch(0.32 0.01 260)" strokeWidth={1.5}
      />
      {/* Connector — SF2 → CH */}
      <path
        d={`M ${sfRight} ${sf2y + boxH / 2 + boxH / 2 + gap / 2} H ${(sfRight + chLeft) / 2} V ${chY + boxH + gap + boxH / 2} H ${chLeft}`}
        fill="none" stroke="oklch(0.32 0.01 260)" strokeWidth={1.5}
      />

      {/* SF time labels */}
      <text x={20} y={sf1y + boxH * 2 + gap + 22} fontSize={10} fill="oklch(0.50 0.01 260)">
        {BRACKET_GAMES[0].time} · {BRACKET_GAMES[0].court}
      </text>
      <text x={20} y={sf2y + boxH * 2 + gap + 22} fontSize={10} fill="oklch(0.50 0.01 260)">
        {BRACKET_GAMES[1].time} · {BRACKET_GAMES[1].court}
      </text>
      {/* CH time label */}
      <text x={W / 2 + 20} y={chY + boxH * 2 + gap + 22} fontSize={10} fill="oklch(0.50 0.01 260)">
        {BRACKET_GAMES[2].time}
      </text>
    </svg>
  );
}

// ── Day accordion ──────────────────────────────────────────────────────────────

function DayAccordion({ day }: { day: DaySchedule }) {
  const [open, setOpen] = useState(true);

  const activityIcons: Record<string, React.ReactNode> = {
    bus:   <Car className="w-3.5 h-3.5" />,
    map:   <MapPin className="w-3.5 h-3.5" />,
    ball:  <Star className="w-3.5 h-3.5" />,
    food:  <Utensils className="w-3.5 h-3.5" />,
    hotel: <Hotel className="w-3.5 h-3.5" />,
    film:  <Film className="w-3.5 h-3.5" />,
    rest:  <Circle className="w-3.5 h-3.5" />,
    trophy:<Trophy className="w-3.5 h-3.5" />,
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-[15px] font-semibold">{day.day}</span>
          <span className="text-[13px] text-muted-foreground">{day.date}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              toast.success(`${day.day}'s schedule added to your calendar.`);
            }}
          >
            <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
            Add to calendar
          </Button>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="divide-y divide-border">
          {day.events.map((evt, i) => {
            if (evt.kind === "activity") {
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-[12px] text-muted-foreground w-20 shrink-0">{evt.time}</span>
                  <span className="text-muted-foreground shrink-0">{activityIcons[evt.icon] ?? <Circle className="w-3.5 h-3.5" />}</span>
                  <span className="text-[13px] text-foreground/80">{evt.label}</span>
                </div>
              );
            }
            const game = evt.data;
            return (
              <div key={game.id} className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[12px] text-muted-foreground w-20 shrink-0">{game.time}</span>
                  <ResultBadge result={game.result} />
                  <span className="text-[14px] font-semibold">vs. {game.opponent}</span>
                  {game.score && (
                    <span className="text-[13px] font-mono font-bold" style={{ color: game.result === "win" ? SUCCESS : DANGER }}>
                      {game.score}
                    </span>
                  )}
                  <span className="text-[12px] text-muted-foreground ml-auto">{game.court}</span>
                </div>
                {game.coachNotes && (
                  <p className="text-[12.5px] text-muted-foreground ml-[92px] leading-relaxed">
                    {game.coachNotes}
                  </p>
                )}
                {game.filmUrl && (
                  <a
                    href={game.filmUrl}
                    className="ml-[92px] inline-flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: PRIMARY }}
                  >
                    <Film className="w-3 h-3" />
                    Watch film · {game.clipCount} clips
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
                {game.result === "upcoming" && (
                  <div className="ml-[92px]">
                    <Badge style={{ background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY, border: `1px solid ${PRIMARY.replace(")", " / 0.30)")}` }}>
                      Upcoming
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Gear checklist ─────────────────────────────────────────────────────────────

function GearChecklist() {
  const [sections, setSections] = useState<GearSection[]>(GEAR_SECTIONS);

  function toggle(sectionIdx: number, itemId: string) {
    setSections((prev) =>
      prev.map((sec, si) =>
        si !== sectionIdx
          ? sec
          : {
              ...sec,
              items: sec.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              ),
            }
      )
    );
  }

  const total   = sections.reduce((a, s) => a + s.items.length, 0);
  const checked = sections.reduce((a, s) => a + s.items.filter((i) => i.checked).length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">{checked} / {total} items packed</span>
        {checked === total && total > 0 && (
          <span className="text-[12px] font-medium flex items-center gap-1" style={{ color: SUCCESS }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            All packed!
          </span>
        )}
      </div>
      {sections.map((section, si) => (
        <div key={si} className="flex flex-col gap-1">
          <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground px-1 mb-1">
            {section.heading}
          </div>
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle(si, item.id)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/40 transition-colors text-left"
            >
              {item.checked ? (
                <CheckSquare className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
              ) : (
                <Square className="w-4 h-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={`text-[13px] ${item.checked ? "line-through text-muted-foreground/50" : ""}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Tab type ───────────────────────────────────────────────────────────────────

type Tab = "overview" | "schedule" | "logistics" | "bracket" | "film";

// ── Main page ──────────────────────────────────────────────────────────────────

export function TournamentPage() {
  useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("overview");

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview",   label: "Overview"  },
    { id: "schedule",   label: "Schedule"  },
    { id: "logistics",  label: "Logistics" },
    { id: "bracket",    label: "Bracket"   },
    { id: "film",       label: "Film"      },
  ];

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="Team · Tournaments"
          title={TOURNAMENT.name}
          subtitle={`${TOURNAMENT.dates} · ${TOURNAMENT.venue} · Newark, NJ`}
          actions={
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1.5 rounded-full text-[13px] font-bold border"
                style={{
                  background: `${PRIMARY.replace(")", " / 0.10)")}`,
                  borderColor: `${PRIMARY.replace(")", " / 0.30)")}`,
                  color: PRIMARY,
                }}
              >
                {TOURNAMENT.record} Record
              </span>
            </div>
          }
        />

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 mb-6 border-b border-border overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Hero card */}
            <div
              className="rounded-2xl p-6 flex flex-col gap-4 border"
              style={{
                background: `linear-gradient(135deg, ${PRIMARY.replace(")", " / 0.10)")} 0%, ${WARNING.replace(")", " / 0.06)")} 100%)`,
                borderColor: `${PRIMARY.replace(")", " / 0.20)")}`,
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" style={{ color: WARNING }} />
                    <span className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Tournament</span>
                  </div>
                  <h2 className="text-2xl font-bold">{TOURNAMENT.name}</h2>
                  <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {TOURNAMENT.venue} · Newark, NJ
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {TOURNAMENT.dates}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-4xl font-black" style={{ color: PRIMARY }}>{TOURNAMENT.record}</div>
                  <div className="text-[12px] text-muted-foreground">Tournament Record</div>
                </div>
              </div>
              <div
                className="rounded-xl px-4 py-2.5 text-[13px] font-medium border"
                style={{
                  background: `${WARNING.replace(")", " / 0.12)")}`,
                  borderColor: `${WARNING.replace(")", " / 0.30)")}`,
                  color: WARNING,
                }}
              >
                ⚡ {TOURNAMENT.teamHighlight}
              </div>
            </div>

            {/* Pool play results */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <h3 className="text-[15px] font-semibold">Pool Play Results</h3>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {POOL_RESULTS.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <ResultBadge result={r.result} />
                    <span className="flex-1 text-[13px] font-medium">vs. {r.opponent}</span>
                    <span className="text-[13px] font-mono font-bold" style={{ color: r.result === "W" ? SUCCESS : DANGER }}>
                      {r.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roster attending */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">Traveling Roster</h3>
                <span className="text-[13px] text-muted-foreground">{TOURNAMENT.travelingPlayers} traveling</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROSTER_TRAVEL.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-medium"
                    style={
                      p.traveling
                        ? { background: `${SUCCESS.replace(")", " / 0.10)")}`, borderColor: `${SUCCESS.replace(")", " / 0.25)")}`, color: SUCCESS }
                        : { background: "var(--muted)", borderColor: "var(--border)", color: "var(--muted-foreground)" }
                    }
                  >
                    {p.traveling ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {p.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Key dates */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <h3 className="text-[15px] font-semibold">Key Dates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Check-in",   value: "Fri May 23 · 10 AM", icon: <MapPin className="w-4 h-4" /> },
                  { label: "First Game", value: "Fri May 23 · 12 PM", icon: <Star className="w-4 h-4" />   },
                  { label: "Checkout",   value: "Sun May 25 · 12 PM", icon: <Hotel className="w-4 h-4" />  },
                ].map((kd) => (
                  <div key={kd.label} className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
                    <span className="text-muted-foreground">{kd.icon}</span>
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{kd.label}</div>
                      <div className="text-[13px] font-semibold">{kd.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TABS.filter((t) => t.id !== "overview").map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors text-[13px] font-medium"
                >
                  {t.label}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground rotate-[-90deg]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {tab === "schedule" && (
          <div className="flex flex-col gap-5">
            {SCHEDULE.map((day) => (
              <DayAccordion key={day.day} day={day} />
            ))}
          </div>
        )}

        {/* ── LOGISTICS ── */}
        {tab === "logistics" && (
          <div className="flex flex-col gap-6">
            {/* Hotel block */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4" style={{ color: PRIMARY }} />
                <h3 className="text-[15px] font-semibold">Hotel Block</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Hotel</div>
                  <div className="text-[14px] font-semibold">{HOTEL.name}</div>
                  <div className="text-[12px] text-muted-foreground">{HOTEL.address}</div>
                  <a href={`tel:${HOTEL.phone}`} className="text-[12px]" style={{ color: PRIMARY }}>{HOTEL.phone}</a>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Group rate</span>
                    <span className="font-semibold">{HOTEL.groupRate}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Block deadline</span>
                    <span className="font-semibold text-danger" style={{ color: DANGER }}>{HOTEL.blockDeadline}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Confirmation code</span>
                    <code className="text-[12px] font-mono font-bold px-2 py-0.5 rounded bg-muted">{HOTEL.confirmationCode}</code>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">{HOTEL.checkIn}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">{HOTEL.checkOut}</span>
                  </div>
                </div>
              </div>
              <a
                href={HOTEL.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-[13px] font-medium transition-colors hover:bg-muted/40"
                style={{ borderColor: `${PRIMARY.replace(")", " / 0.30)")}`, color: PRIMARY }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Book Room (use code {HOTEL.confirmationCode})
              </a>
            </div>

            {/* Transportation */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" style={{ color: PRIMARY }} />
                <h3 className="text-[15px] font-semibold">Transportation</h3>
              </div>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {TRANSPORTATION.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar initials={t.initials} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.role} · {t.seats}</div>
                    </div>
                    <div className="text-[12px] text-muted-foreground text-right">{t.departs}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gear packing list */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: PRIMARY }} />
                <h3 className="text-[15px] font-semibold">Tournament Packing List</h3>
              </div>
              <GearChecklist />
            </div>

            {/* Per diem */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{ color: SUCCESS }} />
                <h3 className="text-[15px] font-semibold">Per Diem & Meal Stipend</h3>
              </div>
              <div className="text-[13.5px] text-foreground/80 leading-relaxed">
                Each player will receive <strong>$25/day</strong> for meals (cash, distributed by Coach Williams at departure). Receipts are not required. The program covers breakfast on Saturday via team meal. Players are responsible for all other meals within their stipend.
              </div>
            </div>

            {/* Emergency contacts */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: DANGER }} />
                <h3 className="text-[15px] font-semibold">Emergency Contacts</h3>
              </div>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {EMERGENCY_CONTACTS.map((ec, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{ec.label}</div>
                      <div className="text-[13px] font-medium">{ec.name}</div>
                      {ec.note && <div className="text-[11px] text-muted-foreground">{ec.note}</div>}
                    </div>
                    <a href={`tel:${ec.phone}`} className="text-[13px] font-mono" style={{ color: PRIMARY }}>{ec.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BRACKET ── */}
        {tab === "bracket" && (
          <div className="flex flex-col gap-6">
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">Single Elimination Bracket</h3>
                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: PRIMARY }}>
                  <div className="w-3 h-3 rounded-sm" style={{ background: `${PRIMARY.replace(")", " / 0.25)")}` }} />
                  Barnegat Bengals
                </div>
              </div>
              <TournamentBracket />
            </div>

            {/* Pool play context */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <h3 className="text-[15px] font-semibold">Pool Play — Round Robin</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Four teams competed in round-robin pool play on Friday. The top two teams advanced to the semifinal bracket on Saturday night. Barnegat went 2–1 in pool play, earning the #1 seed.
              </p>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {POOL_RESULTS.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <ResultBadge result={r.result} />
                    <span className="flex-1 text-[13px] font-medium">vs. {r.opponent}</span>
                    <span className="text-[13px] font-mono font-bold" style={{ color: r.result === "W" ? SUCCESS : DANGER }}>
                      {r.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FILM ── */}
        {tab === "film" && (
          <div className="flex flex-col gap-4">
            <p className="text-[13.5px] text-muted-foreground">
              Film sessions are created automatically after each completed game. Clips are tagged by play type and available for review.
            </p>
            {FILM_CARDS.map((card) => (
              <div
                key={card.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {card.completed ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
                      ) : (
                        <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-[15px] font-semibold">vs. {card.opponent}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground ml-6">
                      <Calendar className="w-3 h-3" />
                      {card.date}
                      {card.clipCount && (
                        <>
                          <span>·</span>
                          <Film className="w-3 h-3" />
                          {card.clipCount} clips
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[13px] font-bold px-3 py-1 rounded-full"
                    style={
                      card.score.startsWith("W")
                        ? { background: `${SUCCESS.replace(")", " / 0.12)")}`, color: SUCCESS }
                        : card.score.startsWith("L")
                        ? { background: `${DANGER.replace(")", " / 0.12)")}`, color: DANGER }
                        : { background: `${PRIMARY.replace(")", " / 0.10)")}`, color: PRIMARY }
                    }
                  >
                    {card.score}
                  </span>
                </div>

                {card.coachNotes && (
                  <div className="flex items-start gap-2 bg-muted/40 rounded-xl px-4 py-2.5">
                    <Clipboard className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{card.coachNotes}</p>
                  </div>
                )}

                {card.filmUrl ? (
                  <a
                    href={card.filmUrl}
                    className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-medium transition-colors hover:bg-muted/40"
                    style={{ borderColor: `${PRIMARY.replace(")", " / 0.30)")}`, color: PRIMARY }}
                  >
                    <Film className="w-4 h-4" />
                    Watch Film Session
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>
                ) : (
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-[13px] text-muted-foreground"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Clock className="w-4 h-4 text-muted-foreground/50" />
                    Film session will be created after this game.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default TournamentPage;
