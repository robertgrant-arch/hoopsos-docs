import { useState } from "react";
import {
  Clock,
  Star,
  CheckCircle2,
  ChevronRight,
  X,
  Users,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "queue" | "mine" | "completed";

type PracticePlanCard = {
  id: string;
  name: string;
  coachName: string;
  ageGroup: string;
  date: string;
  estimatedReviewMin: number;
  blocks: { label: string; duration: number }[];
};

type RubricKey = "clarity" | "ageProgression" | "timeEfficiency" | "skillGameBalance";

type RubricRatings = Record<RubricKey, number>;

type PlanUnderReview = {
  id: string;
  name: string;
  submittedDate: string;
  status: "awaiting" | "partial";
  reviewsReceived: number;
  reviewsTotal: number;
};

type CompletedReview = {
  id: string;
  planName: string;
  coachName: string;
  reviewedDate: string;
  scores: RubricRatings;
  feedbackExcerpt: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const QUEUE_PLANS: PracticePlanCard[] = [
  {
    id: "q1",
    name: "15U Tuesday — Ball Screen Offense",
    coachName: "Coach Devon Reyes",
    ageGroup: "15U",
    date: "May 13, 2026",
    estimatedReviewMin: 8,
    blocks: [
      { label: "Dynamic Warm-Up", duration: 10 },
      { label: "Ball Screen Decision Reads", duration: 18 },
      { label: "3-on-3 Competitive — Ball Screen Actions", duration: 15 },
    ],
  },
  {
    id: "q2",
    name: "17U Thursday — Defensive Principles",
    coachName: "Coach Tanya Okafor",
    ageGroup: "17U",
    date: "May 14, 2026",
    estimatedReviewMin: 10,
    blocks: [
      { label: "Stance & Slide Footwork", duration: 12 },
      { label: "Help Rotation Film Walkthrough", duration: 10 },
      { label: "Shell Drill (4-on-4 shell)", duration: 20 },
      { label: "1-on-1 Competitive Exit", duration: 8 },
    ],
  },
  {
    id: "q3",
    name: "13U Saturday — Finishing Progressions",
    coachName: "Coach Marcus Bell",
    ageGroup: "13U",
    date: "May 11, 2026",
    estimatedReviewMin: 7,
    blocks: [
      { label: "Mikan Drill Progressions", duration: 12 },
      { label: "Drive & Finish — Contact", duration: 15 },
      { label: "2-on-1 Fast Break Finishing", duration: 18 },
    ],
  },
  {
    id: "q4",
    name: "16U Wednesday — Perimeter Shooting",
    coachName: "Coach Janelle Moss",
    ageGroup: "16U",
    date: "May 12, 2026",
    estimatedReviewMin: 9,
    blocks: [
      { label: "Spot Shooting — Off Movement", duration: 15 },
      { label: "Shooting Off Screens", duration: 12 },
      { label: "4-on-4 Shooting Actions Scrimmage", duration: 23 },
    ],
  },
];

const PLANS_UNDER_REVIEW: PlanUnderReview[] = [
  {
    id: "m1",
    name: "17U Monday — Transition Offense",
    submittedDate: "May 10, 2026",
    status: "awaiting",
    reviewsReceived: 0,
    reviewsTotal: 2,
  },
  {
    id: "m2",
    name: "15U Friday — IDP Skill Stations",
    submittedDate: "May 8, 2026",
    status: "partial",
    reviewsReceived: 1,
    reviewsTotal: 2,
  },
];

const COMPLETED_REVIEWS: CompletedReview[] = [
  {
    id: "c1",
    planName: "14U Thursday — Post Development",
    coachName: "Coach Devon Reyes",
    reviewedDate: "May 5, 2026",
    scores: { clarity: 4, ageProgression: 5, timeEfficiency: 4, skillGameBalance: 3 },
    feedbackExcerpt:
      "Objectives were clear and the progressions moved well from isolated footwork to competitive. The skill-game balance could use more competition reps — the drill-to-scrimmage ratio ran about 3:1.",
  },
  {
    id: "c2",
    planName: "16U Tuesday — Pick-and-Roll Defense",
    coachName: "Coach Tanya Okafor",
    reviewedDate: "Apr 29, 2026",
    scores: { clarity: 5, ageProgression: 4, timeEfficiency: 5, skillGameBalance: 4 },
    feedbackExcerpt:
      "Really well-structured plan. The clock management across blocks was tight. Loved the competitive close-out exit drill. Minor note: the ICE coverage section needed a clearer coaching cue callout.",
  },
  {
    id: "c3",
    planName: "13U Saturday — Dribble Penetration",
    coachName: "Coach Marcus Bell",
    reviewedDate: "Apr 22, 2026",
    scores: { clarity: 3, ageProgression: 4, timeEfficiency: 3, skillGameBalance: 4 },
    feedbackExcerpt:
      "Good age-appropriate progressions overall. The objectives section was light on specifics — hard to evaluate the session against intent without knowing the target skill level for the group.",
  },
];

const RUBRIC_LABELS: Record<RubricKey, string> = {
  clarity: "Clarity of objectives",
  ageProgression: "Age-appropriate progression",
  timeEfficiency: "Time efficiency",
  skillGameBalance: "Skill-game balance",
};

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";

function scoreColor(n: number): string {
  if (n >= 4.5) return SUCCESS;
  if (n >= 3) return PRIMARY;
  return WARNING;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className="w-5 h-5"
            style={{
              fill: n <= value ? WARNING : "transparent",
              color: n <= value ? WARNING : "oklch(0.40 0.02 260)",
            }}
          />
        </button>
      ))}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <span className="text-[12px] font-bold" style={{ color: scoreColor(score) }}>
          {score}/5
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "oklch(0.22 0.01 260)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${(score / 5) * 100}%`, background: scoreColor(score) }}
        />
      </div>
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  plan,
  onClose,
}: {
  plan: PracticePlanCard;
  onClose: () => void;
}) {
  const [ratings, setRatings] = useState<RubricRatings>({
    clarity: 0,
    ageProgression: 0,
    timeEfficiency: 0,
    skillGameBalance: 0,
  });
  const [feedback, setFeedback] = useState("");

  function handleSubmit() {
    const allRated = Object.values(ratings).every((v) => v > 0);
    if (!allRated) {
      toast.error("Please rate all four rubric criteria before submitting.");
      return;
    }
    toast.success("Review submitted!");
    onClose();
  }

  const totalMin = plan.blocks.reduce((s, b) => s + b.duration, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "oklch(0.08 0.01 260 / 0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wide mb-0.5">
              {plan.coachName} · {plan.ageGroup} · {plan.date}
            </p>
            <h2 className="text-[16px] font-bold leading-snug">{plan.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center w-[44px] h-[44px] rounded-xl border border-border hover:bg-muted/30 transition-colors"
            aria-label="Close review"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Plan summary */}
          <div className="px-5 py-4 border-b border-border space-y-3">
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {totalMin} min total
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {plan.blocks.length} blocks
              </span>
            </div>
            <div className="space-y-2">
              {plan.blocks.map((block, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-border"
                >
                  <span className="text-[13px] font-medium">{block.label}</span>
                  <span className="text-[12px] text-muted-foreground">{block.duration} min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rubric */}
          <div className="px-5 py-4 space-y-5">
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Rubric
            </p>
            {(Object.keys(RUBRIC_LABELS) as RubricKey[]).map((key) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[13px] font-semibold">{RUBRIC_LABELS[key]}</label>
                <StarRating
                  value={ratings[key]}
                  onChange={(n) => setRatings((prev) => ({ ...prev, [key]: n }))}
                />
              </div>
            ))}

            {/* Written feedback */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold" htmlFor="review-feedback">
                Written Feedback
              </label>
              <textarea
                id="review-feedback"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What worked well? What would you adjust? Be specific and constructive."
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.18_290_/_0.35)]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PracticeReviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [reviewingPlan, setReviewingPlan] = useState<PracticePlanCard | null>(null);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "queue", label: "Review Queue", count: QUEUE_PLANS.length },
    { key: "mine", label: "My Plans Under Review", count: PLANS_UNDER_REVIEW.length },
    { key: "completed", label: "Completed Reviews", count: COMPLETED_REVIEWS.length },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          eyebrow="COACHING EDUCATION"
          title="Practice Peer Review"
          subtitle="Give and receive structured feedback on practice plans. Better plans = better practices."
        />

        {/* Tab toggle */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2"
                style={
                  active
                    ? { background: PRIMARY, color: "white" }
                    : { background: "oklch(0.18 0.01 260)", color: "oklch(0.60 0.02 260)" }
                }
              >
                {tab.label}
                <span
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={
                    active
                      ? { background: "oklch(1 0 0 / 0.2)", color: "white" }
                      : { background: "oklch(0.25 0.01 260)", color: "oklch(0.60 0.02 260)" }
                  }
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Review Queue ── */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {QUEUE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 space-y-2">
                  <h3 className="text-[15px] font-bold leading-snug">{plan.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {plan.coachName}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {plan.date}
                    </span>
                    <span
                      className="font-semibold px-2 py-0.5 rounded-full text-[11px]"
                      style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: PRIMARY }}
                    >
                      {plan.ageGroup}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{plan.estimatedReviewMin} min to review
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {plan.blocks.map((block, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-1 rounded-lg border border-border text-muted-foreground"
                      >
                        {block.duration}m · {block.label}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setReviewingPlan(plan)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[13px] text-white transition-all hover:opacity-90"
                  style={{ background: PRIMARY }}
                >
                  Start Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── My Plans Under Review ── */}
        {activeTab === "mine" && (
          <div className="space-y-4">
            {PLANS_UNDER_REVIEW.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <h3 className="text-[15px] font-bold leading-snug">{plan.name}</h3>
                  <p className="text-[12px] text-muted-foreground">
                    Submitted {plan.submittedDate}
                  </p>
                </div>
                <div className="shrink-0">
                  {plan.status === "awaiting" ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: "oklch(0.78 0.16 75 / 0.12)", color: WARNING }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting Review
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: PRIMARY }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {plan.reviewsReceived} of {plan.reviewsTotal} reviews received
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Completed Reviews ── */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            {COMPLETED_REVIEWS.map((review) => {
              const avgScore =
                Object.values(review.scores).reduce((s, v) => s + v, 0) /
                Object.keys(review.scores).length;
              return (
                <div
                  key={review.id}
                  className="rounded-2xl border border-border bg-card p-5 space-y-4"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-[15px] font-bold leading-snug">{review.planName}</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {review.coachName} · Reviewed {review.reviewedDate}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[14px] font-bold px-3 py-1 rounded-full self-start"
                      style={{
                        background: `${scoreColor(avgScore)}18`,
                        color: scoreColor(avgScore),
                      }}
                    >
                      Avg {avgScore.toFixed(1)}/5
                    </span>
                  </div>

                  {/* Score bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(RUBRIC_LABELS) as RubricKey[]).map((key) => (
                      <ScoreBar key={key} label={RUBRIC_LABELS[key]} score={review.scores[key]} />
                    ))}
                  </div>

                  {/* Feedback excerpt */}
                  <div
                    className="rounded-xl p-3 text-[12px] leading-relaxed italic"
                    style={{
                      background: "oklch(0.14 0.01 260 / 0.5)",
                      color: "oklch(0.65 0.03 260)",
                      borderLeft: `3px solid ${PRIMARY}`,
                    }}
                  >
                    "{review.feedbackExcerpt}"
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingPlan && (
        <ReviewModal plan={reviewingPlan} onClose={() => setReviewingPlan(null)} />
      )}
    </AppShell>
  );
}
