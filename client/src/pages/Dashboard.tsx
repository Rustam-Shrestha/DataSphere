import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "../lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatsCard,
  Table,
  Badge,
  Alert,
  type Column,
} from "../components/ui";
import { StatusBadge } from "../components/ui/StatusBadge";
import * as d3 from "d3";
import type { ComplianceRecord } from "../types";
import {
  FileText,
  Building2,
  CalendarDays,
  XCircle,
  BarChart3,
  Activity,
  ShieldCheck,
  CheckCircle2,
} from "@assets/icons";

function drawPie(el: HTMLDivElement | null, labels: string[], values: number[]) {
  if (!el || !labels.length) return;
  el.innerHTML = "";
  const w = Math.min(380, el.clientWidth - 20 || 320),
    h = 260,
    r = Math.min(w, h) / 2 - 25;

  const svg = d3
    .select(el)
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .append("g")
    .attr("transform", `translate(${w / 2},${h / 2})`);

  const colorMap: Record<string, string> = {
    PASS: "#15803D",
    FAIL: "#DC2626",
    PENDING: "#D97706",
  };
  const fallbackColors = d3.scaleOrdinal(d3.schemeSet2);

  const pie = d3.pie<string>().value((_, i) => values[i]).sort(null);
  const arc = d3.arc<d3.PieArcDatum<string>>().innerRadius(r * 0.45).outerRadius(r);

  const g = svg.selectAll("path").data(pie(labels)).enter();

  g.append("path")
    .attr("d", arc)
    .attr("fill", (d) => colorMap[d.data] || fallbackColors(d.data))
    .attr("stroke", "#FFFFFF")
    .attr("stroke-width", 2)
    .attr("rx", 4);
}

function drawBar(el: HTMLDivElement | null, labels: string[], values: number[]) {
  if (!el || !labels.length) return;
  el.innerHTML = "";
  const w = Math.min(520, el.clientWidth - 20 || 460),
    h = 260;
  const m = { top: 24, right: 20, bottom: 64, left: 44 };
  const iw = w - m.left - m.right,
    ih = h - m.top - m.bottom;

  const svg = d3
    .select(el)
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .append("g")
    .attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleBand().domain(labels).range([0, iw]).padding(0.25);
  const y = d3.scaleLinear().domain([0, d3.max(values)! * 1.15 || 1]).range([ih, 0]);

  svg
    .append("g")
    .call(d3.axisLeft(y).ticks(5).tickSize(-iw))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").attr("stroke", "#E2E8F0"))
    .call((g) => g.selectAll(".tick text").attr("fill", "#64748B").attr("font-size", "11px").attr("font-family", "Inter"));

  svg
    .append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x))
    .call((g) => g.select(".domain").attr("stroke", "#CBD5E1"))
    .selectAll("text")
    .attr("transform", "rotate(-25)")
    .style("text-anchor", "end")
    .attr("dx", "-.5em")
    .attr("dy", ".3em")
    .attr("fill", "#334155")
    .attr("font-size", "11px")
    .attr("font-family", "Inter");

  svg
    .selectAll("rect")
    .data(values)
    .enter()
    .append("rect")
    .attr("x", (_, i) => x(labels[i])!)
    .attr("y", (d) => y(d))
    .attr("width", x.bandwidth())
    .attr("height", (d) => Math.max(0, ih - y(d)))
    .attr("fill", "#15803D")
    .attr("rx", 4);
}

const TEST_COLS: (keyof ComplianceRecord)[] = [
  "corrosionTestStatus",
  "spillBucketTestStatus",
  "overfillProtectionDeviceTestStatus",
  "lldLineTightnessTestStatus",
  "atgProbesTestStatus",
  "sumpTestStatus",
  "stage1TestStatus",
];

const TEST_LABELS = ["Corrosion", "Spill Buckets", "Overfill", "LLD", "ATG", "Sump", "Stage 1"];

export default function Dashboard() {
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["records", 1, 100, ""],
    queryFn: () => api.records.list(1, 100, ""),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const uniqueCities = new Set(items.map((r) => r.city)).size;

  const statusCounts: Record<string, number> = { PASS: 0, FAIL: 0, PENDING: 0 };
  const testPassFail = TEST_COLS.map(() => ({ pass: 0, fail: 0 }));

  for (const r of items) {
    TEST_COLS.forEach((col, i) => {
      const v = r[col] as string | null;
      if (v === "PASS") statusCounts.PASS++;
      else if (v === "FAIL") statusCounts.FAIL++;
      else statusCounts.PENDING++;
      if (v === "PASS") testPassFail[i].pass++;
      else if (v === "FAIL") testPassFail[i].fail++;
    });
  }

  const now = new Date();
  const soon30 = items.filter((r) => {
    const d = r.deliveryCertificateExpiredDate || r.insuranceExpiredDate;
    if (!d) return false;
    const diff = (new Date(d).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const overdue = items.filter((r) => {
    const d = r.deliveryCertificateExpiredDate || r.insuranceExpiredDate;
    if (!d) return false;
    return new Date(d).getTime() < now.getTime();
  });

  useEffect(() => {
    const dl = Object.keys(statusCounts).filter((k) => statusCounts[k] > 0);
    if (dl.length) drawPie(pieRef.current, dl, dl.map((k) => statusCounts[k]));
  }, [data]);

  useEffect(() => {
    const bv = testPassFail.map((t) => t.pass + t.fail);
    if (bv.some((v) => v > 0)) drawBar(barRef.current, TEST_LABELS, bv);
  }, [data]);

  const recentColumns: Column<Record<string, unknown>>[] = [
    {
      key: "storeNumber",
      label: "Store#",
      isNumeric: true,
      render: (r) => (
        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
          #{String(r.storeNumber)}
        </span>
      ),
    },
    {
      key: "city",
      label: "City Location",
      render: (r) => (
        <span className="font-medium text-slate-900 flex items-center gap-1.5">
          <Building2 className="size-3.5 text-slate-400" />
          {String(r.city)}
        </span>
      ),
    },
    {
      key: "corrosionTestStatus",
      label: "Corrosion",
      align: "center",
      render: (r) => <StatusBadge status={r.corrosionTestStatus as string} />,
    },
    {
      key: "spillBucketTestStatus",
      label: "Spill Bucket",
      align: "center",
      render: (r) => <StatusBadge status={r.spillBucketTestStatus as string} />,
    },
    {
      key: "overfillProtectionDeviceTestStatus",
      label: "Overfill",
      align: "center",
      render: (r) => <StatusBadge status={r.overfillProtectionDeviceTestStatus as string} />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header (Section 32) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <span className="section-tag">OVERVIEW & MONITORING</span>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-1">Compliance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time environmental compliance test metrics, failure distribution, and certificate expirations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" icon={<ShieldCheck className="size-3.5" />}>
            Active Stations: {uniqueCities}
          </Badge>
        </div>
      </div>

      {/* KPI Cards (Section 34 & 35) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Records"
          value={total}
          icon={<FileText className="size-5" />}
          accentColor="green"
          description="Indexed compliance tests"
        />
        <StatsCard
          label="Monitored Cities"
          value={uniqueCities}
          icon={<Building2 className="size-5" />}
          accentColor="blue"
          description="Geographic facility coverage"
        />
        <StatsCard
          label="Expiring (30d)"
          value={soon30.length}
          icon={<CalendarDays className="size-5" />}
          accentColor="amber"
          description="Certificates due soon"
        />
        <StatsCard
          label="Overdue / Expired"
          value={overdue.length}
          icon={<XCircle className="size-5" />}
          accentColor="red"
          description="Requires immediate action"
        />
      </div>

      {/* Overdue Alert banner if any (Section 38) */}
      {overdue.length > 0 && (
        <Alert
          variant="error"
          title={`${overdue.length} Stations with Overdue Certificates Detected`}
        >
          Immediate review required: Delivery or insurance certificates have lapsed for stores including{" "}
          {overdue.slice(0, 3).map((r) => `#${r.storeNumber} (${r.city})`).join(", ")}.
        </Alert>
      )}

      {/* Visualization Grid (Section 29) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <div>
              <CardTitle icon={<Activity className="size-5" />}>
                Test Status Distribution
              </CardTitle>
              <CardDescription>
                Overall ratio of Pass, Fail, and Pending test inspection outcomes.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">PASS: {statusCounts.PASS}</Badge>
              <Badge variant="danger" size="sm">FAIL: {statusCounts.FAIL}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={pieRef} className="min-h-[260px] flex items-center justify-center" />
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <div>
              <CardTitle icon={<BarChart3 className="size-5" />}>
                Inspections by Test Type
              </CardTitle>
              <CardDescription>
                Total completed compliance audits across all 7 critical system lines.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={barRef} className="min-h-[260px] flex items-center justify-center" />
          </CardContent>
        </Card>
      </div>

      {/* Expiry Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate Expiry List */}
        <Card className="card-shadow lg:col-span-1">
          <CardHeader>
            <CardTitle icon={<CalendarDays className="size-5" />}>
              Certificate Expirations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {soon30.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 font-mono">
                  <span>Expiring Soon (&lt; 30 Days)</span>
                  <Badge variant="warning" size="sm">{soon30.length}</Badge>
                </div>
                <div className="space-y-2">
                  {soon30.slice(0, 5).map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-md border border-amber-200 bg-[#FEF3C7]/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">Store #{r.storeNumber}</span>
                        <span className="text-slate-500 ml-1.5">({r.city})</span>
                      </div>
                      <Badge variant="warning" size="sm">Due Soon</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overdue.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-red-800 uppercase tracking-wider mb-2 font-mono">
                  <span>Overdue / Expired</span>
                  <Badge variant="danger" size="sm">{overdue.length}</Badge>
                </div>
                <div className="space-y-2">
                  {overdue.slice(0, 5).map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-md border border-red-200 bg-[#FEE2E2]/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">Store #{r.storeNumber}</span>
                        <span className="text-slate-500 ml-1.5">({r.city})</span>
                      </div>
                      <Badge variant="danger" size="sm">Lapsed</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {soon30.length === 0 && overdue.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle2 className="size-8 text-[#15803D] mx-auto mb-2" />
                All station certificates and environmental filings are up to date.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Records Audit Table */}
        <Card className="card-shadow lg:col-span-2 overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle icon={<ShieldCheck className="size-5" />}>
                Latest Station Test Audits
              </CardTitle>
              <CardDescription>
                Recent record submissions and primary test results.
              </CardDescription>
            </div>
          </CardHeader>
          <Table
            columns={recentColumns}
            data={(items.slice(0, 6) as unknown as Record<string, unknown>[])}
            loading={isLoading}
            emptyMessage="No inspection records available yet."
          />
        </Card>
      </div>
    </div>
  );
}
