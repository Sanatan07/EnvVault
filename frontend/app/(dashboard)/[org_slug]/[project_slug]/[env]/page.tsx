"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload, ArrowRightLeft, AlertTriangle, ShieldAlert } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { EnvTabs } from "@/components/layout/EnvTabs";
import { SecretsTable } from "@/components/secrets/SecretsTable";
import { AddSecretDialog } from "@/components/secrets/AddSecretDialog";
import { ImportEnvDialog } from "@/components/secrets/ImportEnvDialog";
import { PromoteDialog } from "@/components/secrets/PromoteDialog";
import { ExportButton } from "@/components/secrets/ExportButton";
import { Button } from "@/components/ui/Button";
import { orgsApi, projectsApi } from "@/lib/api";
import { useSecrets, useEnvironments } from "@/hooks/useSecrets";
import { useUsage } from "@/hooks/useBilling";

interface PageProps {
  params: { org_slug: string; project_slug: string; env: string };
}

export default function SecretsPage({ params }: PageProps) {
  const { org_slug, project_slug, env } = params;
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);

  const { data: projects } = useQuery({
    queryKey: ["projects", org?.id],
    queryFn: () => projectsApi.list(org!.id),
    enabled: !!org?.id,
  });
  const project = projects?.find((p) => p.slug === project_slug);

  const { data: environments = [], refetch: refetchEnvs } = useEnvironments(project?.id ?? "");
  const { data: secrets = [], isLoading, refetch: refetchSecrets } = useSecrets(project?.id ?? "", env);
  const { data: usageData, refetch: refetchUsage } = useUsage(org?.id ?? "");

  const currentPlan = usageData?.account?.plan ?? org?.plan ?? "free";
  const secretReads = usageData?.current_period?.secret_reads ?? 0;
  const limit = usageData?.account?.reads_limit ?? null;

  const isOverLimit = limit ? secretReads >= limit : false;
  const isNearLimit = limit ? secretReads >= limit * 0.8 && secretReads < limit : false;

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} projectSlug={project_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={`${project.name} — ${env}`} />
        <EnvTabs
          environments={environments}
          orgSlug={org_slug}
          projectSlug={project_slug}
          activeEnv={env}
        />
        <main className="flex-1 overflow-auto min-w-0">
          {/* Billing warning banners */}
          {isOverLimit && (
            <div className="flex items-center gap-3 bg-red-50 px-6 py-3 border-b border-red-200 text-red-800 text-sm">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <span className="font-semibold">Plan limit exceeded:</span> You have used {secretReads} / {limit} reads this month.
                {usageData?.account?.block_reads_at_limit ? " Access is currently blocked." : ""} Please upgrade your plan in billing to avoid service disruption.
              </div>
            </div>
          )}
          {!isOverLimit && isNearLimit && (
            <div className="flex items-center gap-3 bg-amber-50 px-6 py-3 border-b border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold">Approaching limit:</span> You have used {secretReads} / {limit} (80%+) of your plan's secret reads. Please consider upgrading.
              </div>
            </div>
          )}

          <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {secrets.length} secret{secrets.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <ExportButton projectId={project.id} env={env} />
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPromoteOpen(true)} className="gap-1.5">
                <ArrowRightLeft className="h-4 w-4" />
                Promote
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5" disabled={isOverLimit && usageData?.account?.block_reads_at_limit}>
                <Plus className="h-4 w-4" />
                Add Secret
              </Button>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 rounded bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <SecretsTable secrets={secrets} projectId={project.id} env={env} />
            )}
          </div>
        </main>
      </div>

      <AddSecretDialog open={addOpen} onClose={() => { setAddOpen(false); refetchSecrets(); }} projectId={project.id} env={env} />
      <ImportEnvDialog open={importOpen} onClose={() => { setImportOpen(false); refetchSecrets(); }} projectId={project.id} env={env} />
      <PromoteDialog
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        projectId={project.id}
        currentEnv={env}
        environments={environments}
        onPromoted={() => {
          refetchSecrets();
          refetchUsage();
        }}
      />
    </div>
  );
}
