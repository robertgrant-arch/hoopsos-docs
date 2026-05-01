import { z } from "zod";
import { playbookStoreSchema, playbookSnapshotSchema } from "./mock/playbookSchema";
type PlaybookSnapshot = z.infer<typeof playbookSnapshotSchema>;

/**
 * Runtime guards for the Playbook Store.
 *
 * These are deliberately additive: they do NOT replace the existing
 * Zustand store in `playbookStore.ts`. They give callers a safe way to
 * validate hydration data and snapshots without breaking the current
 * store contract. The full v2 store migration is tracked in
 * `client/src/components/playbook/MIGRATION.md`.
 */

export type GuardResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: z.ZodError };

/** Validate a parsed JSON value against the strict playbook store schema. */
export function validatePlaybookStore(value: unknown): GuardResult<z.infer<typeof playbookStoreSchema>> {
  const parsed = playbookStoreSchema.safeParse(value);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, error: parsed.error };
}

/**
 * Safe localStorage hydration. Returns the validated value, or null if
 * missing/invalid. On invalid data we log a structured warning so the
 * UI layer can show a recovery prompt rather than crash.
 */
export function safeLoadFromStorage(key: string): z.infer<typeof playbookStoreSchema> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const json = JSON.parse(raw);
    const result = validatePlaybookStore(json);
    if (result.ok) return result.data;
    console.warn("[playbook] persisted store failed schema validation", {
      key,
      issues: result.error.issues.slice(0, 5),
    });
    return null;
  } catch (e) {
    console.warn("[playbook] failed to read persisted store", e);
    return null;
  }
}

/** Throwing variant for tests / dev-time assertions. */
export function assertPlaybookStore(value: unknown): asserts value is PlaybookSnapshot {
  const result = validatePlaybookStore(value);
  if (!result.ok) {
    throw new Error(`Invalid playbook store: ${result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
}
