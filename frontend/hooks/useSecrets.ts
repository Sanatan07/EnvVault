import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { secretsApi, envsApi } from "@/lib/api";

export function useEnvironments(projectId: string) {
  return useQuery({
    queryKey: ["environments", projectId],
    queryFn: () => envsApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useSecrets(projectId: string, env: string) {
  return useQuery({
    queryKey: ["secrets", projectId, env],
    queryFn: () => secretsApi.list(projectId, env),
    enabled: !!projectId && !!env,
  });
}

export function useSecretDetail(projectId: string, env: string, key: string, enabled = false) {
  return useQuery({
    queryKey: ["secret-detail", projectId, env, key],
    queryFn: () => secretsApi.get(projectId, env, key),
    enabled,
  });
}

export function useSecretVersions(projectId: string, env: string, key: string, enabled = false) {
  return useQuery({
    queryKey: ["secret-versions", projectId, env, key],
    queryFn: () => secretsApi.versions(projectId, env, key),
    enabled,
  });
}

export function useCreateSecret(projectId: string, env: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { key: string; value: string }) =>
      secretsApi.create(projectId, env, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets", projectId, env] }),
  });
}

export function useUpdateSecret(projectId: string, env: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      secretsApi.update(projectId, env, key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets", projectId, env] }),
  });
}

export function useDeleteSecret(projectId: string, env: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => secretsApi.delete(projectId, env, key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets", projectId, env] }),
  });
}

export function useRollbackSecret(projectId: string, env: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, version }: { key: string; version: number }) =>
      secretsApi.rollback(projectId, env, key, version),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets", projectId, env] }),
  });
}

export function useImportSecrets(projectId: string, env: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => secretsApi.importEnv(projectId, env, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secrets", projectId, env] }),
  });
}
