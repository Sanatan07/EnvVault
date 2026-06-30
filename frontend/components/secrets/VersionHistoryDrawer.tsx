"use client";
import { RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useSecretVersions, useRollbackSecret } from "@/hooks/useSecrets";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface VersionHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  env: string;
  secretKey: string;
}

export function VersionHistoryDrawer({ open, onClose, projectId, env, secretKey }: VersionHistoryDrawerProps) {
  const { data: versions, isLoading } = useSecretVersions(projectId, env, secretKey, open);
  const rollback = useRollbackSecret(projectId, env);

  async function handleRollback(version: number) {
    if (!confirm(`Rollback "${secretKey}" to version ${version}?`)) return;
    try {
      await rollback.mutateAsync({ key: secretKey, version });
      toast.success(`Rolled back to version ${version}`);
      onClose();
    } catch {
      toast.error("Rollback failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Version History — <code className="text-sm">{secretKey}</code></DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="py-6 text-center text-sm text-gray-400">Loading versions…</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {versions?.map((v, i) => (
              <li key={v.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
                <div>
                  <span className="text-sm font-medium">v{v.version_number}</span>
                  {i === 0 && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">current</span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(v.created_at)}</p>
                </div>
                {i > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRollback(v.version_number)}
                    loading={rollback.isPending}
                    className="gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
