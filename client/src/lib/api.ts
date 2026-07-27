const BASE = "/api";

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const body = await res.json();
  if (!body.success) throw new Error(body.error?.message ?? "Request failed");
  return body.data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: { id: string; email: string; role: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      request<{ token: string; user: { id: string; email: string; role: string } }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
  uploads: {
    list: (pageSize = 10) =>
      request<import("../types").PaginatedResponse<import("../types").UploadedFile>>(`/uploads?pageSize=${pageSize}`),
    upload: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("token");
      return fetch(`${BASE}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }).then((r) => r.json());
    },
  },
  records: {
    list: (page = 1, pageSize = 25, search = "") => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      return request<import("../types").PaginatedResponse<import("../types").ComplianceRecord>>(`/records?${params}`);
    },
    get: (id: string) => request<import("../types").ComplianceRecord>(`/records/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      request<import("../types").ComplianceRecord>(`/records/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/records/${id}`, { method: "DELETE" }),
  },
  chatbot: {
    query: (question: string, mode: string) =>
      request<import("../types").ChatResponse>("/chatbot/query", {
        method: "POST",
        body: JSON.stringify({ question, mode }),
      }),
  },
};
