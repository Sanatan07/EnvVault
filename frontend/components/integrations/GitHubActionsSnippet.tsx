"use client";
import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface GitHubActionsSnippetProps {
  projectId: string;
  env: string;
}

export function GitHubActionsSnippet({ projectId, env }: GitHubActionsSnippetProps) {
  const [copied, setCopied] = useState(false);

  const snippet = `- name: Load secrets from EnvVault
  uses: envvault/action@v1
  with:
    token: \${{ secrets.ENVVAULT_TOKEN }}
    project_id: ${projectId}
    env: ${env}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-gray-500">
          Add this step to your workflow to inject secrets as environment variables.
        </p>
        <div className="relative rounded-md bg-gray-900 px-4 py-4">
          <button
            onClick={() => { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="absolute right-3 top-3 text-gray-400 hover:text-white"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
          <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap">{snippet}</pre>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Store your API token as <code className="bg-gray-100 px-1 rounded">ENVVAULT_TOKEN</code> in your GitHub repository secrets.
        </p>
      </CardContent>
    </Card>
  );
}
