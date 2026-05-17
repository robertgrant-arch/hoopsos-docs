import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

type VdvStatus = "verified" | "close" | "developing";
type SortKey = "vdv" | "improvement" | "alpha";

interface PlayerRow {
  id: number;
  name: string;
  position: string;
  vdv: VdvStatus;
  keyImprovement: string;
  delta: number;
  coachNote: string;
}

interface RecruitingRow {
  id: number;
  player: string;
  school: string;
  division: string;
  status: "Active interest" | "Offered" | "Committed";
}

interface BehaviorMetric {
  label: string;
  current: number;
  previous: number;
  unit: string;
  maxVal: number;
}

const PLAYERS: PlayerRow[] = [
  { id: 1,  name: "Devon Anderson",  position: "PG", vdv: "verified",    keyImprovement: "Ball Handling +2.8",     delta: 2.8, coachNote: "Breakout player this season. Film-ready." },
  { id: 2,  name: "Marcus Williams", position: "SG", vdv: "verified",    keyImprovement: "Shooting +2.1",          delta: 2.1, coachNote: "Catch-and-shoot mechanics transformed." },
  { id: 3,  name: "Jordan Thomas",   position: "SF", vdv: "close",       keyImprovement: "Defense +1.9",           delta: 1.9, coachNote: "One more assessment cycle away from VDV." },
  { id: 4,  name: "Caleb Harris",    position: "PF", vdv: "verified",    keyImprovement: "Finishing +2.3",         delta: 2.3, coachNote: "Most improved finisher in the program." },
  { id: 5,  name: "Noah Jackson",    position: "C",  vdv: "developing",  keyImprovement: "Post Moves +1.2",        delta: 1.2, coachNote: "Consistent gains — needs IQ work next season." },
  { id: 6,  name: "Elijah Brown",    position: "PG", vdv: "verified",    keyImprovement: "IQ +2.0",               delta: 2.0, coachNote: "Decision-making is elite for the level." },
  { id: 7,  name: "Isaiah Davis",    position: "SG", vdv: "close",       keyImprovement: "Ball Handling +1.7",     delta: 1.7, coachNote: "Crossover is legit — needs film confirmation." },
  { id: 8,  name: "Malik Johnson",   position: "SF", vdv: "developing",  keyImprovement: "Defense +1.1",           delta: 1.1, coachNote: "Needs more observation frequency next season." },
  { id: 9,  name: "Jaylen Carter",   position: "PF", vdv: "verified",    keyImprovement: "Shooting +1.8",          delta: 1.8, coachNote: "Converted to spot-up role — thriving." },
  { id: 10, name: "Trevon Moore",    position: "C",  vdv: "developing",  keyImprovement: "Finishing +0.9",         delta: 0.9, coachNote: "Long-term project — showing character." },
  { id: 11, name: "Donovan Lee",     position: "PG", vdv: "verified",    keyImprovement: "IQ +1.6",               delta: 1.6, coachNote: "Reads help defense as well as anyone." },
  { id: 12, name: "Cameron White",   position: "SG", vdv: "close",       keyImprovement: "Defense +1.5",           delta: 1.5, coachNote: "Lateral quickness unlocked his defensive potential." },
  { id: 13, name: "Andre Mitchell",  position: "SF", vdv: "verified",    keyImprovement: "Ball Handling +1.9",     delta: 1.9, coachNote: "Added a legitimate off-dribble game this season." },
  { id: 14, name: "Darius Scott",    position: "PF", vdv: "developing",  keyImprovement: "Post Moves +1.0",        delta: 1.0, coachNote: "Post foundation is solid — add touch next season." },
  { id: 15, name: "Quan Parker",     position: "C",  vdv: "close",       keyImprovement: "Finishing +1.6",         delta: 1.6, coachNote: "Basket touch improving rapidly." },
  { id: 16, name: "Tre Williams",    position: "PG", vdv: "verified",    keyImprovement: "Shooting +2.2",          delta: 2.2, coachNote: "Pull-up jumper became reliable this season." },
  { id: 17, name: "Kofi Asante",     position: "SG", vdv: "developing",  keyImprovement: "IQ +0.8",               delta: 0.8, coachNote: "Basketball understanding growing weekly." },
  { id: 18, name: "Luke Reeves",     position: "SF", vdv: "close",       keyImprovement: "Ball Handling +1.4",     delta: 1.4, coachNote: "Handle is catching up to his athleticism." },
  { id: 19, name: "Sam Porter",      position: "PF", vdv: "verified",    keyImprovement: "Defense +2.0",           delta: 2.0, coachNote: "Defensive anchor. Best season in the program." },
  { id: 20, name: "Zion Wallace",    position: "C",  vdv: "developing",  keyImprovement: "Finishing +0.7",         delta: 0.7, coachNote: "Raw but trainable — high upside." },
  { id: 21, name: "Amir Hassan",     position: "PG", vdv: "verified",    keyImprovement: "IQ +1.8",               delta: 1.8, coachNote: "Floor general in the making." },
  { id: 22, name: "Cole Nash",       position: "SG", vdv: "close",       keyImprovement: "Shooting +1.3",          delta: 1.3, coachNote: "Catch-and-shoot improving — needs one more data cycle." },
  { id: 23, name: "Ben Torres",      position: "SF", vdv: "developing",  keyImprovement: "Defense +1.0",           delta: 1.0, coachNote: "Switched to wing defense mid-season — promising." },
];

const RECRUITING_TABLE: RecruitingRow[] = [
  { id: 1,  player: "Devon Anderson",  school: "Big Ten University",      division: "D1",  status: "Offered" },
  { id: 2,  player: "Devon Anderson",  school: "ACC Program",             division: "D1",  status: "Active interest" },
  { id: 3,  player: "Marcus Williams", school: "Mountain West School",    division: "D1",  status: "Active interest" },
  { id: 4,  player: "Caleb Harris",    school: "Big East University",     division: "D1",  status: "Committed" },
  { id: 5,  player: "Elijah Brown",    school: "Pac-12 Program",          division: "D1",  status: "Active interest" },
  { id: 6,  player: "Elijah Brown",    school: "Conference USA School",   division: "D1",  status: "Offered" },
  { id: 7,  player: "Tre Williams",    school: "Mid-Major Program",       division: "D1",  status: "Active interest" },
  { id: 8,  player: "Sam Porter",      school: "Sun Belt University",     division: "D1",  status: "Active interest" },
  { id: 9,  player: "Sam Porter",      school: "Southern Conference",     division: "D2",  status: "Active interest" },
  { id: 10, player: "Amir Hassan",     school: "MAAC University",         division: "D1",  status: "Offered" },
  { id: 11, player: "Jaylen Carter",   school: "Horizon League School",   division: "D1",  status: "Active interest" },
  { id: 12, player: "Andre Mitchell",  school: "WAC Program",             division: "D1",  status: "Active interest" },
];

const BEHAVIOR_METRICS: BehaviorMetric[] = [
  { label: "Assessment frequency",      current: 3.4, previous: 2.1, unit: "/player/mo", maxVal: 5 },
  { label: "Observation specificity",   current: 68,  previous: 54,  unit: "%",          maxVal: 100 },
  { label: "IDP goal review rate",      current: 71,  previous: 58,  unit: "%",          maxVal: 100 },
  { label: "Film annotation rate",      current: 61,  previous: 44,  unit: "%",          maxVal: 100 },
];

const DEFAULT_GOALS = [
  "Reach 75% VDV rate",
  "Improve IDP specificity to 80%",
  "Get 90% of players film-corroborated",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroMetric({
  value,
  label,
  sub,
  color,
}: {
  value: string;
  label: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 900, color: color ?? PRIMARY, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: MUTED }}>{sub}</div>}
    </div>
  );
}

function VdvBadge({ status }: { status: VdvStatus }) {
  const map: Record<VdvStatus, { label: string; color: string }> = {
    verified:   { label: "VDV ✓", color: SUCCESS },
    close:      { label: "1 cycle", color: WARNING },
    developing: { label: "—",      color: MUTED },
  };
  const { label, color } = map[status];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </span>
  );
}

function RowBg(status: VdvStatus): string {
  if (status === "verified") return "oklch(0.97 0.02 140)";
  if (status === "close")    return "oklch(0.97 0.03 75)";
  return "var(--bg-surface)";
}

// SVG horizontal behavior bar (two bars: previous + current)
function BehaviorBarChart() {
  const W = 640;
  const BAR_H = 14;
  const ROW_H = 60;
  const PAD_LEFT = 200;
  const PAD_RIGHT = 80;
  const innerW = W - PAD_LEFT - PAD_RIGHT;

  return (
    <svg viewBox={`0 0 ${W} ${BEHAVIOR_METRICS.length * ROW_H + 20}`} width="100%" style={{ overflow: "visible" }}>
      {BEHAVIOR_METRICS.map((m, i) => {
        const y = 20 + i * ROW_H;
        const prevW = (m.previous / m.maxVal) * innerW;
        const currW = (m.current / m.maxVal) * innerW;
        const delta = m.current - m.previous;
        const displayCurrent = m.unit === "%" ? `${m.current}%` : `${m.current}${m.unit}`;
        const displayPrev = m.unit === "%" ? `${m.previous}%` : `${m.previous}${m.unit}`;

        return (
          <g key={i}>
            {/* Label */}
            <text x={PAD_LEFT - 12} y={y + 10} textAnchor="end" fontSize={12} fill="var(--text-primary)" fontWeight={600}>
              {m.label}
            </text>

            {/* Previous bar */}
            <rect x={PAD_LEFT} y={y} width={prevW} height={BAR_H} rx={4} fill={MUTED} opacity={0.4} />
            <text x={PAD_LEFT + prevW + 6} y={y + 10} fontSize={11} fill={MUTED}>
              {displayPrev} prev.
            </text>

            {/* Current bar */}
            <rect x={PAD_LEFT} y={y + BAR_H + 6} width={currW} height={BAR_H} rx={4} fill={SUCCESS} opacity={0.85} />
            <text x={PAD_LEFT + currW + 6} y={y + BAR_H + 16} fontSize={11} fill={SUCCESS} fontWeight={700}>
              {displayCurrent}
            </text>

            {/* Delta badge */}
            <text
              x={PAD_LEFT + innerW + 10}
              y={y + BAR_H + 6}
              fontSize={12}
              fill={SUCCESS}
              fontWeight={800}
            >
              +{delta}{m.unit === "%" ? "%" : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachSeasonReportPage() {
  const [sortKey, setSortKey] = useState<SortKey>("vdv");
  const [goals, setGoals] = useState<string[]>(DEFAULT_GOALS.slice());

  const sorted = [...PLAYERS].sort((a, b) => {
    if (sortKey === "vdv") {
      const order: Record<VdvStatus, number> = { verified: 0, close: 1, developing: 2 };
      return order[a.vdv] - order[b.vdv];
    }
    if (sortKey === "improvement") return b.delta - a.delta;
    return a.name.localeCompare(b.name);
  });

  const vdvCount = PLAYERS.filter((p) => p.vdv === "verified").length;
  const vdvRate = Math.round((vdvCount / PLAYERS.length) * 100);

  const handleSaveGoals = () => {
    toast.success("Season goals saved — they'll appear on your effectiveness dashboard.");
  };

  const uniquePlayers = Array.from(new Set(RECRUITING_TABLE.map((r) => r.player)));
  const uniqueSchools = Array.from(new Set(RECRUITING_TABLE.map((r) => r.school)));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Coach Portfolio"
        title="Season Impact Report"
        subtitle="2024–2025 — Elevation Basketball · 16U Premier"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => toast("Printing season report...")}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: 12.5,
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              Print
            </button>
            <button
              onClick={() => toast("Generating share link...")}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: 12.5,
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              Share
            </button>
            <button
              onClick={() => toast("Exporting PDF report...")}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                background: PRIMARY,
                color: "#fff",
                fontWeight: 700,
                fontSize: 12.5,
                border: "none",
                cursor: "pointer",
              }}
            >
              Export PDF
            </button>
          </div>
        }
      />

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 0 80px", display: "flex", flexDirection: "column", gap: 56 }}>

        {/* ── Section 1: Season Summary Hero ── */}
        <section>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 4px" }}>
              2024–2025 Season Impact Report
            </h2>
            <div style={{ fontSize: 13.5, color: MUTED }}>
              Coach Profile · Elevation Basketball · 16U Premier · Sep 14, 2024 – Apr 28, 2025
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <HeroMetric value="23" label="Players Developed" sub="Full season roster" color={PRIMARY} />
            <HeroMetric
              value={`${vdvRate}%`}
              label="VDV Rate"
              sub="5% above program average"
              color={SUCCESS}
            />
            <HeroMetric value="+1.4" label="Avg Skill Delta" sub="Per player across all skills" color={WARNING} />
            <HeroMetric value="12" label="College Inquiries Generated" sub="From 9 different programs" color={PRIMARY} />
          </div>
        </section>

        {/* ── Section 2: The Development Story ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            The Development Story
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 20 }}>
            This season in your own words — and in the data.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Opening metric */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "20px 24px",
                display: "flex",
                gap: 24,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {[
                { num: "23", label: "Players" },
                { num: "14", label: "Weeks" },
                { num: "312", label: "Assessments" },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: PRIMARY }}>{stat.num}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{stat.label}</div>
                </div>
              ))}
              <div style={{ width: 1, height: 48, background: "var(--border)", flexShrink: 0 }} />
              <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                A full season of verified player development data.
              </div>
            </div>

            {/* Most improved callout */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: `2px solid ${SUCCESS}`,
                borderRadius: 12,
                padding: "18px 24px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: SUCCESS, marginBottom: 6 }}>
                Most Improved Player
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                Devon Anderson
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>
                Ball Handling +2.8 · Defensive IQ +2.1 · VDV Verified ✓
              </div>
            </div>

            {/* Signature skill */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: `2px solid ${PRIMARY}`,
                borderRadius: 12,
                padding: "18px 24px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: PRIMARY, marginBottom: 6 }}>
                Your Signature Skill This Season
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                Defensive Positioning
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>
                Your players improved defense faster than any other skill category — <strong>0.31 points/week</strong> vs. platform avg of 0.19.
              </div>
            </div>

            {/* Prose narrative */}
            <div
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "18px 22px",
                fontSize: 14,
                lineHeight: 1.8,
                color: "var(--text-primary)",
                fontStyle: "italic",
              }}
            >
              "This was a season defined by defensive investment. Your consistent focus on stance and positioning produced measurable results across your roster — players who struggled to contain ball handlers in September were running disciplined help rotations by March. The data reflects what you poured into film sessions, observation cadence, and individual feedback. This kind of coaching shows up in verified numbers."
            </div>
          </div>
        </section>

        {/* ── Section 3: Player Outcomes Grid ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>
                Player Outcomes
              </h2>
              <div style={{ fontSize: 13, color: MUTED }}>All 23 players — full season results</div>
            </div>

            {/* Sort controls */}
            <div style={{ display: "flex", gap: 6 }}>
              {([
                { key: "vdv",         label: "VDV Status" },
                { key: "improvement", label: "Improvement" },
                { key: "alpha",       label: "A–Z" },
              ] as { key: SortKey; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 7,
                    background: sortKey === opt.key ? PRIMARY : "var(--bg-surface)",
                    color: sortKey === opt.key ? "#fff" : MUTED,
                    fontWeight: 600,
                    fontSize: 11.5,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 60px 80px 140px 1fr",
                padding: "10px 16px",
                background: "var(--bg-base)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {["Player", "Pos", "VDV", "Key Stat", "Coach Note"].map((h) => (
                <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {h}
                </div>
              ))}
            </div>

            {sorted.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 60px 80px 140px 1fr",
                  padding: "11px 16px",
                  background: RowBg(p.vdv),
                  borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{p.position}</div>
                <VdvBadge status={p.vdv} />
                <div style={{ fontSize: 12.5, fontWeight: 600, color: p.delta >= 2 ? SUCCESS : "var(--text-primary)" }}>
                  {p.keyImprovement}
                </div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{p.coachNote}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {[
              { color: "oklch(0.97 0.02 140)", label: "VDV Verified" },
              { color: "oklch(0.97 0.03 75)",  label: "1 Cycle Away" },
              { color: "var(--bg-surface)",     label: "Developing" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: "1px solid var(--border)" }} />
                <span style={{ fontSize: 11, color: MUTED }}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Coaching Behavior Analysis ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Coaching Behavior Analysis
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 16 }}>
            How your coaching behaviors changed this season vs. last.
          </p>

          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px 28px" }}>
            <BehaviorBarChart />

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 8, borderRadius: 3, background: MUTED, opacity: 0.4 }} />
                <span style={{ fontSize: 11, color: MUTED }}>Previous season</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 8, borderRadius: 3, background: SUCCESS, opacity: 0.85 }} />
                <span style={{ fontSize: 11, color: MUTED }}>This season</span>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: "12px 16px",
                background: "var(--bg-base)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: SUCCESS,
              }}
            >
              You improved in all 4 coaching behavior dimensions this season.
            </div>
          </div>
        </section>

        {/* ── Section 5: Recruiting Impact ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Recruiting Impact
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 16 }}>
            Your program's verified data generated interest from {uniqueSchools.length} different college programs this season.
          </p>

          {/* Hero stats row */}
          <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { value: "12", label: "College Inquiries" },
              { value: String(uniquePlayers.length), label: "Active Recruiting Profiles" },
              { value: String(uniqueSchools.length), label: "Programs Interested" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "16px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 900, color: PRIMARY }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 80px 140px",
                padding: "10px 16px",
                background: "var(--bg-base)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {["Player", "School", "Division", "Status"].map((h) => (
                <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {h}
                </div>
              ))}
            </div>

            {RECRUITING_TABLE.map((row, i) => {
              const statusColor =
                row.status === "Committed" ? SUCCESS :
                row.status === "Offered" ? PRIMARY :
                WARNING;

              return (
                <div
                  key={row.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.5fr 80px 140px",
                    padding: "10px 16px",
                    background: "var(--bg-surface)",
                    borderBottom: i < RECRUITING_TABLE.length - 1 ? "1px solid var(--border)" : "none",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{row.player}</div>
                  <div style={{ fontSize: 12.5, color: MUTED }}>{row.school}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{row.division}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{row.status}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 6: Next Season Goals ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Next Season Goals
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 16 }}>
            Set your targets for 2025–2026. These will appear on your effectiveness dashboard.
          </p>

          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {goals.map((goal, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: PRIMARY,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <textarea
                  value={goal}
                  onChange={(e) => {
                    const updated = [...goals];
                    updated[i] = e.target.value;
                    setGoals(updated);
                  }}
                  rows={1}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    resize: "none",
                    outline: "none",
                    lineHeight: 1.5,
                  }}
                />
              </div>
            ))}

            <button
              onClick={handleSaveGoals}
              style={{
                alignSelf: "flex-start",
                marginTop: 8,
                padding: "11px 24px",
                borderRadius: 9,
                background: PRIMARY,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13.5,
                border: "none",
                cursor: "pointer",
              }}
            >
              Save Goals
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
