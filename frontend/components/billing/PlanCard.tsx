"use client";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { BillingPlan } from "@/types";

interface PlanCardProps {
  plan: BillingPlan;
  current?: boolean;
  onUpgrade?: () => void;
  upgrading?: boolean;
}

export function PlanCard({ plan, current, onUpgrade, upgrading }: PlanCardProps) {
  const features = [
    `${plan.projects ?? "Unlimited"} projects`,
    `${plan.secrets ?? "Unlimited"} secrets`,
    `${plan.reads_per_month ? plan.reads_per_month.toLocaleString() : "Unlimited"} reads/mo`,
  ];

  return (
    <Card className={cn("relative", current && "border-indigo-500 ring-2 ring-indigo-200")}>
      {current && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
            Current Plan
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle className="capitalize">{plan.name}</CardTitle>
        <p className="text-2xl font-bold">{plan.price}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        {!current && onUpgrade && plan.name !== "enterprise" && (
          <Button className="w-full" onClick={onUpgrade} loading={upgrading}>
            Upgrade to {plan.name}
          </Button>
        )}
        {!current && plan.name === "enterprise" && (
          <Button className="w-full" variant="outline">
            Contact Sales
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
