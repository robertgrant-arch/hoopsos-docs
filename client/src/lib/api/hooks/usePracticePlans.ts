import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "../client";

export type PracticePlan = {
  id: string;
  title: string;
  scheduledAt: string | null;
  status: string;
  location: string | null;
  durationMins: number | null;
  payload: unknown;
  coachNotes: string | null;
  postPracticeNotes: string | null;
  createdAt: string;
};

export function usePracticePlans() {
  return useQuery({
    queryKey: ["practice-plans"],
    queryFn: () => apiGet<PracticePlan[]>("/practice-plans"),
  });
}

export function usePracticePlan(id: string) {
  return useQuery({
    queryKey: ["practice-plans", id],
    queryFn: () => apiGet<PracticePlan>(`/practice-plans/${id}`),
    enabled: !!id,
  });
}

export function useCreatePracticePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PracticePlan>) =>
      apiPost<PracticePlan>("/practice-plans", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice-plans"] }),
  });
}

export function useSavePracticePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PracticePlan> & { id: string }) =>
      apiPatch<{ ok: boolean }>(`/practice-plans/${id}`, data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["practice-plans", vars.id] }),
  });
}

export function useSavePostPracticeNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postPracticeNotes }: { id: string; postPracticeNotes: string }) =>
      apiPatch<{ ok: boolean }>(`/practice-plans/${id}/post-notes`, {
        postPracticeNotes,
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["practice-plans", vars.id] }),
  });
}
