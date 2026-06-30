"use client";
import { cn } from "@/lib/utils";

interface UsageMeterProps {
  current: number;
  limit: number | null;
  label?: string;
}

export function UsageMeter({ current, limit, label = "Reads this period" }: UsageMeterProps) {
  const pct = limit ? Math.min((current / limit) * 100, 100) : 0;
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={cn("font-semibold", isAtLimit && "text-red-600", isNearLimit && !isAtLimit && "text-yellow-600")}>
          {current.toLocaleString()}{limit ? ` / ${limit.toLocaleString()}` : ""}
        </span>
      </div>
      {limit && (
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isAtLimit ? "bg-red-500" : isNearLimit ? "bg-yellow-400" : "bg-indigo-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {limit === null && (
        <p className="text-xs text-gray-400">Unlimited on your plan</p>
      )}
    </div>
  );
}
