import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "../lib/api";
import { Card, StatsCard, Table } from "../components/ui";
import { StatusBadge } from "../components/StatusBadge";
import * as d3 from "d3";
import type { ComplianceRecord } from "../types";

function drawPie(el: HTMLDivElement | null, labels: string[], values: number[]) {
  if (!el || !labels.length) return;
  el.innerHTML = "";
  const w = Math.min(350, el.clientWidth - 40 || 310), h = 260, r = Math.min(w, h) / 2 - 30;
  const svg = d3.select(el).append("svg").attr("width", w).attr("height", h)
    .append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  const color = d3.scaleOrdinal(d3.schemeSet2);
  const pie = d3.pie<string>().value((_, i) => values[i]);
  const arc = d3.arc<d3.PieArcDatum<string>>().innerRadius(0).outerRadius(r);
  svg.selectAll("path").data(pie(labels)).enter().append("path")
    .attr("d", arc).attr("fill", (_, i) => color(i.toString()));
}

function drawBar(el: HTMLDivElement | null, labels: string[], values: number[]) {
  if (!el || !labels.length) return;
  el.innerHTML = "";
  const w = Math.min(500, el.clientWidth - 40 || 460), h = 250;
  const m = { top: 20, right: 20, bottom: 60, left: 50 };
  const iw = w - m.left - m.right, ih = h - m.top - m.bottom;
  const svg = d3.select(el).append("svg").attr("width", w).attr("height", h)
    .append("g").attr("transform", `translate(${m.left},${m.top})`);
  const x = d3.scaleBand().domain(labels).range([0, iw]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(values)! * 1.1 || 1]).range([ih, 0]);
  svg.append("g").call(d3.axisLeft(y).ticks(5));
  svg.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x))
    .selectAll("text").attr("transform", "rotate(-25)").style("text-anchor", "end").attr("dx", "-.5em").attr("dy", ".3em");
  svg.selectAll("rect").data(values).enter().append("rect")
    .attr("x", (_, i) => x(labels[i])!).attr("y", (d) => y(d))
    .attr("width", x.bandwidth()).attr("height", (d) => ih - y(d))
    .attr("fill", "#3b82f6").attr("rx", 3);
}

const TEST_COLS: (keyof ComplianceRecord)[] = [
  "corrosionTestStatus", "spillBucketTestStatus", "overfillProtectionDeviceTestStatus",
  "lldLineTightnessTestStatus", "atgProbesTestStatus", "sumpTestStatus", "stage1TestStatus",
];

const TEST_LABELS = ["Corrosion", "Spill Buckets", "Overfill", "LLD", "ATG", "Sump", "Stage 1"];

export default function Dashboard() {
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of compliance test records.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Total Records" value={total} />
        <StatsCard label="Locations" value={uniqueCities} />
        <StatsCard label="Expiring Soon" value={soon30.length} />
        <StatsCard label="Overdue" value={overdue.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">Test Status Distribution</h2>
          <div ref={pieRef} className="min-h-[240px] flex items-center justify-center" />
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">Pass / Fail by Test Type</h2>
          <div ref={barRef} className="min-h-[240px] flex items-center justify-center" />
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Expiry Overview</h2>
        {soon30.length > 0 ? (
          <>
            <h3 className="text-xs font-medium text-amber-700 mb-1">Expiring within 30 days ({soon30.length})</h3>
            <ul className="mb-3 space-y-1">
              {soon30.slice(0, 10).map((r, i) => (
                <li key={i} className="text-sm">Store #{r.storeNumber} ({r.city})</li>
              ))}
            </ul>
          </>
        ) : overdue.length > 0 ? null : (
          <p className="text-sm text-gray-400">No upcoming expirations.</p>
        )}
        {overdue.length > 0 && (
          <>
            <h3 className="text-xs font-medium text-red-700 mb-1">Overdue ({overdue.length})</h3>
            <ul className="space-y-1">
              {overdue.slice(0, 10).map((r, i) => (
                <li key={i} className="text-sm">Store #{r.storeNumber} ({r.city})</li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Recent Records</h2>
        <Table
          columns={[
            { key: "storeNumber", label: "Store#" },
            { key: "city", label: "City" },
            { key: "corrosionTestStatus", label: "Corrosion", render: (r) => <StatusBadge status={r.corrosionTestStatus as string} /> },
            { key: "spillBucketTestStatus", label: "Spill", render: (r) => <StatusBadge status={r.spillBucketTestStatus as string} /> },
            { key: "overfillProtectionDeviceTestStatus", label: "Overfill", render: (r) => <StatusBadge status={r.overfillProtectionDeviceTestStatus as string} /> },
          ]}
          data={(items.slice(0, 5) as unknown as Record<string, unknown>[])}
          emptyMessage="No records"
        />
      </Card>
    </div>
  );
}
