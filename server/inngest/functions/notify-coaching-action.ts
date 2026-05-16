import { inngest } from "../client";
import { getDb } from "@shared/db/client";
import { coachingActions } from "@shared/db/schema";
import { eq } from "drizzle-orm";

// Notify the target player when a coaching action requires their attention.
// Fires on coaching-action/created for action types that need a player response.
export const notifyCoachingActionFn = inngest.createFunction(
  {
    id: "notify-coaching-action",
    name: "Notify Player of Coaching Action",
    retries: 2,
  },
  { event: "coaching-action/created" },
  async ({ event, step }) => {
    const { actionId, orgId, actionType, playerId, coachNote, issueCategory } = event.data;

    // Only notify for action types that require a player response
    const notifiableTypes = ["request_reupload", "assign_clip", "recommend_drill"];
    if (!notifiableTypes.includes(actionType) || !playerId) {
      return { skipped: true, reason: "no player or non-notifiable type" };
    }

    // Load the action to confirm it still exists and is open
    const action = await step.run("load-action", async () => {
      const db = getDb();
      const [row] = await db
        .select()
        .from(coachingActions)
        .where(eq(coachingActions.id, actionId))
        .limit(1);
      return row ?? null;
    });

    if (!action || action.status === "dismissed") {
      return { skipped: true, reason: "action not found or dismissed" };
    }

    // Build message body based on action type
    const messageBody = await step.run("build-message", async () => {
      const categoryTag = issueCategory ? ` [${issueCategory}]` : "";
      switch (actionType) {
        case "request_reupload":
          return (
            `Your coach has requested a follow-up recording${categoryTag}. ` +
            (coachNote ? `\n\nCoach's note: "${coachNote}"` : "") +
            `\n\nHead to your Uploads page to record and submit your response.`
          );
        case "assign_clip":
          return (
            `Your coach has assigned a film clip for review${categoryTag}. ` +
            (coachNote ? `\n\nCoach's note: "${coachNote}"` : "") +
            `\n\nCheck your Coach Actions in the Development section.`
          );
        case "recommend_drill":
          return (
            `Your coach has prescribed a new drill${categoryTag}. ` +
            (coachNote ? `\n\nCoach's note: "${coachNote}"` : "") +
            `\n\nCheck your workout plan for details.`
          );
        default:
          return null;
      }
    });

    if (!messageBody) return { skipped: true, reason: "no message body built" };

    // Send in-app message to the player via the messaging module
    const sent = await step.run("send-message", async () => {
      try {
        const baseUrl = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
        const resp = await fetch(`${baseUrl}/api/messages/compose`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-inngest-internal": "1",
            "x-hoops-org-id": orgId,
          },
          body: JSON.stringify({
            spec: {
              type: "direct",
              recipientIds: [playerId],
            },
            title: actionTypeTitle(actionType),
            body: messageBody,
          }),
        });
        return resp.ok ? "sent" : `error:${resp.status}`;
      } catch {
        return "network-error";
      }
    });

    return { actionId, playerId, actionType, sent };
  },
);

function actionTypeTitle(actionType: string): string {
  switch (actionType) {
    case "request_reupload":  return "New Re-upload Request from Coach";
    case "assign_clip":       return "Film Clip Assigned for Review";
    case "recommend_drill":   return "New Drill Prescription";
    default:                  return "Coaching Action";
  }
}
