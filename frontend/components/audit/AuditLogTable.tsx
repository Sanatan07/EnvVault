"use client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { AuditEvent } from "@/types";

const ACTION_COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  read: "info",
  write: "success",
  delete: "danger",
  rollback: "warning",
  export: "warning",
  import: "success",
};

interface AuditLogTableProps {
  events: AuditEvent[];
}

export function AuditLogTable({ events }: AuditLogTableProps) {
  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No audit events found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Secret Key</TableHead>
          <TableHead>Environment</TableHead>
          <TableHead>IP Address</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(event.created_at)}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{event.actor_email ?? "—"}</span>
                <span className="text-xs text-gray-400">{event.actor_type}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={ACTION_COLORS[event.action] ?? "default"}>{event.action}</Badge>
            </TableCell>
            <TableCell>
              {event.secret_key ? (
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">{event.secret_key}</code>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </TableCell>
            <TableCell className="text-sm">{event.environment_name ?? "—"}</TableCell>
            <TableCell className="text-xs text-gray-500 font-mono">{event.ip_address ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
