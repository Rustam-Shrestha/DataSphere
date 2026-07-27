import { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  RadarController,
  PolarAreaController,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData } from "../types";

ChartJS.register(
  ArcElement, BarElement, LineElement, PointElement,
  RadarController, PolarAreaController,
  CategoryScale, LinearScale, RadialLinearScale,
  Tooltip, Legend,
);

const COLORS = [
  "#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

type ChartConfig = Record<string, unknown>;

function toConfig(chart: ChartData): ChartConfig {
  const type = chart.type || "bar";

  // Pie / Doughnut / PolarArea
  if (type === "pie" || type === "doughnut" || type === "polarArea") {
    const ds = chart.datasets?.[0];
    const data = ((ds?.data ?? chart.values) ?? []) as number[];
    const bg = (ds?.backgroundColor as string[] | undefined)
      ?? data.map((_, i) => COLORS[i % COLORS.length]);
    return {
      type, data: { labels: chart.labels, datasets: [{ data, backgroundColor: bg, borderWidth: 1 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, padding: 12 } },
          title: chart.title ? { display: true, text: chart.title } : undefined,
        },
      },
    };
  }

  // Radar
  if (type === "radar") {
    const ds = (chart.datasets ?? []).map((d, i) => ({
      label: d.label, data: d.data as number[],
      borderColor: d.borderColor || COLORS[i % COLORS.length],
      backgroundColor: d.backgroundColor || (COLORS[i % COLORS.length] + "40"),
      fill: d.fill ?? false, pointRadius: d.pointRadius ?? 3,
    }));
    return {
      type, data: { labels: chart.labels, datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } },
          title: chart.title ? { display: true, text: chart.title } : undefined,
        },
      },
    };
  }

  // Scatter
  if (type === "scatter") {
    const ds = (chart.datasets ?? []).map((d, i) => ({
      label: d.label, data: d.data as { x: number; y: number }[],
      backgroundColor: d.backgroundColor || COLORS[i % COLORS.length],
      pointRadius: d.pointRadius ?? 5,
    }));
    return {
      type, data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: chart.xLabel || "X" } },
          y: { title: { display: true, text: chart.yLabel || "Y" }, beginAtZero: true },
        },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } },
          title: chart.title ? { display: true, text: chart.title } : undefined,
        },
      },
    };
  }

  // Bar / Line
  {
    const labels = chart.labels;
    let datasets: Record<string, unknown>[];

    if (chart.datasets && chart.datasets.length > 0) {
      datasets = chart.datasets.map((d, i) => ({
        label: d.label, data: d.data as number[],
        backgroundColor: d.backgroundColor || COLORS[i % COLORS.length],
        borderRadius: 3,
      }));
    } else {
      datasets = [{
        label: "Count", data: chart.values as number[],
        backgroundColor: chart.labels.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 3,
      }];
    }

    return {
      type: type === "line" ? "line" : "bar",
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { title: chart.xLabel ? { display: true, text: chart.xLabel } : undefined },
          y: { title: chart.yLabel ? { display: true, text: chart.yLabel } : undefined, beginAtZero: true },
        },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12 } },
          title: chart.title ? { display: true, text: chart.title } : undefined,
        },
      },
    };
  }
}

interface Props {
  chart: ChartData;
  className?: string;
}

export default function ChartRenderer({ chart, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !chart) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    try {
      const config = toConfig(chart);
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      chartRef.current = new ChartJS(ctx, config as any);
    } catch (err) {
      console.error("Chart render error:", err);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chart]);

  return (
    <div className={`w-full ${className}`} style={{ minHeight: 220 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
