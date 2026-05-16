/**
 * DevelopmentSynthesisPage — Cross-data development synthesis view.
 * Routes: /app/coach/recruiting/synthesis
 *         /app/coach/recruiting/synthesis/:playerId
 */
import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Copy, ArrowUp, ArrowRight, ArrowDown, ChevronDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type RecruitingPlayer = {
  id: string;
  name: string;
  position: string;
  gradYear: number;
  height: string;
  programName: string;
  teamTier: string;
  skillScores: Record<string, number>;
  skillDeltas: Record<string, number>;
  overallTier: "Emerging" | "Developing" | "Advanced" | "Elite";
  assessmentCount: number;
  filmClipCount: number;
  badgeCount: number;
  coachabilityIndex: number;
  attendanceRate: number;
  idpOnTrack: boolean;
  profileSlug: string;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

const SKILL_LABELS: Record<string, string> = {
  ball_handling: "Ball Handling",
  shooting:      "Shooting",
  finishing:     "Finishing",
  defense:       "Defense",
  footwork:      "Footwork",
  iq_reads:      "IQ / Reads",
  athleticism:   "Athleticism",
  conditioning:  "Conditioning",
};
const SKILL_KEYS = Object.keys(SKILL_LABELS);

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const MOCK_PLAYERS: RecruitingPlayer[] = [
  {
    id: "p1", name: "Jordan Mills", position: "PG", gradYear: 2027, height: "6'1\"",
    programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 8.4, shooting: 7.2, finishing: 7.8, defense: 8.1, footwork: 7.5, iq_reads: 8.7, athleticism: 7.9, conditioning: 8.2 },
    skillDeltas: { ball_handling: 0.6, shooting: 0.4, finishing: 0.3, defense: 0.8, footwork: 0.2, iq_reads: 0.9, athleticism: 0.1, conditioning: 0.5 },
    overallTier: "Elite", assessmentCount: 14, filmClipCount: 22, badgeCount: 5,
    coachabilityIndex: 9.1, attendanceRate: 97, idpOnTrack: true, profileSlug: "jordan-mills",
  },
  {
    id: "p2", name: "Marcus Webb", position: "SG", gradYear: 2027, height: "6'3\"",
    programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 7.1, shooting: 8.6, finishing: 7.4, defense: 7.0, footwork: 7.2, iq_reads: 7.5, athleticism: 8.3, conditioning: 7.8 },
    skillDeltas: { ball_handling: 0.2, shooting: 0.9, finishing: 0.5, defense: 0.3, footwork: 0.4, iq_reads: 0.6, athleticism: 0.7, conditioning: 0.4 },
    overallTier: "Advanced", assessmentCount: 11, filmClipCount: 18, badgeCount: 3,
    coachabilityIndex: 8.4, attendanceRate: 93, idpOnTrack: true, profileSlug: "marcus-webb",
  },
  {
    id: "p3", name: "Devon Price", position: "SF", gradYear: 2026, height: "6'5\"",
    programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 6.8, shooting: 7.4, finishing: 8.2, defense: 7.9, footwork: 8.0, iq_reads: 7.2, athleticism: 8.5, conditioning: 8.1 },
    skillDeltas: { ball_handling: 0.3, shooting: 0.5, finishing: 0.7, defense: 0.4, footwork: 0.9, iq_reads: 0.2, athleticism: 0.6, conditioning: 0.3 },
    overallTier: "Advanced", assessmentCount: 9, filmClipCount: 14, badgeCount: 2,
    coachabilityIndex: 7.9, attendanceRate: 89, idpOnTrack: false, profileSlug: "devon-price",
  },
  {
    id: "p4", name: "Isaiah Thomas", position: "PF", gradYear: 2027, height: "6'7\"",
    programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 6.2, shooting: 6.8, finishing: 8.1, defense: 8.4, footwork: 7.8, iq_reads: 7.0, athleticism: 8.0, conditioning: 7.5 },
    skillDeltas: { ball_handling: 0.4, shooting: 0.3, finishing: 0.8, defense: 0.7, footwork: 0.5, iq_reads: 0.3, athleticism: 0.4, conditioning: 0.6 },
    overallTier: "Advanced", assessmentCount: 8, filmClipCount: 11, badgeCount: 2,
    coachabilityIndex: 8.2, attendanceRate: 91, idpOnTrack: true, profileSlug: "isaiah-thomas",
  },
  {
    id: "p5", name: "Cameron Lee", position: "C", gradYear: 2027, height: "6'9\"",
    programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 5.5, shooting: 5.9, finishing: 7.8, defense: 8.7, footwork: 7.4, iq_reads: 6.8, athleticism: 7.9, conditioning: 7.2 },
    skillDeltas: { ball_handling: 0.1, shooting: 0.2, finishing: 0.6, defense: 1.1, footwork: 0.7, iq_reads: 0.4, athleticism: 0.3, conditioning: 0.5 },
    overallTier: "Developing", assessmentCount: 7, filmClipCount: 9, badgeCount: 1,
    coachabilityIndex: 8.8, attendanceRate: 95, idpOnTrack: true, profileSlug: "cameron-lee",
  },
  {
    id: "p6", name: "Tyler Brooks", position: "SG", gradYear: 2028, height: "6'2\"",
    programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 7.4, shooting: 7.8, finishing: 7.1, defense: 6.9, footwork: 7.0, iq_reads: 7.3, athleticism: 7.6, conditioning: 7.4 },
    skillDeltas: { ball_handling: 0.5, shooting: 0.8, finishing: 0.4, defense: 0.2, footwork: 0.3, iq_reads: 0.5, athleticism: 0.4, conditioning: 0.3 },
    overallTier: "Developing", assessmentCount: 6, filmClipCount: 8, badgeCount: 1,
    coachabilityIndex: 7.5, attendanceRate: 87, idpOnTrack: false, profileSlug: "tyler-brooks",
  },
  {
    id: "p7", name: "Andre Johnson", position: "PG", gradYear: 2027, height: "5'11\"",
    programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 8.0, shooting: 7.0, finishing: 7.3, defense: 7.6, footwork: 7.2, iq_reads: 8.2, athleticism: 7.4, conditioning: 8.0 },
    skillDeltas: { ball_handling: 0.7, shooting: 0.3, finishing: 0.4, defense: 0.5, footwork: 0.3, iq_reads: 0.8, athleticism: 0.2, conditioning: 0.6 },
    overallTier: "Advanced", assessmentCount: 10, filmClipCount: 16, badgeCount: 3,
    coachabilityIndex: 8.9, attendanceRate: 96, idpOnTrack: true, profileSlug: "andre-johnson",
  },
  {
    id: "p8", name: "Darius King", position: "SF", gradYear: 2026, height: "6'4\"",
    programName: "Texas Elite 17U", teamTier: "AAU Premier",
    skillScores: { ball_handling: 6.5, shooting: 6.8, finishing: 7.6, defense: 7.1, footwork: 7.8, iq_reads: 6.9, athleticism: 8.2, conditioning: 7.7 },
    skillDeltas: { ball_handling: 0.2, shooting: 0.1, finishing: 0.5, defense: 0.3, footwork: 0.8, iq_reads: 0.2, athleticism: 0.5, conditioning: 0.4 },
    overallTier: "Emerging", assessmentCount: 5, filmClipCount: 7, badgeCount: 0,
    coachabilityIndex: 7.2, attendanceRate: 82, idpOnTrack: false, profileSlug: "darius-king",
  },
];

// Film clip skill theme counts per player (simulated)
type FilmTheme = { skill: string; clipCount: number };
function filmThemesForPlayer(p: RecruitingPlayer): FilmTheme[] {
  const sorted = SKILL_KEYS
    .map(k => ({ skill: k, score: p.skillScores[k] ?? 0, delta: p.skillDeltas[k] ?? 0 }))
    .sort((a, b) => (b.score + b.delta) - (a.score + a.delta))
    .slice(0, 4);
  return sorted.map((s, i) => ({ skill: s.skill, clipCount: Math.max(1, Math.round(p.filmClipCount * [0.28, 0.23, 0.18, 0.14][i]!)) }));
}

// Observation keyword themes per player (simulated)
type ObsTheme = { keyword: string; frequency: number };
function obsThemesForPlayer(p: RecruitingPlayer): ObsTheme[] {
  const map: Record<string, string[]> = {
    ball_handling: ["ball pressure", "dribble reads", "handle"],
    shooting:      ["catch-and-shoot", "pull-up", "footwork"],
    finishing:     ["layup package", "contact", "finishing"],
    defense:       ["on-ball D", "help-side", "positioning"],
    footwork:      ["footwork", "stance", "drop step"],
    iq_reads:      ["court vision", "reads", "decision-making"],
    athleticism:   ["burst", "athleticism", "explosiveness"],
    conditioning:  ["conditioning", "motor", "effort"],
  };
  const top3Skills = SKILL_KEYS
    .map(k => ({ k, v: p.skillScores[k] ?? 0 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3);
  return top3Skills.flatMap(({ k }, i) =>
    (map[k] ?? []).slice(0, 1).map(kw => ({ keyword: kw, frequency: Math.max(2, 8 - i * 2) }))
  );
}

// Cohort percentile (simulated)
function cohortPercentile(p: RecruitingPlayer): number {
  const avgDelta = Object.values(p.skillDeltas).reduce((s, v) => s + v, 0) / 8;
  switch (p.overallTier) {
    case "Elite":      return 90 + Math.round(avgDelta * 5);
    case "Advanced":   return 65 + Math.round(avgDelta * 10);
    case "Developing": return 40 + Math.round(avgDelta * 10);
    case "Emerging":   return 20 + Math.round(avgDelta * 8);
  }
}

// Film corroboration % for a skill
function filmCorroboration(p: RecruitingPlayer, skill: string): number {
  const score = p.skillScores[skill] ?? 5;
  const delta = p.skillDeltas[skill] ?? 0;
  const hasFilm = delta > 0.3;
  if (!hasFilm) return 0;
  return Math.min(100, Math.round((score / 10) * 80 + delta * 15));
}

function corroborationLabel(p: RecruitingPlayer, skill: string): { label: string; color: string } {
  const delta = p.skillDeltas[skill] ?? 0;
  const filmClips = Math.round(p.filmClipCount * 0.2);
  if (filmClips === 0) return { label: "No film evidence", color: "oklch(0.45 0.01 260)" };
  if (delta >= 0.5) return { label: "Strong", color: SUCCESS };
  if (delta >= 0.2) return { label: "Weak", color: WARNING };
  return { label: "No film evidence", color: "oklch(0.45 0.01 260)" };
}

// Synthesis narrative (auto-generated from data)
function synthesisNarrative(p: RecruitingPlayer): string {
  const topSkill = SKILL_KEYS.map(k => ({ k, v: p.skillScores[k] ?? 0 })).sort((a, b) => b.v - a.v)[0]!;
  const topDelta = SKILL_KEYS.map(k => ({ k, d: p.skillDeltas[k] ?? 0 })).sort((a, b) => b.d - a.d)[0]!;
  const pct = cohortPercentile(p);
  return `${p.name}'s development data tells a coherent story: ${p.assessmentCount} assessments show a ${p.overallTier.toLowerCase()}-tier ${p.position} whose strongest area — ${SKILL_LABELS[topSkill.k]} (${topSkill.v.toFixed(1)}/10) — is also confirmed by ${p.filmClipCount} annotated film sessions. His biggest growth signal is in ${SKILL_LABELS[topDelta.k]}, where he's improved +${topDelta.d.toFixed(1)} since our January baseline. Coach observations across this season have consistently highlighted the same themes the assessment data reflects — a rare alignment that signals genuine skill development rather than test-day performance. At ${pct}th percentile for growth rate in the ${p.gradYear} class, ${p.name.split(" ")[0]} is trending in the right direction at the right time.`;
}

// Recruiter bullets
function recruiterBullets(p: RecruitingPlayer): string[] {
  const top = SKILL_KEYS.map(k => ({ k, v: p.skillScores[k] ?? 0 })).sort((a, b) => b.v - a.v);
  const pct = cohortPercentile(p);
  return [
    `${SKILL_LABELS[top[0]!.k]} is the standout skill at ${top[0]!.v.toFixed(1)}/10, confirmed across ${p.assessmentCount} assessments and ${p.filmClipCount} film sessions this season.`,
    `Growth rate is in the top ${100 - pct}% of comparable ${p.position}s in the ${p.gradYear} class — ${p.name.split(" ")[0]} is improving faster than his peers.`,
    `Coachability index of ${p.coachabilityIndex}/10 and ${p.attendanceRate}% attendance over the full season — a professional-grade commitment to the program.`,
  ];
}

// Flagged gaps
function flaggedGaps(p: RecruitingPlayer): Array<{ skill: string; issue: string }> {
  return SKILL_KEYS
    .filter(k => {
      const score = p.skillScores[k] ?? 0;
      const delta = p.skillDeltas[k] ?? 0;
      return (score >= 7.5 && delta < 0.2) || (score < 6.5 && delta < 0.2);
    })
    .map(k => {
      const score = p.skillScores[k] ?? 0;
      if (score >= 7.5) {
        return { skill: k, issue: `High assessment score (${score.toFixed(1)}) but minimal film evidence — consider adding clips that demonstrate this skill.` };
      }
      return { skill: k, issue: `Low score (${score.toFixed(1)}) with no growth signal. Prioritize in IDP before profile is shared.` };
    });
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function tierColor(tier: RecruitingPlayer["overallTier"]) {
  switch (tier) {
    case "Elite":      return PRIMARY;
    case "Advanced":   return SUCCESS;
    case "Developing": return WARNING;
    case "Emerging":   return "oklch(0.55 0.02 260)";
  }
}

/* -------------------------------------------------------------------------- */
/* Skill assessment bars SVG-based                                             */
/* -------------------------------------------------------------------------- */

function AssessmentBars({ scores, deltas }: { scores: Record<string, number>; deltas: Record<string, number> }) {
  const top3 = SKILL_KEYS
    .map(k => ({ k, v: scores[k] ?? 0, d: deltas[k] ?? 0 }))
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .slice(0, 3);

  return (
    <div className="space-y-2.5">
      {top3.map(({ k, v, d }) => (
        <div key={k}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">{SKILL_LABELS[k]}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono">{v.toFixed(1)}</span>
              <span
                className="flex items-center text-[10px] font-semibold"
                style={{ color: d > 0 ? SUCCESS : d < 0 ? DANGER : "oklch(0.55 0.02 260)" }}
              >
                {d > 0 ? <ArrowUp className="w-3 h-3" /> : d < 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                {Math.abs(d).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(v / 10) * 100}%`, background: v >= 8 ? SUCCESS : v >= 7 ? PRIMARY : WARNING }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Film corroboration gauge SVG                                                */
/* -------------------------------------------------------------------------- */

function CorroborationGauge({ pct }: { pct: number }) {
  const r = 28;
  const cx = 36, cy = 36;
  const circumference = 2 * Math.PI * r;
  const dashFill = (pct / 100) * circumference;
  const color = pct >= 70 ? SUCCESS : pct >= 40 ? PRIMARY : WARNING;

  return (
    <div className="flex flex-col items-center">
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="oklch(0.25 0.01 260)" strokeWidth={6} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${dashFill} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={12} fontWeight="700" fill={color} fontFamily="system-ui">
          {pct}%
        </text>
      </svg>
      <div className="text-[10px] text-[var(--text-muted)] text-center mt-1 leading-tight">Film<br/>corroborates</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Distribution curve SVG                                                      */
/* -------------------------------------------------------------------------- */

function DistributionCurve({ percentile }: { percentile: number }) {
  const W = 200, H = 60;
  // Bell curve approximation using SVG path
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= 100; i++) {
    const x = (i / 100) * W;
    const z = (i - 50) / 15;
    const y = H - (H * 0.85 * Math.exp(-0.5 * z * z));
    points.push([x, y]);
  }
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const markerX = (percentile / 100) * W;
  const markerZ = (percentile - 50) / 15;
  const markerY = H - (H * 0.85 * Math.exp(-0.5 * markerZ * markerZ));

  return (
    <svg width={W} height={H + 16} viewBox={`0 0 ${W} ${H + 16}`} className="overflow-visible">
      <defs>
        <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.25} />
          <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.03} />
        </linearGradient>
      </defs>
      <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#curve-fill)" />
      <path d={path} stroke={PRIMARY} strokeWidth={1.5} fill="none" opacity={0.6} />
      {/* Player marker */}
      <line x1={markerX} y1={markerY - 4} x2={markerX} y2={H} stroke={SUCCESS} strokeWidth={1.5} strokeDasharray="3,2" />
      <circle cx={markerX} cy={markerY - 4} r={4} fill={SUCCESS} />
      <text x={markerX} y={H + 12} textAnchor="middle" fontSize={9} fill={SUCCESS} fontFamily="system-ui" fontWeight="600">
        {percentile}th
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function DevelopmentSynthesisPage() {
  const params = useParams<{ playerId?: string }>();
  const [, navigate] = useLocation();

  const initialId = params.playerId ?? MOCK_PLAYERS[0].id;
  const [selectedId, setSelectedId] = useState<string>(initialId);

  const player = useMemo(() => MOCK_PLAYERS.find(p => p.id === selectedId) ?? MOCK_PLAYERS[0], [selectedId]);

  const filmThemes  = useMemo(() => filmThemesForPlayer(player), [player]);
  const obsThemes   = useMemo(() => obsThemesForPlayer(player), [player]);
  const percentile  = useMemo(() => cohortPercentile(player), [player]);
  const synthText   = useMemo(() => synthesisNarrative(player), [player]);
  const bullets     = useMemo(() => recruiterBullets(player), [player]);
  const gaps        = useMemo(() => flaggedGaps(player), [player]);
  const topMovers   = useMemo(() =>
    SKILL_KEYS.map(k => ({ k, delta: player.skillDeltas[k] ?? 0, score: player.skillScores[k] ?? 0 }))
      .sort((a, b) => b.delta - a.delta).slice(0, 3),
    [player]
  );
  const overallCorrobPct = useMemo(() => {
    const vals = SKILL_KEYS.map(k => filmCorroboration(player, k));
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [player]);

  function handleSelectPlayer(id: string) {
    setSelectedId(id);
    navigate(`/app/coach/recruiting/synthesis/${id}`);
  }

  const tc = tierColor(player.overallTier);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Development Intelligence"
          title="Player Synthesis"
          subtitle="Assessments × Film × Observations — the complete picture"
          actions={
            <div className="relative">
              <select
                value={selectedId}
                onChange={e => handleSelectPlayer(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] pl-3 pr-9 py-2.5 text-[13px] appearance-none font-medium"
                style={{ minHeight: 44, color: "var(--text-primary)" }}
              >
                {MOCK_PLAYERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.position} · {p.gradYear}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>
          }
        />

        {/* A — Hero narrative card */}
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: `${tc.replace(")", " / 0.25)")}`, background: `${tc.replace(")", " / 0.06)")}` }}
        >
          <div className="flex items-start gap-4">
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: tc, minHeight: 60 }} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.12em] font-mono mb-2" style={{ color: tc }}>
                Auto-Generated Synthesis · {player.name}
              </div>
              <p className="text-[14px] leading-relaxed text-[var(--text-primary)]">{synthText}</p>
              <div className="flex items-center gap-4 mt-4 text-[12px] text-[var(--text-muted)]">
                <span>Based on <strong style={{ color: "var(--text-primary)" }}>{player.assessmentCount}</strong> assessments</span>
                <span>·</span>
                <span><strong style={{ color: "var(--text-primary)" }}>{player.filmClipCount}</strong> film sessions</span>
                <span>·</span>
                <span><strong style={{ color: "var(--text-primary)" }}>12</strong> coach observations</span>
              </div>
            </div>
          </div>
        </div>

        {/* B — Three-column data alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Assessments */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--text-muted)]">
              Assessments
            </div>
            <AssessmentBars scores={player.skillScores} deltas={player.skillDeltas} />
            <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Top Movers</div>
              {topMovers.map(({ k, delta, score }) => (
                <div key={k} className="flex items-center gap-2">
                  <ArrowUp className="w-3 h-3 shrink-0" style={{ color: SUCCESS }} />
                  <span className="text-[12px]">{SKILL_LABELS[k]}</span>
                  <span className="text-[12px] font-semibold ml-auto" style={{ color: SUCCESS }}>+{delta.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Last assessed: <span className="font-medium text-[var(--text-primary)]">May 6, 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.75 0.12 140 / 0.12)", color: SUCCESS }}
              >
                Improving overall
              </span>
            </div>
          </div>

          {/* Film */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--text-muted)]">
              Film
            </div>
            <div className="space-y-2">
              {filmThemes.map(({ skill, clipCount }) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-[12px]">{SKILL_LABELS[skill]}</span>
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "oklch(0.72 0.18 290 / 0.10)", color: PRIMARY }}
                  >
                    {clipCount} clips
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
              <CorroborationGauge pct={overallCorrobPct} />
              <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                Film corroborates assessment data overall
              </div>
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Last session: <span className="font-medium text-[var(--text-primary)]">May 8, 2026</span>
            </div>
          </div>

          {/* Observations */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--text-muted)]">
              Observations
            </div>
            <div className="flex flex-wrap gap-2">
              {obsThemes.map(({ keyword, frequency }) => (
                <span
                  key={keyword}
                  className="rounded-full px-2.5 py-1 text-[12px] font-medium border"
                  style={{
                    fontSize: `${Math.max(10, Math.min(14, 10 + frequency))}px`,
                    background: "oklch(0.72 0.18 290 / 0.08)",
                    borderColor: "oklch(0.72 0.18 290 / 0.20)",
                    color: PRIMARY,
                  }}
                >
                  {keyword}
                  <span className="ml-1 text-[10px] opacity-60">×{frequency}</span>
                </span>
              ))}
            </div>
            <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Recent</div>
              <div className="text-[12px] text-[var(--text-muted)] leading-relaxed line-clamp-3">
                "Called out a screen that wasn't in the play — saved us from a turnover in crunch time." — May 8
              </div>
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              12 observations this season · Last: <span className="font-medium text-[var(--text-primary)]">May 8, 2026</span>
            </div>
          </div>
        </div>

        {/* C — Growth rate signal */}
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: `${SUCCESS.replace(")", " / 0.30)")}`, background: `${SUCCESS.replace(")", " / 0.05)")}` }}
        >
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--text-muted)] mb-2">
                Growth Rate vs. Cohort
              </div>
              <div className="text-[26px] font-black leading-none" style={{ color: SUCCESS }}>
                Top {100 - percentile}%
              </div>
              <div className="text-[13px] text-[var(--text-muted)] mt-2 max-w-lg leading-relaxed">
                {player.name} has improved faster than{" "}
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{percentile}%</span>
                {" "}of {player.gradYear} {player.position}s in comparable programs. Growth rate is calculated from assessment deltas across all 8 skill categories since January baseline.
              </div>
            </div>
            <div className="shrink-0">
              <DistributionCurve percentile={percentile} />
              <div className="text-[10px] text-[var(--text-muted)] text-center mt-1">{player.gradYear} {player.position} cohort</div>
            </div>
          </div>
        </div>

        {/* D — Skill-film correlation table */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <div className="text-[13px] font-bold">Skill–Film Correlation</div>
            <div className="text-[12px] text-[var(--text-muted)] mt-0.5">Assessment data aligned with film evidence</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Skill", "Assessment Score", "Delta", "Film Clips Tagged", "Corroboration"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SKILL_KEYS.map((k, i) => {
                  const score = player.skillScores[k] ?? 0;
                  const delta = player.skillDeltas[k] ?? 0;
                  const corr  = corroborationLabel(player, k);
                  const clips = filmThemes.find(f => f.skill === k)?.clipCount ?? 0;
                  return (
                    <tr key={k} className="border-b border-[var(--border)] last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{SKILL_LABELS[k]}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, background: score >= 8 ? SUCCESS : score >= 7 ? PRIMARY : WARNING }} />
                          </div>
                          <span className="font-mono">{score.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="flex items-center gap-1 font-semibold"
                          style={{ color: delta >= 0.5 ? SUCCESS : delta >= 0.2 ? PRIMARY : "oklch(0.50 0.01 260)" }}
                        >
                          {delta > 0 && <ArrowUp className="w-3 h-3" />}
                          +{delta.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {clips > 0 ? (
                          <span style={{ color: PRIMARY }}>{clips}</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${corr.color.replace(")", " / 0.12)")}`, color: corr.color }}
                        >
                          {corr.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* E — Recruiter-ready summary */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-bold">For Your Recruiting Conversation</div>
              <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Auto-generated talking points for {player.name}
              </div>
            </div>
            <button
              onClick={() => {
                const text = bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
                navigator.clipboard.writeText(text);
                toast.success("Talking points copied to clipboard");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              style={{ minHeight: 36 }}
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <div className="space-y-3">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ background: `${PRIMARY.replace(")", " / 0.14)")}`, color: PRIMARY }}
                >
                  {i + 1}
                </div>
                <p className="text-[13px] leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>

        {/* F — Flagged gaps */}
        {gaps.length > 0 && (
          <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: `${WARNING.replace(")", " / 0.35)")}`, background: `${WARNING.replace(")", " / 0.05)")}` }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: WARNING }} />
              <div className="text-[13px] font-bold" style={{ color: WARNING }}>Gaps to Address Before Sharing Profile</div>
            </div>
            <div className="space-y-2.5">
              {gaps.map(({ skill, issue }) => (
                <div key={skill} className="flex items-start gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: WARNING }}
                  />
                  <div>
                    <span className="text-[12px] font-semibold">{SKILL_LABELS[skill]}: </span>
                    <span className="text-[12px] text-[var(--text-muted)]">{issue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {gaps.length === 0 && (
          <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: `${SUCCESS.replace(")", " / 0.30)")}`, background: `${SUCCESS.replace(")", " / 0.05)")}` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: SUCCESS }} />
            <span className="text-[13px]" style={{ color: SUCCESS }}>
              No critical gaps detected. {player.name}'s profile data is well-supported across all skill areas.
            </span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
