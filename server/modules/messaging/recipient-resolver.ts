/**
 * Recipient resolver — pure function, no side effects.
 * Takes a RecipientSpec + roster + guardian list and returns a fully resolved,
 * deduped set of player and guardian recipients with any warnings.
 */

import type { Player } from "@shared/db/schema/players";
import type { PlayerGuardian } from "@shared/db/schema/guardians";

// ---- Mirror of client types (avoid a shared circular import) ---------------

type AudienceMode = "players" | "parents" | "both" | "individuals";
type PlayerScope  = "all" | "specific";

export interface RecipientSpec {
  mode: AudienceMode;
  playerScope: PlayerScope;
  selectedPlayerIds: string[];
  individuals: Array<{
    type: "player" | "guardian";
    id: string;
    playerId: string;
  }>;
}

export interface ResolvedPlayer {
  playerId: string;
  name: string;
  userId: string | null;
}

export interface ResolvedGuardian {
  guardianId: string;
  playerId:   string;
  playerName: string;
  name:       string;
  email:      string | null;
  phone:      string | null;
}

export interface AudienceWarning {
  playerId:   string;
  playerName: string;
  message:    string;
}

export interface ResolvedAudience {
  players:         ResolvedPlayer[];
  guardians:       ResolvedGuardian[];
  totalContacts:   number;
  playerWarnings:  AudienceWarning[];
  guardianWarnings: AudienceWarning[];
}

// ----------------------------------------------------------------------------

function activeOnly(players: Player[]): Player[] {
  return players.filter((p) => !p.deletedAt && p.status !== "inactive");
}

function scopePlayers(
  all: Player[],
  scope: PlayerScope,
  selectedIds: string[]
): Player[] {
  if (scope === "all") return activeOnly(all);
  return activeOnly(all).filter((p) => selectedIds.includes(p.id));
}

function toResolvedPlayer(p: Player): ResolvedPlayer {
  return { playerId: p.id, name: p.name, userId: p.userId ?? null };
}

function guardianHasContact(g: PlayerGuardian): boolean {
  return !!(g.email || g.phone);
}

/** Dedupe guardian list by email (canonical identity for messaging). */
function dedupeGuardians(guardians: ResolvedGuardian[]): ResolvedGuardian[] {
  const seen = new Set<string>();
  return guardians.filter((g) => {
    const key = g.email ?? `phone:${g.phone}` ?? `id:${g.guardianId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ----------------------------------------------------------------------------

export function resolveRecipients(
  spec: RecipientSpec,
  allPlayers: Player[],
  allGuardians: PlayerGuardian[]
): ResolvedAudience {
  const { mode, playerScope, selectedPlayerIds, individuals } = spec;

  const playerWarnings:  AudienceWarning[] = [];
  const guardianWarnings: AudienceWarning[] = [];

  // --- Helper: resolve the player list for a given scope ------------------
  function getTargetPlayers(): Player[] {
    return scopePlayers(allPlayers, playerScope, selectedPlayerIds);
  }

  // --- Helper: resolve guardians for a player set -------------------------
  function getGuardiansFor(players: Player[]): ResolvedGuardian[] {
    const playerIds = new Set(players.map((p) => p.id));
    return allGuardians
      .filter((g) => !g.deletedAt && g.canReceiveMessages && playerIds.has(g.playerId))
      .map((g) => ({
        guardianId: g.id,
        playerId:   g.playerId,
        playerName: players.find((p) => p.id === g.playerId)?.name ?? "",
        name:       g.name,
        email:      g.email ?? null,
        phone:      g.phone ?? null,
      }));
  }

  // --- Mode: players -------------------------------------------------------
  if (mode === "players") {
    const targets = getTargetPlayers();
    return {
      players:          targets.map(toResolvedPlayer),
      guardians:        [],
      totalContacts:    targets.length,
      playerWarnings,
      guardianWarnings,
    };
  }

  // --- Mode: parents -------------------------------------------------------
  if (mode === "parents") {
    const targets  = getTargetPlayers();
    const resolved = getGuardiansFor(targets);

    // Warn about players with no reachable guardian
    for (const player of targets) {
      const hasGuardian = resolved.some((g) => g.playerId === player.id);
      if (!hasGuardian) {
        playerWarnings.push({
          playerId:   player.id,
          playerName: player.name,
          message:    "No linked guardian — will not receive this message",
        });
      }
    }

    // Warn about guardians with no contact method
    for (const g of allGuardians.filter(
      (g) => !g.deletedAt && targets.some((p) => p.id === g.playerId)
    )) {
      if (!guardianHasContact(g)) {
        guardianWarnings.push({
          playerId:   g.playerId,
          playerName: targets.find((p) => p.id === g.playerId)?.name ?? "",
          message:    `${g.name} has no email or phone on file`,
        });
      }
    }

    const deduped = dedupeGuardians(resolved);
    return {
      players:          [],
      guardians:        deduped,
      totalContacts:    deduped.length,
      playerWarnings,
      guardianWarnings,
    };
  }

  // --- Mode: both ----------------------------------------------------------
  if (mode === "both") {
    const targets   = getTargetPlayers();
    const guardians = getGuardiansFor(targets);

    for (const player of targets) {
      const hasGuardian = guardians.some((g) => g.playerId === player.id);
      if (!hasGuardian) {
        playerWarnings.push({
          playerId:   player.id,
          playerName: player.name,
          message:    "No linked guardian — guardian message will not be sent",
        });
      }
    }

    const deduped = dedupeGuardians(guardians);
    return {
      players:          targets.map(toResolvedPlayer),
      guardians:        deduped,
      totalContacts:    targets.length + deduped.length,
      playerWarnings,
      guardianWarnings,
    };
  }

  // --- Mode: individuals ---------------------------------------------------
  if (mode === "individuals") {
    const resolvedPlayers: ResolvedPlayer[] = [];
    const resolvedGuardians: ResolvedGuardian[] = [];

    for (const item of individuals) {
      if (item.type === "player") {
        const player = allPlayers.find((p) => p.id === item.playerId);
        if (player) resolvedPlayers.push(toResolvedPlayer(player));
      } else {
        const g = allGuardians.find((g) => g.id === item.id);
        const player = allPlayers.find((p) => p.id === item.playerId);
        if (g && player) {
          resolvedGuardians.push({
            guardianId: g.id,
            playerId:   g.playerId,
            playerName: player.name,
            name:       g.name,
            email:      g.email ?? null,
            phone:      g.phone ?? null,
          });
        }
      }
    }

    const deduped = dedupeGuardians(resolvedGuardians);
    return {
      players:          resolvedPlayers,
      guardians:        deduped,
      totalContacts:    resolvedPlayers.length + deduped.length,
      playerWarnings,
      guardianWarnings,
    };
  }

  // Unreachable — all modes handled
  return {
    players: [], guardians: [], totalContacts: 0,
    playerWarnings: [], guardianWarnings: [],
  };
}
