"use client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

interface AuditFiltersProps {
  filters: {
    action: string;
    env: string;
    from: string;
    to: string;
  };
  onChange: (filters: Partial<{ action: string; env: string; from: string; to: string }>) => void;
  onReset: () => void;
}

const ACTIONS = ["", "read", "write", "delete", "rollback", "export", "import"];
const ENVS = ["", "production", "staging", "development"];

export function AuditFilters({ filters, onChange, onReset }: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-36">
        <label className="mb-1 block text-xs font-medium text-gray-600">Action</label>
        <Select value={filters.action} onValueChange={(v) => onChange({ action: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => (
              <SelectItem key={a || "__all"} value={a}>{a || "All actions"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <label className="mb-1 block text-xs font-medium text-gray-600">Environment</label>
        <Select value={filters.env} onValueChange={(v) => onChange({ env: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All envs" />
          </SelectTrigger>
          <SelectContent>
            {ENVS.map((e) => (
              <SelectItem key={e || "__all"} value={e}>{e || "All environments"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
        <input
          type="date"
          className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.from}
          onChange={(e) => onChange({ from: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
        <input
          type="date"
          className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.to}
          onChange={(e) => onChange({ to: e.target.value })}
        />
      </div>

      <Button variant="outline" size="sm" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
