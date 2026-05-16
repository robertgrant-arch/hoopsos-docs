// Permission matrix for HoopsOS.
//
// Client-side only — for nav visibility and UI gating.
// All real enforcement must live server-side (tenant-scoped repo + Clerk JWT role claim).
//
// Usage:
//   can("PARENT", "view_child_progress")  // → true
//   can("ATHLETE", "create_practice_plan") // → false

import type { Role } from "@/lib/mock/users";

export type Permission =
  // Viewing own data
  | "view_own_assignments"
  | "view_own_schedule"
  | "view_own_billing"
  | "view_own_film_feedback"
  | "view_own_wod"
  | "view_own_development"
  // Athlete availability
  | "submit_availability"
  // Parent-specific
  | "view_child_progress"
  | "view_child_assignments"
  | "view_child_schedule"
  | "view_child_billing"
  | "view_child_film_summary" // summary only, not full film
  | "sign_waiver"
  | "view_announcements"
  | "rsvp_for_child"
  // Coach
  | "view_practice_notes"   // coach notes on practice; athletes see redacted version
  | "view_full_film"
  | "create_practice_plan"
  | "assign_work"
  | "manage_roster"
  | "view_all_readiness"
  | "edit_scout_report"
  // Admin
  | "manage_org"
  | "view_billing_admin"
  | "moderate_content";

const PERMISSIONS: Record<Role, Set<Permission>> = {
  ATHLETE: new Set<Permission>([
    "view_own_assignments",
    "view_own_schedule",
    "view_own_billing",
    "view_own_film_feedback",
    "view_own_wod",
    "view_own_development",
    "submit_availability",
    "view_announcements",
  ]),
  PARENT: new Set<Permission>([
    "view_child_progress",
    "view_child_assignments",
    "view_child_schedule",
    "view_child_billing",
    "view_child_film_summary",
    "sign_waiver",
    "view_announcements",
    "rsvp_for_child",
    "view_own_billing",
  ]),
  COACH: new Set<Permission>([
    "view_own_assignments",
    "view_own_schedule",
    "view_own_billing",
    "view_full_film",
    "view_practice_notes",
    "create_practice_plan",
    "assign_work",
    "manage_roster",
    "view_all_readiness",
    "edit_scout_report",
    "view_announcements",
  ]),
  TEAM_ADMIN: new Set<Permission>([
    "view_own_schedule",
    "view_billing_admin",
    "manage_roster",
    "manage_org",
    "view_announcements",
    "view_all_readiness",
    "create_practice_plan",
  ]),
  EXPERT: new Set<Permission>([
    "view_own_billing",
    "view_announcements",
  ]),
  SUPER_ADMIN: new Set<Permission>([
    "view_child_progress",
    "view_child_assignments",
    "view_child_schedule",
    "view_child_billing",
    "view_child_film_summary",
    "view_own_assignments",
    "view_own_schedule",
    "view_own_billing",
    "view_own_film_feedback",
    "view_own_wod",
    "view_own_development",
    "submit_availability",
    "sign_waiver",
    "view_announcements",
    "rsvp_for_child",
    "view_practice_notes",
    "view_full_film",
    "create_practice_plan",
    "assign_work",
    "manage_roster",
    "view_all_readiness",
    "edit_scout_report",
    "manage_org",
    "view_billing_admin",
    "moderate_content",
  ]),
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.has(permission) ?? false;
}

// Convenience hook — re-exports can() bound to the current user's role.
// Import useAuth() yourself to avoid circular deps if needed.
export function makePermissionChecker(role: Role) {
  return (permission: Permission) => can(role, permission);
}
