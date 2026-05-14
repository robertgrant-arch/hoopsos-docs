// Internal notification helper — wraps Twilio SMS and future email
import { sendSms } from "./twilio";

export async function sendCoachAlert(params: {
  coachUserId: string;
  orgId: string;
  subject: string;
  message: string;
  link?: string;
}) {
  // For now: log to console (Twilio coach SMS requires phone lookup)
  // In production: look up coach phone from org_members and send SMS
  console.log(`[COACH ALERT] ${params.subject}: ${params.message}`);
}

export async function sendParentNotification(params: {
  parentPhone?: string;
  playerName: string;
  message: string;
}) {
  if (params.parentPhone) {
    await sendSms(params.parentPhone, params.message);
  }
}
