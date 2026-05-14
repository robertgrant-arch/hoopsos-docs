import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

// Types (subset of DB schema shape)
export type Player = {
  id: string;
  name: string;
  position: string | null;
  jerseyNumber: number | null;
  grade: string | null;
  gradYear: number | null;
  height: string | null;
  weight: number | null;
  status: "active" | "injured" | "suspended" | "inactive";
  role: string | null;
  parentGuardianName: string | null;
  parentGuardianEmail: string | null;
  createdAt: string;
};

export function useRoster() {
  return useQuery({
    queryKey: ["roster"],
    queryFn: () => apiGet<Player[]>("/roster"),
  });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ["roster", id],
    queryFn: () => apiGet<Player>(`/roster/${id}`),
    enabled: !!id,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Player>) => apiPost<Player>("/roster", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roster"] }),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Player> & { id: string }) =>
      apiPatch<{ ok: boolean }>(`/roster/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roster"] }),
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/roster/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roster"] }),
  });
}
