"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { WebhookSettings } from "@/components/integrations/WebhookSettings";
import { orgsApi } from "@/lib/api";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ org_slug: string }>;
}

export default function OrgSettingsPage({ params }: PageProps) {
  const { org_slug } = use(params);
  const qc = useQueryClient();
  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);
  const [name, setName] = useState(org?.name ?? "");

  const updateOrg = useMutation({
    mutationFn: () => orgsApi.update(org!.id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organisations"] });
      toast.success("Organisation updated");
    },
    onError: () => toast.error("Update failed"),
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Organisation Settings" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
          <Card>
            <CardHeader><CardTitle>Organisation Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Organisation Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={org?.slug ?? ""} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <Button onClick={() => updateOrg.mutate()} loading={updateOrg.isPending}>
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {org && <WebhookSettings orgId={org.id} />}
        </main>
      </div>
    </div>
  );
}
