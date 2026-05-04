/**
 * Clerk-backed tenancy for Express handlers.
 *
 * Requires `clerkMiddleware()` from `@clerk/express` ahead of routes that call
 * `requireOrg`. We read Clerk session claims via `auth(req)` (this module’s
 * thin wrapper around `getAuth`, the Express equivalent of Next.js `auth()`).
 *
 * `orgId` returned here is always the HoopsOS Postgres `orgs.id` (UUID).
 * Map Clerk organization IDs by setting `orgs.payload.clerkOrgId` or by using
 * a Clerk org id that is itself a UUID matching `orgs.id`.
 */

import { getAuth } from "@clerk/express";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { Request } from "express";
import { getDb } from "@shared/db";
import { orgMembers, orgs } from "@shared/db";

/** Express equivalent of Clerk’s `auth()` (reads the same session claims). */
export function auth(req: Request) {
  return getAuth(req);
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveDbOrgId(
  clerkOrgId: string,
  orgSlug: string | null | undefined,
): Promise<string | null> {
  const db = getDb();
  const clauses = [];
  if (looksLikeUuid(clerkOrgId)) {
    clauses.push(eq(orgs.id, clerkOrgId));
  }
  clauses.push(sql`(${orgs.payload}->>'clerkOrgId') = ${clerkOrgId}`);
  if (orgSlug) {
    clauses.push(eq(orgs.slug, orgSlug));
  }
  const rows = await db
    .select()
    .from(orgs)
    .where(and(or(...clauses), isNull(orgs.deletedAt)))
    .limit(1);
  return rows[0]?.id ?? null;
}

function teamIdFromRequest(req: Request): string {
  const header = req.get("x-hoops-team-id");
  if (header) return header;
  const clerkAuth = auth(req);
  const claims = clerkAuth.sessionClaims as
    | Record<string, unknown>
    | null
    | undefined;
  const fromClaims = claims?.teamId ?? claims?.team_id;
  if (typeof fromClaims === "string" && fromClaims.length > 0) return fromClaims;
  return "default";
}

export type RequireOrgResult = {
  userId: string;
  orgId: string;
  role: string;
  teamId: string;
};

/**
 * Resolves the active Clerk user, HoopsOS org UUID, and org_members.role.
 * @throws HttpError 401 when there is no signed-in user
 * @throws HttpError 403 when there is no Clerk org context or no DB org / membership
 */
export async function requireOrg(req: Request): Promise<RequireOrgResult> {
  const clerkAuth = auth(req);
  if (!clerkAuth.userId) {
    throw new HttpError(401, "Unauthorized");
  }
  const clerkOrgId = clerkAuth.orgId;
  if (!clerkOrgId) {
    throw new HttpError(403, "Active organization required");
  }

  const orgId = await resolveDbOrgId(clerkOrgId, clerkAuth.orgSlug ?? undefined);
  if (!orgId) {
    throw new HttpError(403, "Organization not provisioned");
  }

  const db = getDb();
  const [membership] = await db
    .select()
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.orgId, orgId),
        eq(orgMembers.userId, clerkAuth.userId),
        isNull(orgMembers.deletedAt),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new HttpError(403, "Not a member of this organization");
  }

  return {
    userId: clerkAuth.userId,
    orgId,
    role: membership.role,
    teamId: teamIdFromRequest(req),
  };
}
