"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { orgsApi, projectsApi } from "@/lib/api";
import { useImportSecrets } from "@/hooks/useSecrets";
import { toast } from "sonner";

interface PageProps {
  params: { org_slug: string; project_slug: string; env: string };
}

export default function ImportPage({ params }: PageProps) {
  const { org_slug, project_slug, env } = params;
  const router = useRouter();
  const [content, setContent] = useState("");

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);
  const { data: projects } = useQuery({
    queryKey: ["projects", org?.id],
    queryFn: () => projectsApi.list(org!.id),
    enabled: !!org?.id,
  });
  const project = projects?.find((p) => p.slug === project_slug);
  const importSecrets = useImportSecrets(project?.id ?? "", env);

  async function handleImport() {
    if (!project) return;
    try {
      const result = await importSecrets.mutateAsync(content);
      toast.success(`Imported ${result.imported} secrets`);
      router.push(`/${org_slug}/${project_slug}/${env}`);
    } catch {
      toast.error("Import failed");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} projectSlug={project_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={`Import — ${env}`} />
        <main className="flex-1 overflow-auto min-w-0 p-6">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="max-w-2xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Bulk Import</h2>
              <p className="text-sm text-gray-500 mt-0.5">Paste the contents of a .env file below.</p>
            </div>
            <textarea
              className="w-full h-60 rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={"DATABASE_URL=postgres://...\nSECRET_KEY=abc123\nAPI_KEY=xyz\n"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex gap-3">
              <Button onClick={handleImport} loading={importSecrets.isPending} disabled={!content.trim()}>
                Import Secrets
              </Button>
              <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
