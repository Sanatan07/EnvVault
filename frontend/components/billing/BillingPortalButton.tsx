"use client";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useBillingPortal } from "@/hooks/useBilling";

interface BillingPortalButtonProps {
  orgId: string;
}

export function BillingPortalButton({ orgId }: BillingPortalButtonProps) {
  const portal = useBillingPortal();

  return (
    <Button
      variant="outline"
      onClick={() =>
        portal.mutate({
          org_id: orgId,
          return_url: window.location.href,
        })
      }
      loading={portal.isPending}
      className="gap-1.5"
    >
      <ExternalLink className="h-4 w-4" />
      Manage Billing
    </Button>
  );
}
