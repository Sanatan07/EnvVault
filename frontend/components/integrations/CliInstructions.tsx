"use client";
import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface CliInstructionsProps {
  orgSlug: string;
  projectSlug: string;
}

export function CliInstructions({ orgSlug, projectSlug }: CliInstructionsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const snippets = [
    { id: "install", label: "Install CLI", code: "pip install envvault-cli" },
    { id: "login", label: "Authenticate", code: "envvault login" },
    { id: "pull", label: "Pull secrets", code: `envvault pull --org ${orgSlug} --project ${projectSlug} --env production` },
    { id: "inject", label: "Inject into process", code: `envvault run --env production -- node server.js` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>CLI Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {snippets.map(({ id, label, code }) => (
          <div key={id}>
            <p className="mb-1.5 text-sm font-medium text-gray-700">{label}</p>
            <div className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-3">
              <code className="flex-1 text-sm text-green-400 font-mono">{code}</code>
              <button
                onClick={() => copy(code, id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copied === id ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
