import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useRecords(page: number, pageSize: number, search: string) {
  return useQuery({
    queryKey: ["records", page, pageSize, search],
    queryFn: () => api.records.list(page, pageSize, search),
  });
}

export function useRecord(id: string | null) {
  return useQuery({
    queryKey: ["record", id],
    queryFn: () => api.records.get(id!),
    enabled: !!id,
  });
}

export function useUpdateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.records.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["records"] });
    },
  });
}

export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.records.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["records"] });
    },
  });
}
