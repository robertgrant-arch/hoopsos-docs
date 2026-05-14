import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

export type WearableProvider = "apple_health" | "whoop" | "garmin" | "oura";

export type WearableConnection = {
  id: string;
  provider: WearableProvider;
  status: string;
  lastSyncedAt: string | null;
};

export type WearableMetrics = {
  provider: string;
  recordedDate: string;
  recoveryScore: number | null;
  hrv: number | null;
  restingHr: number | null;
  sleepScore: number | null;
  sleepDurationMins: number | null;
  strainScore: number | null;
  steps: number | null;
};

export type WearableSharing = {
  shareRecovery: boolean;
  shareSleep: boolean;
  shareStrain: boolean;
  shareHeartRate: boolean;
  shareWithCoaches: boolean;
  shareWithTeam: boolean;
};

export function useMyConnections() {
  return useQuery({
    queryKey: ["wearables", "connections"],
    queryFn: () => apiGet<WearableConnection[]>("/wearables/me/connections"),
  });
}

export function useMyMetrics() {
  return useQuery({
    queryKey: ["wearables", "metrics"],
    queryFn: () => apiGet<WearableMetrics[]>("/wearables/me/metrics"),
  });
}

export function useMyMetricsHistory(days = 30) {
  return useQuery({
    queryKey: ["wearables", "metrics", "history", days],
    queryFn: () =>
      apiGet<WearableMetrics[]>(`/wearables/me/metrics/history?days=${days}`),
  });
}

export function useMySharing() {
  return useQuery({
    queryKey: ["wearables", "sharing"],
    queryFn: () => apiGet<WearableSharing>("/wearables/me/sharing"),
  });
}

export function useUpdateSharing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<WearableSharing>) =>
      apiPatch<WearableSharing>("/wearables/me/sharing", settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wearables", "sharing"] });
    },
  });
}

export function useConnectProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: WearableProvider) =>
      apiPost<{ connectionId: string; authUrl: string | null; message: string }>(
        `/wearables/connect/${provider}`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wearables", "connections"] });
    },
  });
}

export function useDisconnectProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: WearableProvider) =>
      apiDelete(`/wearables/disconnect/${provider}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wearables", "connections"] });
    },
  });
}

export function usePlayerWearables(playerId: string) {
  return useQuery({
    queryKey: ["wearables", "player", playerId],
    queryFn: () => apiGet<WearableMetrics[]>(`/wearables/player/${playerId}`),
    enabled: !!playerId,
  });
}
