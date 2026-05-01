/// <reference types="vitest/importMeta" />
import { z } from 'zod';

// === Branded ID types ===
export const PlayIdSchema = z.string().uuid().brand<'PlayId'>();
export type PlayId = z.infer<typeof PlayIdSchema>;
export const PhaseIdSchema = z.string().uuid().brand<'PhaseId'>();
export type PhaseId = z.infer<typeof PhaseIdSchema>;
export const ActorIdSchema = z.string().uuid().brand<'ActorId'>();
export type ActorId = z.infer<typeof ActorIdSchema>;
export const PathIdSchema = z.string().uuid().brand<'PathId'>();
export type PathId = z.infer<typeof PathIdSchema>;
export const VersionIdSchema = z.string().uuid().brand<'VersionId'>();
export type VersionId = z.infer<typeof VersionIdSchema>;
export const UserIdSchema = z.string().uuid().brand<'UserId'>();
export type UserId = z.infer<typeof UserIdSchema>;

// === Enums ===
export const RoleEnum = z.enum(['PG','SG','SF','PF','C']);
export type Role = z.infer<typeof RoleEnum>;
export const PathTypeEnum = z.enum(['pass','dribble','cut','screen','handoff']);
export type PathType = z.infer<typeof PathTypeEnum>;

// === Geometry ===
export const PointSchema = z.object({ x: z.number(), y: z.number() });
export type Point = z.infer<typeof PointSchema>;
export const BezierControlPointsSchema = z.object({ cp1: PointSchema, cp2: PointSchema });
export type BezierControlPoints = z.infer<typeof BezierControlPointsSchema>;

// === Tokens (discriminated union) ===
const BaseTokenSchema = z.object({ id: ActorIdSchema, position: PointSchema });
export const OffenseTokenSchema = BaseTokenSchema.extend({ kind: z.literal('offense'), role: RoleEnum });
export const DefenseTokenSchema = BaseTokenSchema.extend({ kind: z.literal('defense'), role: RoleEnum });
export const BallTokenSchema = BaseTokenSchema.extend({ kind: z.literal('ball'), attachedToActorId: ActorIdSchema.nullable() });
export const ConeTokenSchema = BaseTokenSchema.extend({ kind: z.literal('cone') });
export const TokenSchema = z.discriminatedUnion('kind', [OffenseTokenSchema, DefenseTokenSchema, BallTokenSchema, ConeTokenSchema]);
export type Token = z.infer<typeof TokenSchema>;

// === Paths ===
export const PathSchema = z.object({
  id: PathIdSchema,
  type: PathTypeEnum,
  actorId: ActorIdSchema,
  targetId: ActorIdSchema.nullable(),
  start: PointSchema,
  end: PointSchema,
  controlPoints: BezierControlPointsSchema.optional(),
});
export type PlayPath = z.infer<typeof PathSchema>;

// === Phases ===
export const PhaseSchema = z.object({
  id: PhaseIdSchema,
  name: z.string().min(1).max(50),
  tokens: z.array(TokenSchema).max(20),
  paths: z.array(PathSchema).max(40),
});
export type Phase = z.infer<typeof PhaseSchema>;

// === Versions & Plays ===
export const PlayVersionSchema = z.object({
  id: VersionIdSchema,
  semver: z.string().regex(/^\d+\.\d+\.\d+$/),
  authorId: UserIdSchema,
  parentId: VersionIdSchema.nullable(),
  createdAt: z.string().datetime(),
});
export type PlayVersion = z.infer<typeof PlayVersionSchema>;
export const PlaySchema = z.object({
  id: PlayIdSchema,
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  versions: z.array(PlayVersionSchema).max(200),
  phases: z.array(PhaseSchema).max(12),
});
export type Play = z.infer<typeof PlaySchema>;

// === Editor & Presence ===
export const EditorSelectionSchema = z.object({ actorIds: z.array(ActorIdSchema), pathIds: z.array(PathIdSchema) });
export const EditorStateSchema = z.object({
  activePhaseId: PhaseIdSchema.nullable(),
  selection: EditorSelectionSchema,
  zoom: z.number().min(0.1).max(5),
  pan: PointSchema,
});
export type EditorState = z.infer<typeof EditorStateSchema>;
export const PresenceCursorSchema = z.object({
  userId: UserIdSchema,
  position: PointSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lastSeenAt: z.string().datetime(),
});
export const ConflictRecordSchema = z.object({
  playId: PlayIdSchema,
  localVersionId: VersionIdSchema,
  remoteVersionId: VersionIdSchema,
  conflictingFields: z.array(z.string()),
  resolved: z.boolean(),
});
export const PlaybookSnapshotSchema = z.object({
  play: PlaySchema,
  editorState: EditorStateSchema,
  cursors: z.array(PresenceCursorSchema),
  conflicts: z.array(ConflictRecordSchema),
});
export type PlaybookSnapshot = z.infer<typeof PlaybookSnapshotSchema>;
export const PlaybookStoreSchema = z.object({ schemaVersion: z.literal(2), snapshot: PlaybookSnapshotSchema });
export type PlaybookStoreV2 = z.infer<typeof PlaybookStoreSchema>;

// === Migration V1 -> V2 ===
export function migrate(unknownData: unknown): PlaybookSnapshot {
  const data = unknownData as any;
  if (data && data.schemaVersion === 2) {
    return PlaybookStoreSchema.parse(data).snapshot;
  }
  if (data && data.schemaVersion === 1) {
    const v1 = data.snapshot;
    const phases = (v1.play.phases || []).map((p: any) => ({
      ...p,
      tokens: (p.tokens || []).map((t: any) => ({ ...t, kind: t.type === 'player' ? 'offense' : t.type, role: t.role || 'PG' })),
      paths: (p.paths || []).map((pth: any) => ({ ...pth, type: pth.action || 'cut' })),
    }));
    return PlaybookSnapshotSchema.parse({
      ...v1,
      play: { ...v1.play, phases, versions: v1.play.versions || [] },
      cursors: v1.cursors || [],
      conflicts: v1.conflicts || [],
    });
  }
  return PlaybookSnapshotSchema.parse(data);
}
