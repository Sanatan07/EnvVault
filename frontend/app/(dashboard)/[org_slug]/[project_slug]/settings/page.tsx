"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { GitHubActionsSnippet } from "@/components/integrations/GitHubActionsSnippet";
import { CliInstructions } from "@/components/integrations/CliInstructions";
import { orgsApi, projectsApi } from "@/lib/api";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ org_slug: string; project_slug: string }>;
}

export default function ProjectSettingsPage({ params }: PageProps) {
  const { org_slug, project_slug } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);
  const { data: projects } = useQuery({
    queryKey: ["projects", org?.id],
    queryFn: () => projectsApi.list(org!.id),
    enabled: !!org?.id,
  });
  const project = projects?.find((p) => p.slug === project_slug);

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");

  const updateProject = useMutation({
    mutationFn: () => projectsApi.update(project!.id, { name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", org?.id] });
      toast.success("Project updated");
    },
    onError: () => toast.error("Update failed"),
  });

  const deleteProject = useMutation({
    mutationFn: () => projectsApi.delete(project!.id),
    onSuccess: () => {
      toast.success("Project deleted");
      router.push(`/${org_slug}`);
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} projectSlug={project_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={`${project?.name ?? ""} — Settings`} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
          <Card>
            <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Project Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
              </div>
              <Button onClick={() => updateProject.mutate()} loading={updateProject.isPending}>Save Changes</Button>
            </CardContent>
          </Card>

          {project && (
            <>
              <CliInstructions orgSlug={org_slug} projectSlug={project_slug} />
              <GitHubActionsSnippet projectId={project.id} env="production" />
            </>
          )}

          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-red-600">Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Permanently delete this project and all its secrets. This action cannot be undone.</p>
              <Button
                variant="destructive"
                onClick={() => confirm("Delete project? This cannot be undone.") && deleteProject.mutate()}
                loading={deleteProject.isPending}
              >
                Delete Project
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
