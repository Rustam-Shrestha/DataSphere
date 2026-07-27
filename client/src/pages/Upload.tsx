import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { Card, Button, Input, Table } from "../components/ui";
import type { UploadedFile } from "../types";

function LoginForm() {
  const { setToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await (isRegister ? api.auth.register(email, password) : api.auth.login(email, password));
      setToken(res.token);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">{isRegister ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isRegister ? 8 : 1} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full">{isRegister ? "Register" : "Log In"}</Button>
      </form>
      <p className="text-sm text-gray-500 mt-3 text-center">
        {isRegister ? "Already have an account? " : "No account? "}
        <Button variant="ghost" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Log in" : "Register here"}
        </Button>
      </p>
    </Card>
  );
}

function UploadForm() {
  const { token } = useAuthStore();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  const mutation = useMutation({
    mutationFn: async (f: File) => {
      const fd = new FormData();
      fd.append("file", f);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/uploads", { method: "POST", headers, body: fd });
      const body = await res.json();
      if (!body.success) throw new Error(body.error?.message ?? "Upload failed");
      return body.data;
    },
    onSuccess: () => { setStatus("Import complete"); setFile(null); qc.invalidateQueries({ queryKey: ["uploads"] }); },
    onError: (err: Error) => setStatus(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatus("Importing...");
    mutation.mutate(file);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-1">Upload File</h2>
      <p className="text-sm text-gray-500 mb-4">Supported: .xlsx, .xls, .csv</p>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <Input label="Select file" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        </div>
        <Button type="submit" disabled={!file || mutation.isPending}>
          {mutation.isPending ? "Importing..." : "Upload & Import"}
        </Button>
      </form>
      {status && <p className="text-sm text-gray-600 mt-2">{status}</p>}
    </Card>
  );
}

export default function Upload() {
  const { token } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ["uploads"], queryFn: () => api.uploads.list(10) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Compliance Data</h1>
        <p className="text-gray-500 text-sm mt-1">Upload Excel or CSV files with compliance test records.</p>
      </div>
      {!token ? <LoginForm /> : <UploadForm />}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-3">Recent Uploads</h2>
        <Table
          columns={[
            { key: "filename", label: "Filename" },
            { key: "fileType", label: "Type" },
            { key: "rowsImported", label: "Rows" },
            { key: "importedAt", label: "Date", render: (r) => new Date(r.importedAt as string).toLocaleDateString() },
          ]}
          data={(data?.items as unknown as Record<string, unknown>[]) ?? []}
          loading={isLoading}
          emptyMessage="No uploads yet"
        />
      </Card>
    </div>
  );
}
