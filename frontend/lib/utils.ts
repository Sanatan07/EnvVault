import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateString);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return "••••••••" + value.slice(-4);
}

export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

export function envColorClass(color: string): string {
  const map: Record<string, string> = {
    production: "bg-red-100 text-red-700 border-red-200",
    staging: "bg-yellow-100 text-yellow-700 border-yellow-200",
    development: "bg-green-100 text-green-700 border-green-200",
  };
  return map[color] ?? "bg-indigo-100 text-indigo-700 border-indigo-200";
}

export function planColor(plan: string): string {
  const map: Record<string, string> = {
    free: "bg-gray-100 text-gray-600",
    starter: "bg-blue-100 text-blue-700",
    growth: "bg-purple-100 text-purple-700",
    enterprise: "bg-amber-100 text-amber-700",
  };
  return map[plan] ?? "bg-gray-100 text-gray-600";
}
