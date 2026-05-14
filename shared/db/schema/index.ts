// shared/db/schema/index.ts
// Barrel export. Consumers should `import { schema } from "@shared/db"`
// (which re-exports from here) so the Drizzle client always sees every table.

export * from "./_enums";
export * from "./orgs";
export * from "./film_sessions";
export * from "./film_assets";
export * from "./analysis_jobs";
export * from "./annotations";
export * from "./players";
export * from "./events";
export * from "./assignments";
export * from "./practice_plans";
export * from "./idps";
export * from "./readiness";
export * from "./messages";
export * from "./wearables";
