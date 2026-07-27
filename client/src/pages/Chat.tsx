import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { Card, Button, Input } from "../components/ui";
import * as d3 from "d3";

type Message = { role: "user" | "bot"; text: string };

const examples = [
  "What is the failure rate for Corrosion tests?",
  "How many PASS for Spill Buckets tests?",
  "Show me records for store #3",
  "What certificates are expiring soon?",
  "Show me a chart of all test results",
];

function drawChart(el: HTMLDivElement | null, chart: { type: string; labels: string[]; values: number[] }) {
  if (!el || !chart.labels?.length) return;
  el.innerHTML = "";
  const w = Math.min(400, el.clientWidth - 40 || 360), h = 220;
  const m = { top: 20, right: 20, bottom: 50, left: 45 };
  const iw = w - m.left - m.right, ih = h - m.top - m.bottom;

  if (chart.type === "pie") {
    const r = Math.min(iw, ih) / 2;
    const svg = d3.select(el).append("svg").attr("width", w).attr("height", h)
      .append("g").attr("transform", `translate(${w / 2},${h / 2})`);
    const color = d3.scaleOrdinal(d3.schemeSet2);
    const pie = d3.pie<string>().value((_, i) => chart.values[i]);
    const arc = d3.arc<d3.PieArcDatum<string>>().innerRadius(0).outerRadius(r);
    svg.selectAll("path").data(pie(chart.labels)).enter().append("path")
      .attr("d", arc).attr("fill", (_, i) => color(i.toString()));
    return;
  }

  const svg = d3.select(el).append("svg").attr("width", w).attr("height", h)
    .append("g").attr("transform", `translate(${m.left},${m.top})`);
  const x = d3.scaleBand().domain(chart.labels).range([0, iw]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(chart.values)! * 1.1 || 1]).range([ih, 0]);
  svg.append("g").call(d3.axisLeft(y).ticks(4));
  svg.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x))
    .selectAll("text").attr("transform", "rotate(-20)").style("text-anchor", "end").attr("dx", "-.3em").attr("dy", ".3em");
  svg.selectAll("rect").data(chart.values).enter().append("rect")
    .attr("x", (_, i) => x(chart.labels[i])!).attr("y", (d) => y(d))
    .attr("width", x.bandwidth()).attr("height", (d) => ih - y(d))
    .attr("fill", "#3b82f6").attr("rx", 3);
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! Ask me about your compliance data — failure rates, status counts, or specific records." },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"nlu" | "gemini">("nlu");
  const [chart, setChart] = useState<{ type: string; labels: string[]; values: number[] } | null>(null);
  const [sql, setSql] = useState("");
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (chart && chartRef.current) drawChart(chartRef.current, chart); }, [chart]);

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Compliance Chat</h1>
        <p className="text-gray-500 text-sm mt-1">Ask questions about your data in natural language.</p>
      </div>

      <div className="flex gap-2">
        {(["nlu", "gemini"] as const).map((m) => (
          <Button key={m} variant={mode === m ? "primary" : "secondary"} className="rounded-full" onClick={() => setMode(m)}>
            {m === "nlu" ? "NLU Engine" : "Gemini AI"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <Card className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, "<br>") }} />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl rounded-bl-md px-4 py-2 text-sm text-gray-500 italic">Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-200">
            <Input className="flex-1" placeholder={mode === "nlu" ? "e.g. What's the failure rate for Corrosion?" : "Ask Gemini about compliance..."}
              value={input} onChange={(e) => setInput(e.target.value)} />
            <Button type="submit" disabled={loading || !input.trim()}>Send</Button>
          </form>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">Example Questions</h3>
            <ul className="space-y-1">
              {examples.map((ex) => (
                <li key={ex}><Button variant="ghost" onClick={() => setInput(ex)}>{ex}</Button></li>
              ))}
            </ul>
          </Card>
          {chart && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2">Visualization</h3>
              <div ref={chartRef} className="min-h-[180px]" />
            </Card>
          )}
          {sql && (
            <Card className="p-4">
              <details>
                <summary className="text-sm text-gray-500 cursor-pointer">SQL Query</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">{sql}</pre>
              </details>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
