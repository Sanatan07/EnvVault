"use client";
import { useState } from "react";
import { Eye, EyeOff, Copy, Pencil, Trash2, History, CheckCircle2, AlertTriangle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EditSecretDialog } from "./EditSecretDialog";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
import { secretsApi } from "@/lib/api";
import { formatRelativeDate, maskSecret } from "@/lib/utils";
import { useDeleteSecret } from "@/hooks/useSecrets";
import { toast } from "sonner";
import type { Secret } from "@/types";

interface SecretsTableProps {
  secrets: Secret[];
  projectId: string;
  env: string;
}

export function SecretsTable({ secrets, projectId, env }: SecretsTableProps) {
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [loadingReveal, setLoadingReveal] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const deleteSecret = useDeleteSecret(projectId, env);

  async function revealSecret(key: string) {
    if (revealed[key]) {
      setRevealed((prev) => { const next = { ...prev }; delete next[key]; return next; });
      return;
    }
    setLoadingReveal(key);
    try {
      const detail = await secretsApi.get(projectId, env, key);
      setRevealed((prev) => ({ ...prev, [key]: detail.value }));
    } catch {
      toast.error("Failed to reveal secret");
    } finally {
      setLoadingReveal(null);
    }
  }

  async function copySecret(key: string) {
    const value = revealed[key] ?? (await secretsApi.get(projectId, env, key).then((d) => d.value).catch(() => null));
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
    toast.success("Copied to clipboard");
  }

  async function handleDelete(key: string) {
    if (!confirm(`Delete secret "${key}"?`)) return;
    try {
      await deleteSecret.mutateAsync(key);
      toast.success("Secret deleted");
    } catch {
      toast.error("Failed to delete secret");
    }
  }

  if (secrets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-400 text-sm">No secrets yet. Add your first secret above.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {secrets.map((secret) => (
            <TableRow key={secret.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-700">
                    {secret.key}
                  </code>
                  {secret.needs_rotation && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5" title="This secret is older than 90 days and should be rotated.">
                      <AlertTriangle className="h-3 w-3" />
                      Needs Rotation
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-gray-500">
                    {revealed[secret.key] ?? maskSecret("placeholder")}
                  </span>
                  <button
                    onClick={() => revealSecret(secret.key)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={loadingReveal === secret.key}
                  >
                    {revealed[secret.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">v{secret.current_version}</Badge>
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {formatRelativeDate(secret.updated_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copySecret(secret.key)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Copy value"
                  >
                    {copied === secret.key ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setHistoryKey(secret.key)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Version history"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingKey(secret.key)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(secret.key)}
                    className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingKey && (
        <EditSecretDialog
          open
          onClose={() => setEditingKey(null)}
          projectId={projectId}
          env={env}
          secretKey={editingKey}
        />
      )}

      {historyKey && (
        <VersionHistoryDrawer
          open
          onClose={() => setHistoryKey(null)}
          projectId={projectId}
          env={env}
          secretKey={historyKey}
        />
      )}
    </>
  );
}
