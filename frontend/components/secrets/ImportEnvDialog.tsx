"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useImportSecrets } from "@/hooks/useSecrets";
import { toast } from "sonner";

interface ImportEnvDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  env: string;
}

export function ImportEnvDialog({ open, onClose, projectId, env }: ImportEnvDialogProps) {
  const [content, setContent] = useState("");
  const importSecrets = useImportSecrets(projectId, env);

  async function handleImport() {
    if (!content.trim()) return;
    try {
      const result = await importSecrets.mutateAsync(content);
      toast.success(`Imported ${result.imported} secrets`);
      setContent("");
      onClose();
    } catch {
      toast.error("Import failed");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContent(text);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import .env File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload file</label>
            <input type="file" accept=".env,text/plain" onChange={handleFileChange} className="text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Or paste content</label>
            <textarea
              className="w-full h-40 rounded-md border border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={"DATABASE_URL=postgres://...\nSECRET_KEY=abc123\n"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} loading={importSecrets.isPending} disabled={!content.trim()}>
            Import Secrets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
