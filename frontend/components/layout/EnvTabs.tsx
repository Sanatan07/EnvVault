"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, envColorClass } from "@/lib/utils";
import type { Environment } from "@/types";

interface EnvTabsProps {
  environments: Environment[];
  orgSlug: string;
  projectSlug: string;
  activeEnv: string;
}

export function EnvTabs({ environments, orgSlug, projectSlug, activeEnv }: EnvTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-6">
      {environments.map((env) => {
        const href = `/${orgSlug}/${projectSlug}/${env.name}`;
        const isActive = activeEnv === env.name;
        return (
          <Link
            key={env.id}
            href={href}
            className={cn(
              "relative px-3 py-3 text-sm font-medium transition-colors",
              isActive
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {env.name}
          </Link>
        );
      })}
    </div>
  );
}
