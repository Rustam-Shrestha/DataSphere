import { useState } from "react";
import { api } from "../lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from "../components/ui";
import {
  CodeIcon,
  Table as TableIcon,
  Clock,
  Sparkles,
  ChevronRight,
  SendHorizonal,
} from "@assets/icons";

const sampleQueries = [
  {
    name: "Overdue items (detailed)",
    sql: `SELECT "storeNumber", "city", "streetName", 
  CASE WHEN "deliveryCertificateExpiredDate" < CURRENT_DATE THEN 'Delivery Certificate' ELSE 'Insurance' END AS "itemType",
  COALESCE("deliveryCertificateExpiredDate", "insuranceExpiredDate") AS "expiredDate"
FROM "ComplianceRecord"
WHERE "deliveryCertificateExpiredDate" < CURRENT_DATE OR "insuranceExpiredDate" < CURRENT_DATE
ORDER BY "expiredDate" ASC LIMIT 50;`,
  },
  {
    name: "Pass vs Fail count per test",
    sql: `SELECT 'Corrosion' AS test,
  count(*) FILTER (WHERE "corrosionTestStatus" = 'PASS') AS pass_count,
  count(*) FILTER (WHERE "corrosionTestStatus" = 'FAIL') AS fail_count
FROM "ComplianceRecord"
UNION ALL
SELECT 'Spill Buckets',
  count(*) FILTER (WHERE "spillBucketTestStatus" = 'PASS'),
  count(*) FILTER (WHERE "spillBucketTestStatus" = 'FAIL')
FROM "ComplianceRecord";`,
  },
  {
    name: "Store failure breakdown",
    sql: `SELECT "storeNumber", "city", "streetName",
  ("corrosionTestStatus" = 'FAIL')::int +
  ("spillBucketTestStatus" = 'FAIL')::int +
  ("overfillProtectionDeviceTestStatus" = 'FAIL')::int AS total_failures
FROM "ComplianceRecord"
ORDER BY total_failures DESC LIMIT 25;`,
  },
  {
    name: "Summary counts by City",
    sql: `SELECT "city", count(*) AS records_count,
  count(*) FILTER (WHERE "corrosionTestStatus" = 'FAIL') AS corrosion_fails
FROM "ComplianceRecord"
GROUP BY "city"
ORDER BY records_count DESC LIMIT 20;`,
  },
];

export default function SqlStudio() {
  const [query, setQuery] = useState(sampleQueries[0].sql);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ rowCount: number; executionTimeMs: number } | null>(null);

  const handleRun = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.chatbot.executeSql(query.trim());
      setRows(res.rows);
      setStats({ rowCount: res.rowCount, executionTimeMs: res.executionTimeMs });

      if (res.rows && res.rows.length > 0) {
        setColumns(Object.keys(res.rows[0]));
      } else {
        setColumns([]);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to execute query");
      setRows([]);
      setColumns([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <span className="section-tag">POSTGRESQL ANALYTICS</span>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-1">SQL Studio</h1>
          <p className="text-sm text-slate-500 mt-1">
            Execute analytical SQL queries directly on PostgreSQL with live tabulated data inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">
            READ-ONLY ANALYTICAL
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* SQL Editor Area */}
        <div className="space-y-4">
          <Card className="card-shadow overflow-hidden">
            <CardHeader className="py-3 px-5 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CodeIcon className="size-4 text-[#15803D]" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  PostgreSQL Query Editor
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRun}
                disabled={loading || !query.trim()}
                leftIcon={
                  loading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <SendHorizonal className="size-3.5" />
                  )
                }
              >
                {loading ? "Executing..." : "Execute Query"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Write your SELECT query here..."
                rows={9}
                className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 focus:outline-none resize-y selection:bg-emerald-900 leading-relaxed border-0"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono leading-relaxed">
              <strong>Query Execution Error:</strong> {error}
            </div>
          )}

          {/* Results Area */}
          <Card className="card-shadow overflow-hidden">
            <CardHeader className="py-3 px-5 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="size-4 text-[#15803D]" />
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Tabulated Query Results
                </span>
              </div>
              {stats && (
                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                  <span>{stats.rowCount} rows</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {stats.executionTimeMs} ms
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {rows.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs divide-y divide-slate-200 font-sans">
                    <thead className="bg-[#F8FAFC] sticky top-0 text-slate-700 font-semibold select-none">
                      <tr>
                        {columns.map((col) => (
                          <th key={col} className="px-3.5 py-2.5 whitespace-nowrap capitalize">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                      {rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          {columns.map((col) => (
                            <td key={col} className="px-3.5 py-2 whitespace-nowrap text-slate-800">
                              {row[col] != null ? String(row[col]) : <span className="text-slate-400 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 font-sans">
                  {loading ? "Running SQL statement on PostgreSQL..." : "Run a query to view tabulated results"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Pre-defined Templates */}
        <div className="space-y-4">
          <Card className="card-shadow">
            <CardHeader className="py-3 px-4">
              <CardTitle icon={<Sparkles className="size-4" />}>
                Prepared SQL Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1">
                {sampleQueries.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => setQuery(item.sql)}
                    className="justify-between text-left text-xs text-slate-700 hover:text-[#15803D] hover:bg-[#DCFCE7]/40 font-normal py-2.5 h-auto"
                    rightIcon={<ChevronRight className="size-3 text-slate-400" />}
                  >
                    <span className="font-medium text-slate-800">{item.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow bg-emerald-50/50 border-emerald-200">
            <CardContent className="p-4 text-xs text-emerald-900 space-y-2">
              <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-600" />
                Table Schema Reference
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Primary table: <code className="font-bold bg-white/70 px-1 py-0.5 rounded">"ComplianceRecord"</code>
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 font-mono">
                <li>storeNumber, city, streetName</li>
                <li>corrosionTestStatus, corrosionTestDate</li>
                <li>spillBucketTestStatus, spillBucketsTestDate</li>
                <li>deliveryCertificateExpiredDate</li>
                <li>insuranceExpiredDate</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
