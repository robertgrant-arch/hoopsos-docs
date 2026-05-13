import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "../client";

export type Assignment = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  playerId: string | null;
  filmClipId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  payload: unknown;
  createdAt: string;
};

export type ComplianceByPlayer = {
  playerId: string;
  name: string;
  total: number;
  completed: number;
  rate: number;
};

export function useAssignments(filters?: { playerId?: string; status?: string }) {
  return useQuery({
    queryKey: ["assignments", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.playerId) params.set("playerId", filters.playerId);
      if (filters?.status) params.set("status", filters.status);
      const qs = params.toString();
      return apiGet<Assignment[]>(`/assignments${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Assignment>) =>
      apiPost<Assignment>("/assignments", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useCompleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiPatch<{ ok: boolean }>(`/assignments/${id}/complete`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useReviewAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiPatch<{ ok: boolean }>(`/assignments/${id}/review`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useComplianceByPlayer() {
  return useQuery({
    queryKey: ["assignments", "compliance", "by-player"],
    queryFn: () => apiGet<ComplianceByPlayer[]>("/assignments/compliance/by-player"),
  });
}
