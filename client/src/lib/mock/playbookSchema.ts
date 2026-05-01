import { z } from "zod";

export const playTokenSchema = z.strictObject({
  id: z.string(),
  type: z.enum(["OFFENSE", "DEFENSE", "BALL", "CONE"]),
  label: z.string(),
  x: z.number().min(0).max(800),
  y: z.number().min(0).max(600),
});

export const playPathSchema = z.strictObject({
  id: z.string(),
  type: z.enum(["PASS", "DRIBBLE", "CUT", "SCREEN", "HANDOFF"]),
  points: z.array(z.number()).min(4).max(6),
  startTokenId: z.string().optional(),
  endTokenId: z.string().optional(),
});

export const playPhaseSchema = z.strictObject({
  id: z.string(),
  order: z.number().int().nonnegative(),
  phase: z.enum(["ENTRY", "TRIGGER", "READ_1", "READ_2", "COUNTER", "SAFETY"]),
  notes: z.string(),
  tokens: z.array(playTokenSchema),
  paths: z.array(playPathSchema),
});

export const playSchema = z.strictObject({
  id: z.string(),
  playbookId: z.string(),
  title: z.string(),
  description: z.string(),
  courtType: z.enum(["HALF", "FULL"]),
  category: z.enum(["PRIMARY", "SLOB", "BLOB", "ATO", "MOTION", "ZONE_OFFENSE", "PRESS_BREAK"]),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  versionLabel: z.string(),
  phases: z.array(playPhaseSchema),
});

export const playVersionSchema = z.strictObject({
  id: z.string(),
  label: z.string(),
  savedAt: z.string(),
  authorName: z.string(),
  snapshot: playSchema,
});

export const editorSelectionSchema = z.union([
  z.strictObject({ type: z.literal("token"), id: z.string() }),
  z.strictObject({ type: z.literal("path"), id: z.string() }),
]);

export const editorStateSchema = z.strictObject({
  selectedPlayId: z.string().nullable(),
  selectedPhaseId: z.string().nullable(),
  selectedTokenId: z.string().nullable(),
  selectedPathId: z.string().nullable(),
});

export const playbookSnapshotSchema = z.strictObject({
  plays: z.array(playSchema),
  versionHistory: z.record(z.string(), z.array(playVersionSchema)),
  selectedPlayId: z.string().nullable(),
  selectedPhaseId: z.string().nullable(),
  selectedTokenId: z.string().nullable(),
  selectedPathId: z.string().nullable(),
  authorName: z.string(),
});

export const playbookStoreSchema = z.strictObject({
  ...playbookSnapshotSchema.shape,
  past: z.array(playbookSnapshotSchema),
  future: z.array(playbookSnapshotSchema),
});

export type PlayToken = z.infer<typeof playTokenSchema>;
export type PlayPath = z.infer<typeof playPathSchema>;
export type PlayPhase = z.infer<typeof playPhaseSchema>;
export type Play = z.infer<typeof playSchema>;
export type PlayVersion = z.infer<typeof playVersionSchema>;
export type EditorSelection = z.infer<typeof editorSelectionSchema>;
export type EditorState = z.infer<typeof editorStateSchema>;
