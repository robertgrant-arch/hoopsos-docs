// Shared types for the messaging compose and recipient targeting system.

export type AudienceMode = "players" | "parents" | "both" | "individuals";
export type PlayerScope  = "all" | "specific";

/** A single item in an Individuals-mode selection. */
export type IndividualRecipient =
  | {
      type: "player";
      id: string;           // player id
      playerId: string;
      displayName: string;
      subtitle: string;     // "SG · 6'4\""
    }
  | {
      type: "guardian";
      id: string;           // guardian id
      playerId: string;
      displayName: string;
      subtitle: string;     // "Guardian · Jalen Carter"
      relationship: string;
    };

/** Full spec of who a compose action is targeting — serialized for API submission. */
export interface RecipientSpec {
  mode: AudienceMode;
  playerScope: PlayerScope;            // relevant when mode !== 'individuals'
  selectedPlayerIds: string[];         // relevant when playerScope === 'specific'
  individuals: IndividualRecipient[];  // relevant when mode === 'individuals'
}

export const defaultRecipientSpec = (): RecipientSpec => ({
  mode: "players",
  playerScope: "all",
  selectedPlayerIds: [],
  individuals: [],
});

/** Resolved audience counts returned from the resolver (client-side or API). */
export interface ResolvedAudience {
  playerCount: number;
  guardianCount: number;
  totalContacts: number;
  playerWarnings: AudienceWarning[];   // e.g., players with no guardian when mode includes parents
  guardianWarnings: AudienceWarning[]; // e.g., guardians with no email or phone
}

export interface AudienceWarning {
  playerId: string;
  playerName: string;
  message: string;
}

/** Minimal guardian shape used on the client side. */
export interface GuardianEntry {
  id: string;
  playerId: string;
  playerName: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship: string;
  isPrimary: boolean;
  canReceiveMessages: boolean;
}
