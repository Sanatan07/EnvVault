"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { notificationsApi } from "@/lib/api";
import { toast } from "sonner";

interface WebhookSettingsProps {
  orgId: string;
}

export function WebhookSettings({ orgId }: WebhookSettingsProps) {
  const qc = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["notification-settings", orgId],
    queryFn: () => notificationsApi.getSettings(orgId),
    enabled: !!orgId,
  });

  const [slackUrl, setSlackUrl] = useState(settings?.slack_webhook_url ?? "");
  const [webhookUrl, setWebhookUrl] = useState(settings?.webhook_url ?? "");

  const save = useMutation({
    mutationFn: () =>
      notificationsApi.updateSettings(orgId, {
        slack_webhook_url: slackUrl || undefined,
        webhook_url: webhookUrl || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-settings", orgId] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const testWebhook = useMutation({
    mutationFn: () => notificationsApi.testWebhook(webhookUrl),
    onSuccess: () => toast.success("Test webhook sent"),
    onError: () => toast.error("Failed to send test webhook"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="slack-url">Slack Webhook URL</Label>
          <Input
            id="slack-url"
            placeholder="https://hooks.slack.com/services/..."
            value={slackUrl}
            onChange={(e) => setSlackUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="webhook-url">Custom Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              placeholder="https://your-service.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => testWebhook.mutate()}
              disabled={!webhookUrl || testWebhook.isPending}
            >
              Test
            </Button>
          </div>
        </div>
        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
