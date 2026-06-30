import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/lib/api";

export function useAuditLog(params: Record<string, string>) {
  return useQuery({
    queryKey: ["audit-log", params],
    queryFn: () => auditApi.list(params),
    enabled: Object.keys(params).some((k) => !!params[k]),
  });
}

export function useAuditStats(orgId: string) {
  return useQuery({
    queryKey: ["audit-stats", orgId],
    queryFn: () => auditApi.stats(orgId),
    enabled: !!orgId,
  });
}
