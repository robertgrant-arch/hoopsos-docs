import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

interface LibraryModule {
  id: number;
  title: string;
  duration: number;
  whyRelevant: string;
  relevanceScore: number;
}

interface CompletedModule {
  id: number;
  title: string;
  duration: number;
  completedDate: string;
  outcome: string;
}

const LIBRARY_MODULES: LibraryModule[] = [
  {
    id: 1,
    title: "Writing Skill-Specific IDP Goals",
    duration: 42,
    whyRelevant: "Your IDP specificity score (54%) is 17 points below the coach average at your level.",
    relevanceScore: 97,
  },
  {
    id: 2,
    title: "Observation Cadence for At-Risk Players",
    duration: 18,
    whyRelevant: "3 of your players have gone 21+ days without a coach observation — a known retention risk signal.",
    relevanceScore: 91,
  },
  {
    id: 3,
    title: "Effective Film Annotation Strategies",
    duration: 31,
    whyRelevant: "Annotated film correlates with 22% faster coachability improvement — you're at 61% annotation rate.",
    relevanceScore: 84,
  },
  {
    id: 4,
    title: "Assessment Frequency and Player Trust",
    duration: 24,
    whyRelevant: "Coaches who assess 4+ times/month see 31% higher IDP completion. You're averaging 3.4.",
    relevanceScore: 78,
  },
  {
    id: 5,
    title: "IDP Goal Review Conversations",
    duration: 19,
    whyRelevant: "Your IDP goal review rate jumped from 58% to 71% this season — this module helps push past 80%.",
    relevanceScore: 72,
  },
  {
    id: 6,
    title: "Reading Coachability Signals Early",
    duration: 27,
    whyRelevant: "2 of your players showed early coachability dips 3 weeks before their observation gaps.",
    relevanceScore: 65,
  },
  {
    id: 7,
    title: "Narrative Assessment Writing",
    duration: 33,
    whyRelevant: "Your observation specificity improved from 54% to 68% — narrative training accelerates this further.",
    relevanceScore: 58,
  },
  {
    id: 8,
    title: "Recruiting Visibility Through Verified Data",
    duration: 22,
    whyRelevant: "You generated 12 college inquiries this season. Understanding the VDV pipeline could grow that.",
    relevanceScore: 51,
  },
];

const COMPLETED_MODULES: CompletedModule[] = [
  {
    id: 1,
    title: "Advanced Assessment Methodology",
    duration: 28,
    completedDate: "Apr 12, 2026",
    outcome: "Assessment density increased from 2.1 to 3.4 per player/month in the 30 days after",
  },
  {
    id: 2,
    title: "IDP Basics",
    duration: 22,
    completedDate: "Mar 3, 2026",
    outcome: "IDP completion rate improved from 67% to 84%",
  },
];

const WEEK_PLAN = [
  {
    week: 1,
    label: "IDP Goal Rewrite Sprint",
    desc: "Complete IDP Specificity module + rewrite 5 player goals",
    color: DANGER,
  },
  {
    week: 2,
    label: "Observation Catch-Up",
    desc: "Schedule sessions with Marcus, Devon, Jordan",
    color: WARNING,
  },
  {
    week: 3,
    label: "Film Annotation Session",
    desc: "Annotate at least 4 new film clips + complete Film module",
    color: PRIMARY,
  },
  {
    week: 4,
    label: "Reassess 6 Players",
    desc: "Measure IDP specificity delta across all rewritten goals",
    color: SUCCESS,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({
  pct,
  color,
  height = 6,
}: {
  pct: number;
  color: string;
  height?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 999,
        background: "var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, pct)}%`,
          height: "100%",
          borderRadius: 999,
          background: color,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

function PrescriptionCard({
  priority,
  urgency,
  borderColor,
  urgencyLabel,
  title,
  why,
  moduleTitle,
  moduleDuration,
  whatChanges,
  action,
  progress,
}: {
  priority: number;
  urgency: "critical" | "important" | "growth";
  borderColor: string;
  urgencyLabel: string;
  title: string;
  why: string;
  moduleTitle?: string;
  moduleDuration?: number;
  whatChanges?: string;
  action?: { label: string; onClick: () => void };
  progress: number;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `2px solid ${borderColor}`,
        borderRadius: 12,
        padding: "28px 28px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: borderColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          {priority}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: borderColor,
              }}
            >
              {urgencyLabel}
            </span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
            {title}
          </div>
        </div>
      </div>

      {/* Why prescribed */}
      <div
        style={{
          background: "var(--bg-base)",
          borderRadius: 8,
          padding: "12px 14px",
          fontSize: 13.5,
          color: "var(--text-primary)",
          lineHeight: 1.6,
        }}
      >
        <span style={{ fontWeight: 600, color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Why prescribed
        </span>
        <p style={{ margin: "6px 0 0", color: "var(--text-primary)" }}>{why}</p>
      </div>

      {/* Module info */}
      {moduleTitle && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📘</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{moduleTitle}</div>
            <div style={{ fontSize: 12, color: MUTED }}>{moduleDuration} min</div>
          </div>
        </div>
      )}

      {/* What changes */}
      {whatChanges && (
        <div style={{ fontSize: 13, color: SUCCESS, fontStyle: "italic" }}>
          {whatChanges}
        </div>
      )}

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED, marginBottom: 4 }}>
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar pct={progress} color={borderColor} />
      </div>

      {/* Action */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            alignSelf: "flex-start",
            padding: "10px 20px",
            borderRadius: 8,
            background: borderColor,
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Gantt-style SVG timeline
function GanttTimeline() {
  const W = 680;
  const H = 140;
  const PAD_LEFT = 60;
  const PAD_RIGHT = 20;
  const weekW = (W - PAD_LEFT - PAD_RIGHT) / 4;
  const colors = [DANGER, WARNING, PRIMARY, SUCCESS];
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={PAD_LEFT + i * weekW}
          y1={20}
          x2={PAD_LEFT + i * weekW}
          y2={H - 10}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}

      {/* Week labels */}
      {labels.map((label, i) => (
        <text
          key={i}
          x={PAD_LEFT + i * weekW + weekW / 2}
          y={16}
          textAnchor="middle"
          fontSize={11}
          fill={MUTED}
          fontWeight={600}
        >
          {label}
        </text>
      ))}

      {/* Activity bars */}
      {WEEK_PLAN.map((item, i) => (
        <g key={i}>
          <rect
            x={PAD_LEFT + i * weekW + 6}
            y={30 + i * 22}
            width={weekW - 12}
            height={16}
            rx={4}
            fill={colors[i]}
            opacity={0.85}
          />
          <text
            x={PAD_LEFT + i * weekW + weekW / 2}
            y={30 + i * 22 + 11}
            textAnchor="middle"
            fontSize={10}
            fill="#fff"
            fontWeight={600}
          >
            {item.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function RelevanceBar({ score }: { score: number }) {
  const color = score >= 80 ? DANGER : score >= 65 ? WARNING : PRIMARY;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 80,
          height: 5,
          borderRadius: 999,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{score}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModulePrescriptionPage() {
  const [startedModules, setStartedModules] = useState<Set<number>>(new Set<number>());

  const handleStart = (id: number, title: string) => {
    setStartedModules((prev) => new Set<number>([...Array.from(prev), id]));
    toast.success(`Started: ${title}`);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Coach Education"
        title="Module Prescriptions"
        subtitle="Personalized learning tied to your actual coaching data"
      />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 64px", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* ── Section 1: Prescription Summary ── */}
        <section>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Your Coaching Prescription — Week of May 16, 2026
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  background: "var(--border)",
                  color: MUTED,
                  padding: "3px 8px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                Generated from 4 seasons of your coaching data
              </span>
            </div>
            <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
              Based on your effectiveness data, here are the 3 highest-leverage things you can do this week.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <PrescriptionCard
              priority={1}
              urgency="critical"
              borderColor={DANGER}
              urgencyLabel="Critical"
              title="IDP Goal Specificity"
              why="Your players whose IDP goals are skill-specific improve 1.8× faster than those with broad goals. Your current IDP specificity score is 54% — the platform average for coaches at your level is 71%."
              moduleTitle="Writing Skill-Specific IDP Goals"
              moduleDuration={42}
              whatChanges='Coaches who complete this module improve their IDP specificity score by an avg of 19 points within 30 days.'
              action={{
                label: "Start Now",
                onClick: () => handleStart(1, "Writing Skill-Specific IDP Goals"),
              }}
              progress={0}
            />

            {/* Prescription 2 */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: `2px solid ${WARNING}`,
                borderRadius: 12,
                padding: "28px 28px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: WARNING,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: WARNING, marginBottom: 4 }}>
                    Important
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                    Observation Frequency for Struggling Players
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-base)", borderRadius: 8, padding: "12px 14px" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Why prescribed
                </span>
                <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>
                  3 of your players haven't received a coach observation in the last 21 days. These are your lowest-coachability players. Observation gaps predict retention risk.
                </p>
              </div>

              <div
                style={{
                  background: "var(--bg-base)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  borderLeft: `3px solid ${WARNING}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>Recommended Action</div>
                <div style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>
                  Schedule observation session with{" "}
                  {["Marcus", "Devon", "Jordan"].map((name, i, arr) => (
                    <span key={name}>
                      <button
                        onClick={() => toast(`Navigate to ${name}'s profile`)}
                        style={{
                          background: "none",
                          border: "none",
                          color: PRIMARY,
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 0,
                          fontSize: "inherit",
                          textDecoration: "underline",
                        }}
                      >
                        {name}
                      </button>
                      {i < arr.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📘</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    Observation Cadence for At-Risk Players
                  </div>
                  <div style={{ fontSize: 12, color: MUTED }}>18 min companion module</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => toast("Navigating to at-risk player list")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    background: WARNING,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  View At-Risk Players
                </button>
                <button
                  onClick={() => handleStart(2, "Observation Cadence for At-Risk Players")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    fontSize: 13,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  Start Module
                </button>
              </div>
            </div>

            <PrescriptionCard
              priority={3}
              urgency="growth"
              borderColor={PRIMARY}
              urgencyLabel="Growth Opportunity"
              title="Film Annotation Rate"
              why="Your film annotation rate is 61% — you're in the top 40%. But your players who receive annotated film improve coachability scores 22% faster. Getting to 80% would move you to the top 15%."
              moduleTitle="Effective Film Annotation Strategies"
              moduleDuration={31}
              action={{
                label: "Start Now",
                onClick: () => handleStart(3, "Effective Film Annotation Strategies"),
              }}
              progress={0}
            />
          </div>
        </section>

        {/* ── Section 2: This Month's Development Plan ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            This Month's Development Plan
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 20 }}>
            A structured 4-week path based on your prescriptions.
          </p>

          <div style={{ background: "var(--bg-surface)", borderRadius: 12, padding: "20px 24px 24px", border: "1px solid var(--border)" }}>
            <GanttTimeline />

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
              {WEEK_PLAN.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: item.color,
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                      Week {item.week}: {item.label}
                    </div>
                    <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 3: Module Library ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Modules Relevant to Your Gaps
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 20 }}>
            These 8 modules were selected based on your coaching data — sorted by impact potential.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {LIBRARY_MODULES.sort((a, b) => b.relevanceScore - a.relevanceScore).map((mod) => {
              const started = startedModules.has(mod.id);
              return (
                <div
                  key={mod.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                      {mod.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: MUTED }}>{mod.duration} min</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {mod.whyRelevant}
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: MUTED, marginBottom: 4 }}>Relevance</div>
                    <RelevanceBar score={mod.relevanceScore} />
                  </div>
                  <button
                    onClick={() => handleStart(mod.id, mod.title)}
                    disabled={started}
                    style={{
                      alignSelf: "flex-start",
                      padding: "7px 16px",
                      borderRadius: 7,
                      background: started ? "var(--bg-base)" : PRIMARY,
                      color: started ? MUTED : "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                      border: started ? "1px solid var(--border)" : "none",
                      cursor: started ? "default" : "pointer",
                    }}
                  >
                    {started ? "In Progress" : "Start"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 4: Completed Prescriptions ── */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Completed Prescriptions (Last 90 Days)
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, marginBottom: 20 }}>
            What you finished — and what moved in your data afterward.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {COMPLETED_MODULES.map((mod) => (
              <div
                key={mod.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderLeft: `4px solid ${SUCCESS}`,
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  gap: 20,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ fontSize: 22 }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                      {mod.title}
                    </span>
                    <span style={{ fontSize: 11, color: MUTED }}>
                      {mod.duration} min · Completed {mod.completedDate}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: SUCCESS,
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}
                  >
                    {mod.outcome}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
