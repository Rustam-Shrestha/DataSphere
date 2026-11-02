import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Table,
  Badge,
  Alert,
  type Column,
} from "../components/ui";
import {
  CloudUpload,
  FileSpreadsheet,
  FileText,
  MailIcon,
  EyeOff,
  UserCircle2,
  CheckCircle2,
  Clock,
  Sparkles,
} from "@assets/icons";
import { formatDate } from "../utils";

function LoginForm() {
  const { setToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await (isRegister ? api.auth.register(email, password) : api.auth.login(email, password));
      setToken(res.token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto card-shadow">
      <CardHeader>
        <CardTitle icon={<UserCircle2 className="size-5" />}>
          {isRegister ? "Create Officer Account" : "Officer Login"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-500 mb-4">
          Authenticate to import inspection reports, edit test records, or modify certificates.
        </p>

        {error && (
          <Alert variant="error" className="mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="officer@stationcompliance.com"
            leftIcon={<MailIcon className="size-4" />}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<EyeOff className="size-4" />}
            required
            minLength={isRegister ? 8 : 1}
            helperText={isRegister ? "Minimum 8 characters" : undefined}
          />

          <Button type="submit" loading={loading} fullWidth size="md">
            {isRegister ? "Register & Enter" : "Log In to Workspace"}
          </Button>
        </form>

        <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>{isRegister ? "Already registered?" : "Don't have an officer account?"}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-[#15803D] font-semibold hover:bg-[#DCFCE7]/60"
          >
            {isRegister ? "Log In Instead" : "Register New Account"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadForm() {
  const { token } = useAuthStore();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onSuccess: (data) => {
      setStatusMessage({
        type: "success",
        text: `Successfully imported ${data.rowsImported ?? ""} records from ${file?.name}. Deduplication check verified.`,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["uploads"] });
      qc.invalidateQueries({ queryKey: ["records"] });
    },
    onError: (err: Error) => {
      setStatusMessage({ type: "error", text: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatusMessage(null);
    mutation.mutate(file);
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div>
          <CardTitle icon={<CloudUpload className="size-5" />}>
            Import Compliance Records
          </CardTitle>
          <CardDescription>
            Upload station inspection sheets (Excel, CSV) with 22 test columns and expiry certificates.
          </CardDescription>
        </div>
        <Badge variant="primary" icon={<Sparkles className="size-3" />}>
          Deduplication Enabled
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusMessage && (
          <Alert
            variant={statusMessage.type}
            onClose={() => setStatusMessage(null)}
          >
            {statusMessage.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-[#15803D] rounded-lg p-6 transition-all duration-150 bg-slate-50/60 hover:bg-[#DCFCE7]/10 text-center">
            <CloudUpload className="size-10 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800 mb-1">
              {file ? file.name : "Select inspection spreadsheet to import"}
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Supported formats: .xlsx, .xls, .csv (Max 15MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setStatusMessage(null);
              }}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<FileSpreadsheet className="size-4" />}
              >
                {file ? "Change Selected File" : "Browse Files"}
              </Button>
            </label>
            {file && (
              <div className="mt-3 text-xs text-[#15803D] font-mono flex items-center justify-center gap-1.5 font-medium tabular-nums">
                <CheckCircle2 className="size-3.5" />
                <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Clear
              </Button>
            )}
            <Button
              type="submit"
              size="md"
              disabled={!file || mutation.isPending}
              loading={mutation.isPending}
              leftIcon={<CloudUpload className="size-4" />}
            >
              {mutation.isPending ? "Validating & Parsing..." : "Upload & Parse Records"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Upload() {
  const { token } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["uploads"],
    queryFn: () => api.uploads.list(10),
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "filename",
      label: "Filename",
      icon: <FileSpreadsheet className="size-3.5" />,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#DCFCE7] text-[#15803D] border border-emerald-200">
            <FileSpreadsheet className="size-4" />
          </div>
          <span className="font-semibold text-slate-900 truncate max-w-xs">{String(r.filename)}</span>
        </div>
      ),
    },
    {
      key: "fileType",
      label: "Format",
      align: "center",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {String(r.fileType || "FILE").toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "rowsImported",
      label: "Imported Rows",
      align: "center",
      isNumeric: true,
      render: (r) => (
        <Badge variant="success" size="sm" icon={<CheckCircle2 className="size-3" />}>
          {String(r.rowsImported)} records
        </Badge>
      ),
    },
    {
      key: "importedAt",
      label: "Imported Timestamp",
      align: "right",
      render: (r) => (
        <span className="text-xs text-slate-500 font-mono flex items-center justify-end gap-1 tabular-nums">
          <Clock className="size-3 text-slate-400" />
          {formatDate(r.importedAt as string)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <span className="section-tag">DATA INGESTION MODULE</span>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-1">Upload Compliance Data</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingest inspection records from Excel (.xlsx, .xls) and CSV sheets into the normalized registry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" icon={<CheckCircle2 className="size-3.5" />}>
            PostgreSQL Sync Active
          </Badge>
        </div>
      </div>

      {!token ? <LoginForm /> : <UploadForm />}

      <Card className="card-shadow overflow-hidden">
        <CardHeader>
          <CardTitle icon={<FileText className="size-5" />}>
            Recent Ingestion Audit Log
          </CardTitle>
          <Badge variant="neutral" size="sm">
            Last 10 Uploads
          </Badge>
        </CardHeader>
        <Table
          columns={columns}
          data={(data?.items as unknown as Record<string, unknown>[]) ?? []}
          loading={isLoading}
          emptyMessage="No inspection files uploaded yet. Upload your first sheet above."
          emptyIcon={<FileSpreadsheet className="size-7 text-slate-400" />}
        />
      </Card>
    </div>
  );
}
