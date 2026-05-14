import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../client";

export type ReadinessCheckin = {
  id: string;
  playerId: string;
  fatigue: number;
  sleep: number;
  soreness: number;
  mood: number;
  note: string | null;
  flagged: boolean;
  checkedInAt: string;
};

export function useTeamReadinessToday() {
  return useQuery({
    queryKey: ["readiness", "today"],
    queryFn: () => apiGet<ReadinessCheckin[]>("/readiness/today"),
  });
}

export function usePlayerReadiness(playerId: string, days = 30) {
  return useQuery({
    queryKey: ["readiness", "player", playerId, days],
    queryFn: () =>
      apiGet<ReadinessCheckin[]>(`/readiness/player/${playerId}?days=${days}`),
    enabled: !!playerId,
  });
}

export function useSubmitReadiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ReadinessCheckin>) =>
      apiPost<{ ok: boolean }>("/readiness", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["readiness", "today"] });
    },
  });
}
