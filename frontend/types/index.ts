export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "starter" | "growth" | "enterprise";
  created_at: string;
}

export interface Member {
  id: string;
  user: User;
  organisation: string;
  role: "owner" | "admin" | "editor" | "viewer";
  created_at: string;
}

export interface Project {
  id: string;
  organisation: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface Environment {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Secret {
  id: string;
  environment_id: string;
  key: string;
  current_version: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecretDetail extends Secret {
  value: string;
}

export interface SecretVersion {
  id: string;
  secret_id: string;
  version_number: number;
  created_by: string;
  created_at: string;
}

export interface ApiToken {
  id: string;
  project_id: string;
  name: string;
  scopes: string[];
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  token?: string;
}

export interface AuditEvent {
  id: string;
  org_id: string;
  project_id: string;
  environment_name?: string;
  actor_type: "member" | "api_token";
  actor_id: string;
  actor_email?: string;
  secret_key?: string;
  action: "read" | "write" | "delete" | "rollback" | "export" | "import";
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BillingAccount {
  id: string;
  org_id: string;
  stripe_customer_id?: string;
  plan: "free" | "starter" | "growth" | "enterprise";
}

export interface UsageCounter {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;
  secret_reads: number;
}

export interface BillingPlan {
  name: string;
  price: string;
  reads_per_month: number | null;
  projects: number | null;
  secrets: number | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
