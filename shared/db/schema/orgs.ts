// shared/db/schema/orgs.ts
// Tenancy root: orgs + memberships. Every domain table FKs back to orgs.id.

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { orgPlanEnum, orgRoleEnum } from "./_enums";

export const orgs = pgTable(
  "orgs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    plan: orgPlanEnum("plan").notNull().default("free"),
    // Stripe customer id, set by PR 6.
    stripeCustomerId: text("stripe_customer_id"),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    slugUnique: uniqueIndex("orgs_slug_unique").on(t.slug),
  }),
);

export const orgMembers = pgTable(
  "org_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    // userId is sourced from the auth provider (Clerk/Supabase). Kept as text
    // so we are not coupled to a specific auth schema in this package.
    userId: text("user_id").notNull(),
    role: orgRoleEnum("role").notNull().default("viewer"),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgUserUnique: uniqueIndex("org_members_org_user_unique").on(
      t.orgId,
      t.userId,
    ),
    byUser: index("org_members_user_idx").on(t.userId),
  }),
);

export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type OrgMember = typeof orgMembers.$inferSelect;
export type NewOrgMember = typeof orgMembers.$inferInsert;
