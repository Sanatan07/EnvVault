"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PlanCard } from "@/components/billing/PlanCard";
import { UsageMeter } from "@/components/billing/UsageMeter";
import { BillingPortalButton } from "@/components/billing/BillingPortalButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { orgsApi } from "@/lib/api";
import { usePlans, useUsage, useCheckout } from "@/hooks/useBilling";
import { formatDate } from "@/lib/utils";

const PLAN_LIMITS: Record<string, number | null> = {
  free: 500,
  starter: 10000,
  growth: 50000,
  enterprise: null,
};

interface PageProps {
  params: Promise<{ org_slug: string }>;
}

export default function BillingPage({ params }: PageProps) {
  const { org_slug } = use(params);
  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);
  const { data: plans = [] } = usePlans();
  const { data: usageData } = useUsage(org?.id ?? "");
  const checkout = useCheckout();

  const currentPlan = usageData?.account?.plan ?? org?.plan ?? "free";
  const secretReads = usageData?.current_period?.secret_reads ?? 0;
  const limit = PLAN_LIMITS[currentPlan];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Billing" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Billing & Usage</h2>
            {org && <BillingPortalButton orgId={org.id} />}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageMeter current={secretReads} limit={limit} />
              {usageData?.current_period && (
                <p className="text-xs text-gray-400">
                  Period: {formatDate(usageData.current_period.period_start)} → {formatDate(usageData.current_period.period_end)}
                </p>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold mb-4">Plans</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  current={plan.name === currentPlan}
                  onUpgrade={() =>
                    org &&
                    checkout.mutate({
                      org_id: org.id,
                      success_url: window.location.href,
                      cancel_url: window.location.href,
                    })
                  }
                  upgrading={checkout.isPending}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
