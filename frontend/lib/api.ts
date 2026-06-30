import { getSession } from "next-auth/react";
import type {
  Organisation,
  Member,
  Project,
  Environment,
  Secret,
  SecretDetail,
  SecretVersion,
  ApiToken,
  AuditEvent,
  BillingPlan,
  User,
  PaginatedResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; full_name?: string; org_name: string }) =>
    request<{ user: User; access: string; refresh: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (email: string, password: string) =>
    request<{ access: string; refresh: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>("/auth/me"),
  logout: (refresh: string) =>
    request<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refresh }) }),
};

// Organisations
export const orgsApi = {
  list: () => request<Organisation[]>("/auth/organisations"),
  get: (orgId: string) => request<Organisation>(`/auth/organisations/${orgId}`),
  create: (data: { name: string }) =>
    request<Organisation>("/auth/organisations", { method: "POST", body: JSON.stringify(data) }),
  update: (orgId: string, data: Partial<Organisation>) =>
    request<Organisation>(`/auth/organisations/${orgId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Members
export const membersApi = {
  list: (orgId: string) => request<Member[]>(`/auth/organisations/${orgId}/members`),
  invite: (orgId: string, data: { email: string; role: string }) =>
    request<{ detail: string }>(`/auth/organisations/${orgId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRole: (orgId: string, memberId: string, role: string) =>
    request<Member>(`/auth/organisations/${orgId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  remove: (orgId: string, memberId: string) =>
    request<void>(`/auth/organisations/${orgId}/members/${memberId}`, { method: "DELETE" }),
};

// Projects
export const projectsApi = {
  list: (orgId: string) => request<Project[]>(`/auth/projects?org_id=${orgId}`),
  get: (projectId: string) => request<Project>(`/auth/projects/${projectId}`),
  create: (data: { org_id: string; name: string; description?: string }) =>
    request<Project>("/auth/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (projectId: string, data: Partial<Project>) =>
    request<Project>(`/auth/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (projectId: string) =>
    request<void>(`/auth/projects/${projectId}`, { method: "DELETE" }),
};

// API Tokens
export const tokensApi = {
  list: (projectId: string) => request<ApiToken[]>(`/auth/projects/${projectId}/tokens`),
  create: (projectId: string, data: { name: string; scopes: string[]; expires_at?: string }) =>
    request<ApiToken & { token: string }>(`/auth/projects/${projectId}/tokens`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  revoke: (projectId: string, tokenId: string) =>
    request<void>(`/auth/projects/${projectId}/tokens/${tokenId}`, { method: "DELETE" }),
};

// Environments
export const envsApi = {
  list: (projectId: string) => request<Environment[]>(`/secrets/${projectId}/environments`),
  create: (projectId: string, data: { name: string; color?: string }) =>
    request<Environment>(`/secrets/${projectId}/environments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (projectId: string, envId: string) =>
    request<void>(`/secrets/${projectId}/environments/${envId}`, { method: "DELETE" }),
};

// Secrets
export const secretsApi = {
  list: (projectId: string, env: string) =>
    request<Secret[]>(`/secrets/${projectId}/${env}/`),
  get: (projectId: string, env: string, key: string) =>
    request<SecretDetail>(`/secrets/${projectId}/${env}/${key}/`),
  create: (projectId: string, env: string, data: { key: string; value: string }) =>
    request<Secret>(`/secrets/${projectId}/${env}/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (projectId: string, env: string, key: string, value: string) =>
    request<Secret>(`/secrets/${projectId}/${env}/${key}/`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
  delete: (projectId: string, env: string, key: string) =>
    request<void>(`/secrets/${projectId}/${env}/${key}/`, { method: "DELETE" }),
  versions: (projectId: string, env: string, key: string) =>
    request<SecretVersion[]>(`/secrets/${projectId}/${env}/${key}/versions/`),
  rollback: (projectId: string, env: string, key: string, version: number) =>
    request<Secret>(`/secrets/${projectId}/${env}/${key}/rollback/${version}/`, { method: "POST" }),
  importEnv: async (projectId: string, env: string, content: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/secrets/${projectId}/${env}/import/`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Import failed");
    return res.json() as Promise<{ imported: number }>;
  },
  exportEnv: async (projectId: string, env: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/secrets/${projectId}/${env}/export/`, { headers });
    if (!res.ok) throw new Error("Export failed");
    return res.text();
  },
  promote: (projectId: string, data: { source_env: string; target_env: string }) =>
    request<{ promoted: number }>(`/secrets/${projectId}/promote/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Audit
export const auditApi = {
  list: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<PaginatedResponse<AuditEvent>>(`/audit/events/?${qs}`);
  },
  stats: (orgId: string) => request<{ action: string; count: number }[]>(`/audit/stats/?org_id=${orgId}`),
  exportCsv: async (params: Record<string, string>) => {
    const headers = await getAuthHeaders();
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/audit/events/export/?${qs}`, { headers });
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  },
};

// Billing
export const billingApi = {
  plans: () => request<BillingPlan[]>("/billing/plans/"),
  usage: (orgId: string) =>
    request<{ account: { plan: string }; current_period: { secret_reads: number; period_start: string; period_end: string } }>(
      `/billing/usage/${orgId}/`
    ),
  checkout: (data: { org_id: string; success_url: string; cancel_url: string }) =>
    request<{ checkout_url: string }>("/billing/checkout/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  portal: (data: { org_id: string; return_url: string }) =>
    request<{ portal_url: string }>("/billing/portal/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Notifications
export const notificationsApi = {
  getSettings: (orgId: string) =>
    request<{ slack_webhook_url?: string; webhook_url?: string }>(`/notifications/settings/${orgId}/`),
  updateSettings: (orgId: string, data: { slack_webhook_url?: string; webhook_url?: string }) =>
    request<void>(`/notifications/settings/${orgId}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  testWebhook: (webhookUrl: string) =>
    request<{ status: string }>("/notifications/webhooks/test/", {
      method: "POST",
      body: JSON.stringify({ webhook_url: webhookUrl }),
    }),
};
