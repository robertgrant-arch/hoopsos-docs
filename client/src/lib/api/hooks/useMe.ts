import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../client";

export type Me = { userId: string; orgId: string; role: string };

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<Me>("/me"),
    staleTime: 5 * 60 * 1000, // 5 min — role doesn't change often
    retry: false,
  });
}
