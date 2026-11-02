import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Tabs,
  Badge,
} from "../components/ui";
import ChartRenderer from "../components/ChartRenderer";
import type { ChartData } from "../types";
import {
  Sparkles,
  Gauge,
  SendHorizonal,
  UserCircle2,
  CodeIcon,
  MessageSquareText,
  BarChart3,
  ChevronRight,
  Table,
} from "@assets/icons";

interface Message {
  role: "user" | "bot";
  text: string;
  chart?: ChartData | null;
  sql?: string;
  rows?: Record<string, unknown>[];
  intent?: string;
}

const examples = [
  "What is the failure rate for Corrosion tests?",
  "Overall failure rate across all tests",
  "Show me a pie chart of pass/fail for Spill Buckets",
  "Plot a line chart of test trends over time",
  "Draw a bar chart of all test results",
  "Compare corrosion vs spill buckets",
  "Scatter plot ATG vs Stage 1",
  "Histogram of store failures",
  "Show me records for store #38",
  "What certificates are expiring in 60 days?",
  "What items are overdue?",
  "Summary of all compliance tests",
];

function renderBotText(text: string) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1.5" />;
        // Split on **bold** first (avoids false italics inside bold markers)
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <p key={idx} className="leading-relaxed">
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="font-semibold text-gray-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("*") && part.endsWith("*")) {
                return (
                  <em key={pIdx} className="italic text-gray-700">
                    {part.slice(1, -1)}
                  </em>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

function StatusPill({ value }: { value: unknown }) {
  const v = String(value ?? "-").toUpperCase();
  if (v === "PASS") return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">PASS</span>;
  if (v === "FAIL") return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">FAIL</span>;
  if (v === "-" || v === "NULL" || v === "UNDEFINED") return <span className="text-gray-300 text-[10px]">—</span>;
  return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">{v}</span>;
}

function InlineRecordTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows || rows.length === 0) return null;

  const TEST_COLS: [string, string][] = [
    ["Corrosion", "corrosionTestStatus"],
    ["Spill", "spillBucketTestStatus"],
    ["Overfill", "overfillProtectionDeviceTestStatus"],
    ["LLD", "lldLineTightnessTestStatus"],
    ["ATG", "atgProbesTestStatus"],
    ["Sump", "sumpTestStatus"],
    ["Stage 1", "stage1TestStatus"],
  ];

  // Only show test columns that have at least one non-null value in returned rows
  const activeCols = TEST_COLS.filter(([, key]) =>
    rows.some((r) => r[key] != null && r[key] !== "")
  );

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xs">
      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
        <Table className="size-3.5 text-emerald-700" />
        <span>Matching Records ({rows.length})</span>
      </div>
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-left text-[11px] divide-y divide-gray-200 font-sans">
          <thead className="bg-gray-50/80 sticky top-0 text-gray-600 font-medium">
            <tr>
              <th className="px-2.5 py-1.5 whitespace-nowrap">Store#</th>
              <th className="px-2.5 py-1.5 whitespace-nowrap">City</th>
              <th className="px-2.5 py-1.5 whitespace-nowrap">Street</th>
              {activeCols.map(([label]) => (
                <th key={label} className="px-2.5 py-1.5 whitespace-nowrap">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-2.5 py-1.5 font-semibold text-gray-900 font-mono whitespace-nowrap">
                  #{String(row.storeNumber ?? "")}
                </td>
                <td className="px-2.5 py-1.5 text-gray-700 whitespace-nowrap">{String(row.city ?? "")}</td>
                <td className="px-2.5 py-1.5 text-gray-500 truncate max-w-[120px]">
                  {String(row.streetName ?? "")}
                </td>
                {activeCols.map(([label, key]) => (
                  <td key={label} className="px-2.5 py-1.5">
                    <StatusPill value={row[key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hello! I am your Compliance Intelligence Assistant. Ask me anything about environmental test records, failure rates, expiring certificates, or request visual charts (pie, bar, line trends, scatter plots, histograms).",
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"nlu" | "gemini">("nlu");
  const [latestChart, setLatestChart] = useState<ChartData | null>(null);
  const [latestSql, setLatestSql] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await api.chatbot.query(q, mode);
      const botMsg: Message = {
        role: "bot",
        text: res.answer,
        chart: res.chart,
        sql: res.sql,
        rows: res.rows,
        intent: res.intent,
      };
      setMessages((m) => [...m, botMsg]);
      if (res.chart) setLatestChart(res.chart);
      if (res.sql) setLatestSql(res.sql);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: `⚠️ Error executing request: ${(err as Error).message}. Ensure database and services are running.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-5">
        <div>
          <span className="section-tag">NATURAL LANGUAGE INTELLIGENCE</span>
          <h1 className="text-2xl font-bold font-heading text-gray-900 mt-1">Compliance Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Query environmental records, analyze failure rates, and generate rich interactive visualizations.
          </p>
        </div>

        <Tabs
          items={[
            { id: "nlu", label: "Rule-Based NLU", icon: <Gauge className="size-4" /> },
            { id: "gemini", label: "Gemini AI", icon: <Sparkles className="size-4" /> },
          ]}
          activeId={mode}
          onChange={(id) => setMode(id as "nlu" | "gemini")}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Chat Window Card */}
        <Card className="flex flex-col h-[650px] card-shadow overflow-hidden">
          {/* Chat Header */}
          <CardHeader className="py-3 px-5 bg-gray-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-emerald-50 text-[#166534] border border-emerald-100">
                <MessageSquareText className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 font-heading">
                  {mode === "nlu" ? "Parameterized NLU Engine" : "Gemini AI Natural Language"}
                </h3>
                <span className="text-[10px] text-emerald-700 font-mono font-medium flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CONNECTED TO POSTGRESQL DATABASE
                </span>
              </div>
            </div>
            <Badge variant={mode === "nlu" ? "primary" : "info"} size="sm">
              {mode.toUpperCase()}
            </Badge>
          </CardHeader>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAFAF9]/40">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "bot" && (
                  <div className="p-1.5 rounded-lg bg-[#166534] text-white shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="size-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                    m.role === "user"
                      ? "bg-[#166534] text-white rounded-tr-xs"
                      : "bg-white text-gray-900 rounded-tl-xs border border-gray-200/80"
                  }`}
                >
                  {/* Bot or User Text */}
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    renderBotText(m.text)
                  )}

                  {/* Inline Chart */}
                  {m.chart && (
                    <div className="mt-3.5 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <BarChart3 className="size-3.5 text-emerald-600" />
                          {m.chart.title || "Visual Analysis"}
                        </span>
                        <Badge variant="primary" size="sm">
                          {m.chart.type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/70">
                        <ChartRenderer chart={m.chart} className="min-h-[220px]" />
                      </div>
                    </div>
                  )}

                  {/* Inline Record Table */}
                  {m.rows && m.rows.length > 0 && m.intent === "list_records" && (
                    <InlineRecordTable rows={m.rows} />
                  )}

                  {/* Attached SQL Snippet (collapsible/visible) */}
                  {m.sql && (
                    <details className="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                      <summary className="cursor-pointer hover:text-emerald-700 font-mono font-medium flex items-center gap-1 select-none">
                        <CodeIcon className="size-3" />
                        View Generated SQL Query
                      </summary>
                      <pre className="mt-1.5 p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-800">
                        {m.sql}
                      </pre>
                    </details>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="p-1.5 rounded-lg bg-gray-200 text-gray-700 shrink-0 mt-0.5">
                    <UserCircle2 className="size-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 justify-start">
                <div className="p-1.5 rounded-lg bg-[#166534] text-white shrink-0 shadow-2xs">
                  <Sparkles className="size-4" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs text-gray-600 border border-gray-200/80 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  Analyzing query, generating PostgreSQL statement & computing statistics...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Form Bar */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200/80 flex gap-2 items-center">
            <div className="flex-1">
              <Input
                placeholder={
                  mode === "nlu"
                    ? "Ask question (e.g. 'Failure rate for ATG tests', 'Histogram of store failures', 'Records in Dallas')..."
                    : "Ask Gemini about compliance rules or records..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                leftIcon={<MessageSquareText className="size-4" />}
                className="py-2.5"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="md"
              leftIcon={<SendHorizonal className="size-4" />}
            >
              Send
            </Button>
          </form>
        </Card>

        {/* Sidebar: Suggestions, Active Chart, and Active SQL */}
        <div className="space-y-4">
          {/* Quick Prompts */}
          <Card className="card-shadow">
            <CardHeader className="py-3 px-4">
              <CardTitle icon={<Sparkles className="size-4" />}>
                Recommended Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {examples.map((ex) => (
                  <Button
                    key={ex}
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => setInput(ex)}
                    className="justify-between text-left text-xs text-gray-700 hover:text-[#166534] hover:bg-emerald-50/60 font-normal py-2 h-auto"
                    rightIcon={<ChevronRight className="size-3 text-gray-400" />}
                  >
                    <span className="truncate">{ex}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Chart Display */}
          {latestChart && (
            <Card className="card-shadow border-emerald-200">
              <CardHeader className="py-3 px-4 bg-emerald-50/30">
                <CardTitle icon={<BarChart3 className="size-4" />}>
                  {latestChart.title || "Latest Visual Analysis"}
                </CardTitle>
                <Badge variant="primary" size="sm">
                  {latestChart.type.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <ChartRenderer chart={latestChart} className="min-h-[220px]" />
              </CardContent>
            </Card>
          )}

          {/* SQL Query Inspector */}
          {latestSql && (
            <Card className="card-shadow">
              <CardHeader className="py-3 px-4">
                <CardTitle icon={<CodeIcon className="size-4" />}>
                  SQL Query Inspector
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {latestSql}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
