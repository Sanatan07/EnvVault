"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { secretsApi } from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { maskSecret } from "@/lib/utils";
import type { Environment } from "@/types";

interface PromoteDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  currentEnv: string;
  environments: Environment[];
  onPromoted?: () => void;
}

interface DiffItem {
  key: string;
  status: "added" | "modified" | "deleted" | "unchanged";
  source_value: string | null;
  target_value: string | null;
}

export function PromoteDialog({
  open,
  onClose,
  projectId,
  currentEnv,
  environments,
  onPromoted,
}: PromoteDialogProps) {
  const [targetEnv, setTargetEnv] = useState<string>("");
  const [diff, setDiff] = useState<DiffItem[] | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const availableTargets = environments.filter((e) => e.name !== currentEnv);

  async function handleCompare() {
    if (!targetEnv) {
      toast.error("Please select a target environment");
      return;
    }
    setLoadingDiff(true);
    setDiff(null);
    try {
      const data = await secretsApi.promoteDiff(projectId, currentEnv, targetEnv);
      setDiff(data);
    } catch {
      toast.error("Failed to compute diff");
    } finally {
      setLoadingDiff(false);
    }
  }

  async function handlePromote() {
    if (!targetEnv) return;
    setPromoting(true);
    try {
      const res = await secretsApi.promote(projectId, {
        source_env: currentEnv,
        target_env: targetEnv,
      });
      toast.success(`Successfully promoted ${res.promoted} secret(s) to ${targetEnv}`);
      if (onPromoted) onPromoted();
      handleClose();
    } catch {
      toast.error("Promotion failed");
    } finally {
      setPromoting(false);
    }
  }

  function handleClose() {
    setTargetEnv("");
    setDiff(null);
    setRevealedKeys({});
    onClose();
  }

  function toggleReveal(key: string) {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const hasChanges = diff && diff.some((d) => d.status !== "unchanged");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            <span>Promote Secrets</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-end gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Source Environment</label>
              <div className="h-10 flex items-center px-3 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-700 font-medium capitalize mt-1">
                {currentEnv}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase">Target Environment</label>
              <div className="mt-1">
                <Select value={targetEnv} onValueChange={setTargetEnv}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target env" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargets.map((e) => (
                      <SelectItem key={e.id} value={e.name} className="capitalize">
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCompare} loading={loadingDiff} disabled={!targetEnv} variant="outline" className="w-full">
              Compare Environments
            </Button>
          </div>

          {/* Diff View */}
          {diff && (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-100 sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source ({currentEnv})</TableHead>
                      <TableHead>Target ({targetEnv})</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {diff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-sm text-gray-400">
                          Both environments are empty.
                        </TableCell>
                      </TableRow>
                    ) : (
                      diff.map((item) => {
                        const isRevealed = revealedKeys[item.key];
                        return (
                          <TableRow key={item.key} className={item.status === "unchanged" ? "opacity-60" : ""}>
                            <TableCell className="font-mono text-xs font-semibold">{item.key}</TableCell>
                            <TableCell>
                              {item.status === "added" && <Badge className="bg-green-50 text-green-700 border-green-200">Added</Badge>}
                              {item.status === "modified" && <Badge className="bg-amber-50 text-amber-700 border-amber-200">Modified</Badge>}
                              {item.status === "deleted" && <Badge className="bg-red-50 text-red-700 border-red-200">Deleted</Badge>}
                              {item.status === "unchanged" && <Badge className="bg-gray-50 text-gray-600 border-gray-200">Unchanged</Badge>}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-500">
                              {item.source_value === null
                                ? "-"
                                : isRevealed
                                ? item.source_value
                                : maskSecret(item.source_value)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-500">
                              {item.target_value === null
                                ? "-"
                                : isRevealed
                                ? item.target_value
                                : maskSecret(item.target_value)}
                            </TableCell>
                            <TableCell>
                              {item.status !== "unchanged" && (
                                <button
                                  type="button"
                                  onClick={() => toggleReveal(item.key)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {!hasChanges && diff.length > 0 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-500">
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                  <span>All secrets are fully synced between {currentEnv} and {targetEnv}. No changes to promote.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
          {diff && hasChanges && (
            <Button onClick={handlePromote} loading={promoting}>
              Promote Secrets
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
