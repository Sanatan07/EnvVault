"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { orgsApi } from "@/lib/api";
import { KeyRound } from "lucide-react";

export default function OrgsRedirectPage() {
  const router = useRouter();
  const { data: orgs, isLoading } = useQuery({
    queryKey: ["organisations"],
    queryFn: orgsApi.list,
  });

  useEffect(() => {
    if (orgs && orgs.length > 0) {
      router.replace(`/${orgs[0].slug}`);
    }
  }, [orgs, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-gray-400">
        <KeyRound className="h-5 w-5 animate-pulse" />
        <span className="text-sm">Loading your workspace…</span>
      </div>
    </div>
  );
}
