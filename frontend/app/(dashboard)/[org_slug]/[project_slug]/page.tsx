"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { orgsApi, projectsApi } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { KeyRound } from "lucide-react";

interface PageProps {
  params: Promise<{ org_slug: string; project_slug: string }>;
}

export default function ProjectOverviewPage({ params }: PageProps) {
  const { org_slug, project_slug } = use(params);
  const router = useRouter();

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);

  const { data: projects } = useQuery({
    queryKey: ["projects", org?.id],
    queryFn: () => projectsApi.list(org!.id),
    enabled: !!org?.id,
  });
  const project = projects?.find((p) => p.slug === project_slug);

  useEffect(() => {
    if (project) {
      router.replace(`/${org_slug}/${project_slug}/production`);
    }
  }, [project, org_slug, project_slug, router]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} projectSlug={project_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={project?.name} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400">
            <KeyRound className="h-5 w-5 animate-pulse" />
            <span className="text-sm">Loading environment…</span>
          </div>
        </main>
      </div>
    </div>
  );
}
