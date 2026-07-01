"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PlanCard } from "@/components/billing/PlanCard";
import { UsageMeter } from "@/components/billing/UsageMeter";
import { BillingPortalButton } from "@/components/billing/BillingPortalButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { orgsApi, billingApi } from "@/lib/api";
import { usePlans, useUsage, useCheckout } from "@/hooks/useBilling";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const PLAN_LIMITS: Record<string, number | null> = {
  free: 500,
  starter: 10000,
  growth: 50000,
  enterprise: null,
};

interface PageProps {
  params: { org_slug: string };
}

export default function BillingPage({ params }: PageProps) {
  const { org_slug } = params;
  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);
  const { data: plans = [] } = usePlans();
  const { data: usageData, refetch: refetchUsage } = useUsage(org?.id ?? "");
  const checkout = useCheckout();
  const [toggling, setToggling] = useState(false);

  const currentPlan = usageData?.account?.plan ?? org?.plan ?? "free";
  const secretReads = usageData?.current_period?.secret_reads ?? 0;
  const limit = PLAN_LIMITS[currentPlan];
  const blockReads = usageData?.account?.block_reads_at_limit ?? false;

  async function handleToggleBlockReads() {
    if (!org) return;
    setToggling(true);
    try {
      await billingApi.updateUsageSettings(org.id, !blockReads);
      toast.success(`Block reads at limit ${!blockReads ? "enabled" : "disabled"}`);
      refetchUsage();
    } catch {
      toast.error("Failed to update billing settings");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Billing" />
        <main className="flex-1 overflow-auto min-w-0 p-6 space-y-6">
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

              {/* Block reads toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-gray-700">Block reads at limit</label>
                  <p className="text-xs text-gray-400">Prevent unexpected charges by blocking secret reads when you reach your monthly plan limit.</p>
                </div>
                <button
                  onClick={handleToggleBlockReads}
                  disabled={toggling}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    blockReads ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      blockReads ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
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
                      plan: plan.name,
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
