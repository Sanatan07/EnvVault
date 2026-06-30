"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useCreateSecret } from "@/hooks/useSecrets";
import { toast } from "sonner";

const schema = z.object({
  key: z.string().min(1).regex(/^[A-Z0-9_]+$/i, "Key must be alphanumeric with underscores"),
  value: z.string(),
});

type FormData = z.infer<typeof schema>;

interface AddSecretDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  env: string;
}

export function AddSecretDialog({ open, onClose, projectId, env }: AddSecretDialogProps) {
  const createSecret = useCreateSecret(projectId, env);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      await createSecret.mutateAsync(data);
      toast.success(`Secret "${data.key}" created`);
      reset();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create secret");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Secret</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              placeholder="DATABASE_URL"
              {...register("key")}
              error={errors.key?.message}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="password"
              placeholder="Enter secret value"
              {...register("value")}
              error={errors.value?.message}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createSecret.isPending}>
              Create Secret
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
