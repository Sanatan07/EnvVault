import { useQuery, useMutation } from "@tanstack/react-query";
import { billingApi } from "@/lib/api";
import { toast } from "sonner";

export function usePlans() {
  return useQuery({
    queryKey: ["billing-plans"],
    queryFn: billingApi.plans,
    staleTime: 1000 * 60 * 60,
  });
}

export function useUsage(orgId: string) {
  return useQuery({
    queryKey: ["billing-usage", orgId],
    queryFn: () => billingApi.usage(orgId),
    enabled: !!orgId,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: billingApi.checkout,
    onSuccess: ({ checkout_url }) => {
      window.location.href = checkout_url;
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate checkout");
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: billingApi.portal,
    onSuccess: ({ portal_url }) => {
      window.location.href = portal_url;
    },
    onError: (err: any) => {
      toast.error(err.message || "No active billing account. Please subscribe to a plan first.");
    },
  });
}
