// shared/db/index.ts
// Top-level barrel for the @shared/db package.
// Server code should only ever import from here, never from a deeper path.

export { getDb, resetDb, type Db } from "./client";
export * as schema from "./schema";
export * from "./schema";
