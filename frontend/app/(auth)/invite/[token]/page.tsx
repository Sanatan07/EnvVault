"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function acceptInvite() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/auth/invitations/${token}/accept/`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to accept invitation");
      toast.success("Invitation accepted! Welcome to the team.");
      router.push("/");
    } catch {
      toast.error("Invalid or expired invitation link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Team Invitation</h1>
          <p className="mt-2 text-sm text-gray-500">
            You&apos;ve been invited to join a team on EnvVault.
          </p>
        </div>
        <Button className="w-full" onClick={acceptInvite} loading={loading}>
          Accept Invitation
        </Button>
      </div>
    </div>
  );
}
