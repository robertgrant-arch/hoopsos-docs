/**
 * Client-side readiness types and mock team data.
 * Mirrors the shape returned by GET /api/readiness/team.
 */

export type ReadinessStatus = "RESTRICTED" | "FLAGGED" | "READY" | "UNKNOWN";
export type ReadinessConfidence = "high" | "medium" | "low" | "none";

export type ReadinessReasonCode =
  | "injury_active"
  | "injury_monitoring"
  | "player_suspended"
  | "fatigue_high"
  | "sleep_low"
  | "soreness_high"
  | "wearable_recovery_low"
  | "wearable_sleep_low"
  | "attendance_streak_missed"
  | "workload_overload"
  | "assignments_overdue"
  | "no_data";

export interface PlayerReadiness {
  playerId:         string;
  playerName:       string;
  position?:        string;
  jerseyNumber?:    string;
  avatarUrl?:       string;
  checkinSubmitted: boolean;
  status:           ReadinessStatus;
  confidence:       ReadinessConfidence;
  reasons:          ReadinessReasonCode[];
  summary:          string;
}

export const REASON_LABELS: Record<ReadinessReasonCode, string> = {
  injury_active:            "Active injury on file",
  injury_monitoring:        "Injury under monitoring",
  player_suspended:         "Player suspended/injured",
  fatigue_high:             "High fatigue reported",
  sleep_low:                "Low sleep reported",
  soreness_high:            "High soreness reported",
  wearable_recovery_low:    "Low wearable recovery score",
  wearable_sleep_low:       "Low wearable sleep score",
  attendance_streak_missed: "Consecutive unexcused absences",
  workload_overload:        "High 7-day workload load",
  assignments_overdue:      "Multiple overdue assignments",
  no_data:                  "No recent signals",
};

// ── Status display helpers ─────────────────────────────────────────────────

export function statusColor(s: ReadinessStatus) {
  switch (s) {
    case "RESTRICTED": return { text: "oklch(0.68 0.22 25)",   bg: "oklch(0.68 0.22 25 / 0.1)",  border: "oklch(0.68 0.22 25 / 0.3)"  };
    case "FLAGGED":    return { text: "oklch(0.72 0.17 75)",   bg: "oklch(0.72 0.17 75 / 0.1)",   border: "oklch(0.72 0.17 75 / 0.3)"  };
    case "READY":      return { text: "oklch(0.60 0.15 145)",  bg: "oklch(0.75 0.18 150 / 0.08)", border: "oklch(0.75 0.18 150 / 0.25)" };
    case "UNKNOWN":    return { text: "oklch(0.55 0.04 240)",  bg: "oklch(0.55 0.04 240 / 0.08)", border: "oklch(0.55 0.04 240 / 0.2)"  };
  }
}

export function statusLabel(s: ReadinessStatus) {
  switch (s) {
    case "RESTRICTED": return "Restricted";
    case "FLAGGED":    return "Flagged";
    case "READY":      return "Ready";
    case "UNKNOWN":    return "Unknown";
  }
}

// ── Client-side readiness computation ─────────────────────────────────────
// Simplified version of the server scoring engine, for use in UI components.

export interface WellnessCheckin {
  fatigue: number;   // 1-10
  sleep: number;     // hours
  soreness: number;  // 1-10
  flagged?: boolean;
}

export interface PlayerReadinessSignals {
  latestCheckin?: WellnessCheckin | null;
  hasActiveInjury?: boolean;
  hasMonitoringInjury?: boolean;
  playerStatus?: string | null;
}

export function computePlayerReadiness(signals: PlayerReadinessSignals): {
  status: ReadinessStatus;
  confidence: ReadinessConfidence;
  reasons: ReadinessReasonCode[];
  summary: string;
} {
  const reasons: ReadinessReasonCode[] = [];

  if (signals.hasActiveInjury) reasons.push("injury_active");
  if (signals.playerStatus === "injured" || signals.playerStatus === "suspended") {
    reasons.push("player_suspended");
  }
  if (reasons.length > 0) {
    return { status: "RESTRICTED", confidence: "high", reasons, summary: REASON_LABELS[reasons[0]] };
  }

  const { latestCheckin } = signals;
  if (!latestCheckin) {
    return { status: "UNKNOWN", confidence: "none", reasons: ["no_data"], summary: "No recent check-in data" };
  }

  if (latestCheckin.fatigue  >= 7) reasons.push("fatigue_high");
  if (latestCheckin.sleep    <= 5) reasons.push("sleep_low");
  if (latestCheckin.soreness >= 7) reasons.push("soreness_high");

  if (signals.hasMonitoringInjury) reasons.push("injury_monitoring");

  const status: ReadinessStatus = reasons.length > 0 ? "FLAGGED" : "READY";
  const summary =
    reasons.length === 0 ? "Ready to practice" :
    reasons.length === 1 ? REASON_LABELS[reasons[0]] :
    reasons.slice(0, 2).map((r) => REASON_LABELS[r]).join("; ");

  return { status, confidence: "medium", reasons, summary };
}

// ── Mock data ─────────────────────────────────────────────────────────────

export const MOCK_TEAM_READINESS: PlayerReadiness[] = [
  {
    playerId: "p1", playerName: "Marcus Johnson", position: "PG", jerseyNumber: "3",
    checkinSubmitted: true,
    status: "FLAGGED", confidence: "high",
    reasons: ["fatigue_high", "soreness_high"],
    summary: "High fatigue reported; High soreness reported",
  },
  {
    playerId: "p2", playerName: "DeShawn Williams", position: "SG", jerseyNumber: "5",
    checkinSubmitted: true,
    status: "READY", confidence: "high",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p3", playerName: "Tyler Brooks", position: "SF", jerseyNumber: "11",
    checkinSubmitted: false,
    status: "RESTRICTED", confidence: "high",
    reasons: ["injury_active"],
    summary: "Active injury on file",
  },
  {
    playerId: "p4", playerName: "Jordan Davis", position: "PF", jerseyNumber: "21",
    checkinSubmitted: true,
    status: "FLAGGED", confidence: "medium",
    reasons: ["sleep_low", "injury_monitoring"],
    summary: "Low sleep reported; Injury under monitoring",
  },
  {
    playerId: "p5", playerName: "Elijah Carter", position: "C", jerseyNumber: "34",
    checkinSubmitted: true,
    status: "READY", confidence: "high",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p6", playerName: "Jaylen Scott", position: "PG", jerseyNumber: "1",
    checkinSubmitted: false,
    status: "UNKNOWN", confidence: "none",
    reasons: ["no_data"],
    summary: "No recent data — readiness unknown",
  },
  {
    playerId: "p7", playerName: "Cam Porter", position: "SG", jerseyNumber: "13",
    checkinSubmitted: true,
    status: "FLAGGED", confidence: "low",
    reasons: ["workload_overload"],
    summary: "High 7-day workload load",
  },
  {
    playerId: "p8", playerName: "Noah Rivera", position: "SF", jerseyNumber: "23",
    checkinSubmitted: true,
    status: "READY", confidence: "medium",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p9", playerName: "Darius Thomas", position: "C", jerseyNumber: "42",
    checkinSubmitted: true,
    status: "READY", confidence: "high",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p10", playerName: "Malik Henderson", position: "PF", jerseyNumber: "32",
    checkinSubmitted: false,
    status: "FLAGGED", confidence: "low",
    reasons: ["attendance_streak_missed"],
    summary: "Consecutive unexcused absences",
  },
  {
    playerId: "p11", playerName: "Trey Evans", position: "PG", jerseyNumber: "7",
    checkinSubmitted: true,
    status: "READY", confidence: "high",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p12", playerName: "Brandon Lee", position: "SG", jerseyNumber: "15",
    checkinSubmitted: true,
    status: "FLAGGED", confidence: "high",
    reasons: ["wearable_recovery_low"],
    summary: "Low wearable recovery score",
  },
];
