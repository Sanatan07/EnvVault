"use client";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { EnvTabs } from "@/components/layout/EnvTabs";
import { SecretsTable } from "@/components/secrets/SecretsTable";
import { AddSecretDialog } from "@/components/secrets/AddSecretDialog";
import { ImportEnvDialog } from "@/components/secrets/ImportEnvDialog";
import { ExportButton } from "@/components/secrets/ExportButton";
import { Button } from "@/components/ui/Button";
import { orgsApi, projectsApi } from "@/lib/api";
import { useSecrets, useEnvironments } from "@/hooks/useSecrets";

interface PageProps {
  params: Promise<{ org_slug: string; project_slug: string; env: string }>;
}

export default function SecretsPage({ params }: PageProps) {
  const { org_slug, project_slug, env } = use(params);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);

  const { data: projects } = useQuery({
    queryKey: ["projects", org?.id],
    queryFn: () => projectsApi.list(org!.id),
    enabled: !!org?.id,
  });
  const project = projects?.find((p) => p.slug === project_slug);

  const { data: environments = [] } = useEnvironments(project?.id ?? "");
  const { data: secrets = [], isLoading } = useSecrets(project?.id ?? "", env);

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
        <main className="flex-1 overflow-y-auto">
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
              <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
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

      <AddSecretDialog open={addOpen} onClose={() => setAddOpen(false)} projectId={project.id} env={env} />
      <ImportEnvDialog open={importOpen} onClose={() => setImportOpen(false)} projectId={project.id} env={env} />
    </div>
  );
}
