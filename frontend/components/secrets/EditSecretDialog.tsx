"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useUpdateSecret } from "@/hooks/useSecrets";
import { toast } from "sonner";

interface EditSecretDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  env: string;
  secretKey: string;
}

export function EditSecretDialog({ open, onClose, projectId, env, secretKey }: EditSecretDialogProps) {
  const [value, setValue] = useState("");
  const updateSecret = useUpdateSecret(projectId, env);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateSecret.mutateAsync({ key: secretKey, value });
      toast.success(`Secret "${secretKey}" updated`);
      onClose();
    } catch {
      toast.error("Failed to update secret");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Secret</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Key</Label>
            <code className="block rounded bg-gray-100 px-3 py-2 text-sm font-mono">{secretKey}</code>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-value">New Value</Label>
            <Input
              id="new-value"
              type="password"
              placeholder="Enter new value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={updateSecret.isPending} disabled={!value}>
              Update Secret
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
