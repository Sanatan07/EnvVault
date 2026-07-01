"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Copy, CheckCircle2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { orgsApi, projectsApi, tokensApi } from "@/lib/api";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";

interface PageProps {
  params: { org_slug: string; project_slug: string };
}

export default function TokensPage({ params }: PageProps) {
  const { org_slug, project_slug } = params;
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);
  const { data: projects } = useQuery({
    queryKey: ["projects", org?.id],
    queryFn: () => projectsApi.list(org!.id),
    enabled: !!org?.id,
  });
  const project = projects?.find((p) => p.slug === project_slug);

  const { data: tokens = [] } = useQuery({
    queryKey: ["tokens", project?.id],
    queryFn: () => tokensApi.list(project!.id),
    enabled: !!project?.id,
  });

  const createToken = useMutation({
    mutationFn: () => tokensApi.create(project!.id, { name: tokenName, scopes: ["read", "write"] }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["tokens", project?.id] });
      if (result.token) setNewToken(result.token);
      setCreateOpen(false);
      setTokenName("");
    },
    onError: () => toast.error("Failed to create token"),
  });

  const revokeToken = useMutation({
    mutationFn: (tokenId: string) => tokensApi.revoke(project!.id, tokenId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tokens", project?.id] });
      toast.success("Token revoked");
    },
    onError: () => toast.error("Failed to revoke token"),
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} projectSlug={project_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={`${project?.name} — API Tokens`} />
        <main className="flex-1 overflow-auto min-w-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">API Tokens</h2>
              <p className="text-sm text-gray-500 mt-0.5">Tokens are used to access secrets from CI/CD and CLI.</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Token
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name || "Unnamed"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {token.scopes.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {token.last_used_at ? formatRelativeDate(token.last_used_at) : "Never"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {token.expires_at ? formatDate(token.expires_at) : "Never"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(token.created_at)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => confirm("Revoke this token?") && revokeToken.mutate(token.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {tokens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-400 py-8">
                    No tokens yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New API Token</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="token-name">Token Name</Label>
            <Input id="token-name" placeholder="CI/CD token" value={tokenName} onChange={(e) => setTokenName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createToken.mutate()} loading={createToken.isPending} disabled={!tokenName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newToken} onOpenChange={() => setNewToken(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Token Created</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Copy this token now — it will never be shown again.</p>
          <div className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-3">
            <code className="flex-1 text-sm text-green-400 font-mono break-all">{newToken}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(newToken!); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="text-gray-400 hover:text-white shrink-0"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewToken(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
