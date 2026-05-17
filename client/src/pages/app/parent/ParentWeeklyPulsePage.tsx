import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

// ─── Data ────────────────────────────────────────────────────────────────────

interface ScheduleItem {
  date: string;
  type: string;
  detail: string;
  time: string;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const SCHEDULE: ScheduleItem[] = [
  { date: "May 20", type: "Practice", detail: "Riverside Gym", time: "6:00 PM" },
  { date: "May 23", type: "Practice", detail: "Riverside Gym", time: "6:00 PM" },
  { date: "May 25", type: "Tournament", detail: "Chicago Elite Classic", time: "TBD" },
  { date: "June 2", type: "Assessment", detail: "Reassessment with Coach Grant", time: "TBD" },
  { date: "June 4", type: "Practice", detail: "Riverside Gym", time: "6:00 PM" },
];

const INITIAL_SETTINGS: NotificationSetting[] = [
  { id: "pulse", label: "Weekly pulse", description: "Every Sunday morning", enabled: true },
  { id: "assessment", label: "Assessment notifications", description: "When new scores are recorded", enabled: true },
  { id: "recruiter", label: "Recruiter activity alerts", description: "When a program views Marcus's profile", enabled: true },
  { id: "reminders", label: "Game / practice reminders", description: "24 hours before each session", enabled: true },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

type HealthStatus = "strong" | "steady" | "attention";

function healthLabel(status: HealthStatus): string {
  if (status === "strong") return "Strong week ✓";
  if (status === "steady") return "Steady week";
  return "Needs attention";
}

function healthColor(status: HealthStatus): string {
  if (status === "strong") return SUCCESS;
  if (status === "steady") return WARNING;
  return DANGER;
}

function scheduleTypeColor(type: string): string {
  if (type === "Tournament") return PRIMARY;
  if (type === "Assessment") return WARNING;
  return SUCCESS;
}

// ─── SVG Components ───────────────────────────────────────────────────────────

function AttendanceDots({ attended, total }: { attended: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: i < attended ? SUCCESS : "var(--border)",
            border: `2px solid ${i < attended ? SUCCESS : "var(--border)"}`,
          }}
        />
      ))}
      <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 4 }}>
        {attended}/{total} sessions
      </span>
    </div>
  );
}

function ScoreCompare({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  const isPositive = delta > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Before</div>
        <div style={{
          fontSize: 22,
          fontWeight: 800,
          color: MUTED,
          background: "var(--bg-base)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "4px 14px",
        }}>{before.toFixed(1)}</div>
      </div>
      <div style={{ color: isPositive ? SUCCESS : DANGER, fontSize: 18, fontWeight: 700 }}>→</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Now</div>
        <div style={{
          fontSize: 22,
          fontWeight: 800,
          color: isPositive ? SUCCESS : DANGER,
          background: isPositive ? `${SUCCESS}14` : `${DANGER}14`,
          border: `1px solid ${isPositive ? SUCCESS : DANGER}44`,
          borderRadius: 8,
          padding: "4px 14px",
        }}>{after.toFixed(1)}</div>
      </div>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: isPositive ? SUCCESS : DANGER,
        background: isPositive ? `${SUCCESS}14` : `${DANGER}14`,
        borderRadius: 20,
        padding: "3px 10px",
      }}>
        {isPositive ? "+" : ""}{delta.toFixed(1)} {label}
      </div>
    </div>
  );
}

// ─── Notification Toggle ──────────────────────────────────────────────────────

function NotificationToggle({
  setting,
  onToggle,
}: {
  setting: NotificationSetting;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{setting.label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{setting.description}</div>
      </div>

      <button
        onClick={() => onToggle(setting.id)}
        aria-label={`Toggle ${setting.label}`}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: setting.enabled ? PRIMARY : "var(--border)",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute",
          top: 3,
          left: setting.enabled ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParentWeeklyPulsePage() {
  const [settings, setSettings] = useState<NotificationSetting[]>(INITIAL_SETTINGS);

  const healthStatus: HealthStatus = "strong";

  function handleToggle(id: string) {
    setSettings((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, enabled: !s.enabled };
        toast(next.enabled ? `${s.label} turned on` : `${s.label} turned off`);
        return next;
      })
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Parent Portal · Weekly Digest"
        title="Marcus's Week"
        subtitle="May 11–18, 2026 · Generated from platform data"
        actions={
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: healthColor(healthStatus),
            background: `${healthColor(healthStatus)}18`,
            border: `1px solid ${healthColor(healthStatus)}44`,
            borderRadius: 20,
            padding: "6px 16px",
          }}>
            {healthLabel(healthStatus)}
          </span>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 40, paddingBottom: 60 }}>

        {/* ── Section 1: This Week for Marcus ── */}
        <section>
          <div style={{
            background: `${SUCCESS}0d`,
            border: `2px solid ${SUCCESS}44`,
            borderRadius: 16,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: SUCCESS,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}>✓</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                Strong week for Marcus
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
                Three sessions attended, skill growth confirmed, recruiter activity. A week worth celebrating.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Three Things You Should Know ── */}
        <section>
          <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            The Three Things You Should Know
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Thing 1 */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "24px 28px",
              borderLeft: `4px solid ${SUCCESS}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: SUCCESS, letterSpacing: "0.08em", textTransform: "uppercase" }}>01</span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Marcus showed up</h3>
              </div>

              <AttendanceDots attended={3} total={3} />

              <div style={{ display: "flex", gap: 24, marginTop: 14, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>This week</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: SUCCESS }}>3 / 3</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Season attendance</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>91%</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>vs. 84% program avg</div>
                </div>
              </div>

              <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                Consistent attendance is the #1 predictor of skill development. Marcus hasn't missed a scheduled session in 6 weeks.
              </p>
            </div>

            {/* Thing 2 */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "24px 28px",
              borderLeft: `4px solid ${PRIMARY}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, letterSpacing: "0.08em", textTransform: "uppercase" }}>02</span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>His ball handling improved again</h3>
              </div>

              <div style={{ marginBottom: 16 }}>
                <ScoreCompare label="Ball Handling" before={7.2} after={7.4} />
              </div>

              <div style={{
                background: "var(--bg-base)",
                borderRadius: 10,
                padding: "14px 18px",
                borderLeft: `3px solid ${PRIMARY}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.06em", marginBottom: 6 }}>COACH'S OBSERVATION</div>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" }}>
                  "Crossover is finally getting to his left shoulder instead of his hip. This was our #1 focus. Real progress."
                </p>
              </div>
            </div>

            {/* Thing 3 */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "24px 28px",
              borderLeft: `4px solid ${WARNING}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: WARNING, letterSpacing: "0.08em", textTransform: "uppercase" }}>03</span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>A recruiter from the Big Ten viewed his profile</h3>
              </div>

              <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                University of Illinois's recruiting staff viewed Marcus's profile this week (7 min 23 sec). This is their <strong style={{ color: "var(--text-primary)" }}>second visit.</strong>
              </p>

              <button
                onClick={() => toast.info("Opening recruiter activity page")}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: PRIMARY,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textDecorationColor: `${PRIMARY}66`,
                }}
              >
                Review access request →
              </button>
            </div>

          </div>
        </section>

        {/* ── Section 3: This Week vs. Last Week ── */}
        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            This Week vs. Last Week
          </h2>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-base)" }}>
                  <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em" }}>METRIC</th>
                  <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em" }}>THIS WEEK</th>
                  <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em" }}>LAST WEEK</th>
                  <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em" }}>DELTA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: "Attendance", thisWeek: "3 / 3", lastWeek: "3 / 3", delta: "Same", deltaColor: MUTED },
                  { metric: "Skill assessment", thisWeek: "Ball Handling 7.4", lastWeek: "Ball Handling 7.2", delta: "+0.2 ✓", deltaColor: SUCCESS },
                  { metric: "Practice engagement", thisWeek: "High energy (coach noted)", lastWeek: "Good effort", delta: "↑", deltaColor: SUCCESS },
                  { metric: "IDP progress", thisWeek: "On track ✓", lastWeek: "On track ✓", delta: "Same", deltaColor: MUTED },
                ].map((row, i) => (
                  <tr
                    key={row.metric}
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{row.metric}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--text-primary)" }}>{row.thisWeek}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--text-muted)" }}>{row.lastWeek}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 700, color: row.deltaColor }}>{row.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Section 4: Coach's Note ── */}
        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Coach's Note
          </h2>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "32px 36px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: 20,
              left: 24,
              fontSize: 64,
              color: `${PRIMARY}22`,
              fontFamily: "Georgia, serif",
              lineHeight: 1,
              userSelect: "none",
            }}>"</div>

            <p style={{
              margin: "0 0 20px",
              fontSize: 16,
              color: "var(--text-primary)",
              lineHeight: 1.75,
              fontStyle: "italic",
              paddingLeft: 20,
            }}>
              Marcus has been one of our hardest workers this month. The left-hand work we've been doing
              in open gym is starting to show up in practice situations. Very pleased with his effort and
              coachability. We're on track for the April reassessment.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 20 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}>MG</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Coach Marcus Grant</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>May 16, 2026</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Coming Up ── */}
        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Coming Up
          </h2>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
          }}>
            {SCHEDULE.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 20px",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  flexWrap: "wrap",
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  background: `${scheduleTypeColor(item.type)}18`,
                  border: `1px solid ${scheduleTypeColor(item.type)}44`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: scheduleTypeColor(item.type), letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {item.date.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                    {item.date.split(" ")[1]}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{item.type}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: scheduleTypeColor(item.type),
                      background: `${scheduleTypeColor(item.type)}18`,
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}>{item.type.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.detail}</div>
                </div>

                <div style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 6: Subscription & Notification Settings ── */}
        <section>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            Notification Settings
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)" }}>
            You're receiving this digest every Sunday morning.
          </p>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "8px 24px 8px",
          }}>
            {settings.map((setting) => (
              <NotificationToggle
                key={setting.id}
                setting={setting}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  );
}
