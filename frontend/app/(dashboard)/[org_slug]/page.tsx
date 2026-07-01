"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { orgsApi, projectsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface PageProps {
  params: { org_slug: string };
}

export default function OrgOverviewPage({ params }: PageProps) {
  const { org_slug } = params;
  const router = useRouter();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", org?.id],
    queryFn: () => projectsApi.list(org!.id),
    enabled: !!org?.id,
  });

  const createProject = useMutation({
    mutationFn: () =>
      projectsApi.create({ org_id: org!.id, name: projectName }),
    onSuccess: (proj) => {
      qc.invalidateQueries({ queryKey: ["projects", org?.id] });
      toast.success(`Project "${proj.name}" created`);
      setCreateOpen(false);
      setProjectName("");
      router.push(`/${org_slug}/${proj.slug}`);
    },
    onError: () => toast.error("Failed to create project"),
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={org?.name} />
        <main className="flex-1 overflow-auto min-w-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Projects</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {projects?.length ?? 0} project{projects?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No projects yet. Create your first project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects?.map((project) => (
                <button
                  key={project.id}
                  onClick={() => router.push(`/${org_slug}/${project.slug}`)}
                  className="text-left rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
                  )}
                  <p className="mt-3 text-xs text-gray-400">Created {formatDate(project.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Project Name</Label>
            <Input
              id="proj-name"
              placeholder="my-app"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && projectName && createProject.mutate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createProject.mutate()} loading={createProject.isPending} disabled={!projectName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
