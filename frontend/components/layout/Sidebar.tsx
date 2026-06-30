"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  Shield,
  CreditCard,
  Users,
  Settings,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgSwitcher } from "./OrgSwitcher";

interface SidebarProps {
  orgSlug: string;
  projectSlug?: string;
}

export function Sidebar({ orgSlug, projectSlug }: SidebarProps) {
  const pathname = usePathname();

  const orgLinks = [
    { href: `/${orgSlug}`, label: "Projects", icon: LayoutDashboard },
    { href: `/${orgSlug}/members`, label: "Members", icon: Users },
    { href: `/${orgSlug}/audit`, label: "Audit Log", icon: Shield },
    { href: `/${orgSlug}/billing`, label: "Billing", icon: CreditCard },
    { href: `/${orgSlug}/settings`, label: "Settings", icon: Settings },
  ];

  const projectLinks = projectSlug
    ? [
        { href: `/${orgSlug}/${projectSlug}`, label: "Secrets", icon: KeyRound },
        { href: `/${orgSlug}/${projectSlug}/tokens`, label: "API Tokens", icon: Shield },
        { href: `/${orgSlug}/${projectSlug}/settings`, label: "Project Settings", icon: Settings },
      ]
    : [];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-indigo-600">
          <KeyRound className="h-5 w-5" />
          <span>EnvVault</span>
        </Link>
      </div>

      <div className="border-b border-gray-200 px-3 py-3">
        <OrgSwitcher currentOrgSlug={orgSlug} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {projectSlug && (
          <div>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Project
            </p>
            <ul className="space-y-1">
              {projectLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                      pathname === href
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Organisation
          </p>
          <ul className="space-y-1">
            {orgLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                    pathname === href
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {label === "Projects" && projectSlug && (
                    <ChevronRight className="ml-auto h-3 w-3 opacity-50" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
