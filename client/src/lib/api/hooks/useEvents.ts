import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "../client";

export type Event = {
  id: string;
  title: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  homeAway: "home" | "away" | null;
  opponent: string | null;
  notes: string | null;
  createdAt: string;
};

export type EventAvailability = {
  id: string;
  eventId: string;
  playerId: string;
  status: string;
  note: string | null;
  createdAt: string;
};

export type EventAttendance = {
  id: string;
  eventId: string;
  playerId: string;
  present: boolean;
  note: string | null;
  createdAt: string;
};

export function useEvents(from?: Date) {
  return useQuery({
    queryKey: ["events", from?.toISOString()],
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from.toISOString());
      const qs = params.toString();
      return apiGet<Event[]>(`/events${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => apiGet<Event>(`/events/${id}`),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Event>) => apiPost<Event>("/events", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Event> & { id: string }) =>
      apiPatch<{ ok: boolean }>(`/events/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useEventAvailability(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "availability"],
    queryFn: () => apiGet<EventAvailability[]>(`/events/${eventId}/availability`),
    enabled: !!eventId,
  });
}

export function useSubmitAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      ...data
    }: { eventId: string } & Record<string, unknown>) =>
      apiPost<{ ok: boolean }>(`/events/${eventId}/availability`, data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["events", vars.eventId, "availability"] }),
  });
}

export function useEventAttendance(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "attendance"],
    queryFn: () => apiGet<EventAttendance[]>(`/events/${eventId}/attendance`),
    enabled: !!eventId,
  });
}

export function useSubmitAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      records,
    }: {
      eventId: string;
      records: Partial<EventAttendance>[];
    }) =>
      apiPost<{ ok: boolean }>(`/events/${eventId}/attendance`, { records }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["events", vars.eventId, "attendance"] }),
  });
}
