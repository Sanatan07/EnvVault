"use client";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { AuditFilters } from "@/components/audit/AuditFilters";
import { AuditExportButton } from "@/components/audit/AuditExportButton";
import { orgsApi } from "@/lib/api";
import { useAuditLog } from "@/hooks/useAuditLog";

interface PageProps {
  params: Promise<{ org_slug: string }>;
}

export default function AuditPage({ params }: PageProps) {
  const { org_slug } = use(params);
  const [filters, setFilters] = useState({ action: "", env: "", from: "", to: "" });

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);

  const queryParams: Record<string, string> = {};
  if (org?.id) queryParams.org_id = org.id;
  if (filters.action) queryParams.action = filters.action;
  if (filters.env) queryParams.env = filters.env;
  if (filters.from) queryParams.from = filters.from;
  if (filters.to) queryParams.to = filters.to;

  const { data, isLoading } = useAuditLog(queryParams);
  const events = data?.results ?? [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Audit Log" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-semibold">Audit Log</h2>
            <AuditExportButton params={queryParams} />
          </div>

          <div className="mb-4">
            <AuditFilters
              filters={filters}
              onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
              onReset={() => setFilters({ action: "", env: "", from: "", to: "" })}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded bg-gray-100 animate-pulse" />)}
            </div>
          ) : (
            <AuditLogTable events={events} />
          )}

          {data && (
            <p className="mt-4 text-xs text-gray-400">
              Showing {events.length} of {data.count} events
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
