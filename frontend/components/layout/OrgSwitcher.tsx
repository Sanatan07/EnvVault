"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { orgsApi } from "@/lib/api";

interface OrgSwitcherProps {
  currentOrgSlug: string;
}

export function OrgSwitcher({ currentOrgSlug }: OrgSwitcherProps) {
  const router = useRouter();
  const { data: orgs } = useQuery({
    queryKey: ["organisations"],
    queryFn: orgsApi.list,
  });

  const current = orgs?.find((o) => o.slug === currentOrgSlug);

  return (
    <Select
      value={currentOrgSlug}
      onValueChange={(slug) => router.push(`/${slug}`)}
    >
      <SelectTrigger className="h-9 text-sm border-gray-200">
        <div className="flex items-center gap-2 truncate">
          <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
          <SelectValue placeholder={current?.name ?? currentOrgSlug} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {orgs?.map((org) => (
          <SelectItem key={org.id} value={org.slug}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
