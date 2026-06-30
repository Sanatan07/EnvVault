"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { secretsApi } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

interface ExportButtonProps {
  projectId: string;
  env: string;
}

export function ExportButton({ projectId, env }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const content = await secretsApi.exportEnv(projectId, env);
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${env}.env`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported successfully");
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} loading={loading} className="gap-1.5">
      <Download className="h-4 w-4" />
      Export .env
    </Button>
  );
}
