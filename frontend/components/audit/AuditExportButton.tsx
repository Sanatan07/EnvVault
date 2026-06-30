"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { auditApi } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

interface AuditExportButtonProps {
  params: Record<string, string>;
}

export function AuditExportButton({ params }: AuditExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const blob = await auditApi.exportCsv(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit-log.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Audit log exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} loading={loading} className="gap-1.5">
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
