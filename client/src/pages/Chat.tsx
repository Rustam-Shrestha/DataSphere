import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
} from "@assets/icons";

type Message = { role: "user" | "bot"; text: string };

const examples = [
  "What is the failure rate for Corrosion tests?",
  "Show me a pie chart of pass/fail for Spill Buckets",
  "Plot a line chart of test trends over time",
  "Draw a doughnut chart of all test results",
  "Compare corrosion vs spill buckets",
  "What's the pass:fail ratio for ATG probes?",
  "Show me records for store #3",
  "What certificates are expiring soon?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hello! I am your Compliance Intelligence Assistant. Ask me anything about test failure rates, expiring certificates, or request interactive charts (pie, bar, line trends).",
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"nlu" | "gemini">("nlu");
  const [chart, setChart] = useState<ChartData | null>(null);
  const [sql, setSql] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const q = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    setChart(null);
    setSql("");

    try {
      const res = await api.chatbot.query(q, mode);
      setMessages((m) => [...m, { role: "bot", text: res.answer }]);
      if (res.chart) setChart(res.chart);
      if (res.sql) setSql(res.sql);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: `Error: ${(err as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-5">
        <div>
          <span className="section-tag">NATURAL LANGUAGE INTERFACE</span>
          <h1 className="text-2xl font-bold font-heading text-gray-900 mt-1">Compliance Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Query environmental records, failure rates, and generate data visualizations in plain English.
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Chat Window Card */}
        <Card className="flex flex-col h-[620px] card-shadow overflow-hidden">
          {/* Chat Header */}
          <CardHeader className="py-3 px-5 bg-gray-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-emerald-50 text-[#166534] border border-emerald-100">
                <MessageSquareText className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 font-heading">
                  {mode === "nlu" ? "Parameterized NLU Engine" : "Gemini 1.5 Pro Natural Language"}
                </h3>
                <span className="text-[10px] text-emerald-700 font-mono font-medium flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CONNECTED TO DATABASE
                </span>
              </div>
            </div>
            <Badge variant={mode === "nlu" ? "primary" : "info"} size="sm">
              {mode.toUpperCase()}
            </Badge>
          </CardHeader>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAFAF9]/40">
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
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                    m.role === "user"
                      ? "bg-[#166534] text-white rounded-tr-xs"
                      : "bg-white text-gray-900 rounded-tl-xs border border-gray-200/80"
                  }`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, "<br>") }}
                />
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
                <div className="bg-white rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs text-gray-500 italic border border-gray-200/80 flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  Generating query plan & analyzing compliance records...
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
                    ? "Ask question (e.g., 'What is failure rate for ATG tests in Houston?')"
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

        {/* Sidebar: Suggestions & Charts */}
        <div className="space-y-4">
          {/* Quick Prompts */}
          <Card className="card-shadow">
            <CardHeader className="py-3 px-4">
              <CardTitle icon={<Sparkles className="size-4" />}>
                Recommended Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1.5">
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

          {/* Chart Display */}
          {chart && (
            <Card className="card-shadow border-emerald-200">
              <CardHeader className="py-3 px-4 bg-emerald-50/30">
                <CardTitle icon={<BarChart3 className="size-4" />}>
                  {chart.title || "Visual Analysis"}
                </CardTitle>
                <Badge variant="primary" size="sm">
                  {chart.type}
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <ChartRenderer chart={chart} className="min-h-[220px]" />
              </CardContent>
            </Card>
          )}

          {/* SQL Query Inspector */}
          {sql && (
            <Card className="card-shadow">
              <CardHeader className="py-3 px-4">
                <CardTitle icon={<CodeIcon className="size-4" />}>
                  SQL Query Inspector
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {sql}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
