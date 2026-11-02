import type { ReactNode } from "react";
import { cn } from "@/utils";
import { Table as TableIcon } from "@assets/icons";

export interface Column<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  isNumeric?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  loading?: boolean;
  loadingRows?: number;
  striped?: boolean;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No records found",
  emptyIcon,
  loading = false,
  loadingRows = 5,
  striped = false,
  className = "",
}: TableProps<T>) {
  const getAlignment = (align?: "left" | "center" | "right", isNumeric?: boolean) => {
    if (align === "right" || isNumeric) return "text-right justify-end";
    if (align === "center") return "text-center justify-center";
    return "text-left justify-start";
  };

  return (
    <div className={cn("overflow-x-auto w-full border border-slate-200 rounded-lg bg-white shadow-subtle", className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-700 text-xs font-semibold select-none">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap",
                  getAlignment(col.align, col.isNumeric),
                  col.className
                )}
              >
                <div className={cn("inline-flex items-center gap-1.5", getAlignment(col.align, col.isNumeric))}>
                  {col.icon && <span className="text-slate-400 size-3.5">{col.icon}</span>}
                  <span>{col.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? (
            Array.from({ length: loadingRows }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse h-12">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="py-3 px-4">
                    <div className="h-4 bg-slate-200/80 rounded w-4/5" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-slate-50 rounded-full text-slate-400 border border-slate-200">
                    {emptyIcon || <TableIcon className="size-5" />}
                  </div>
                  <span className="text-sm font-medium text-slate-600">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={(row.id as string) ?? i}
                className={cn(
                  "transition-colors duration-150 h-12",
                  striped && i % 2 === 1 ? "bg-slate-50/40" : "bg-white",
                  onRowClick ? "cursor-pointer hover:bg-[#DCFCE7]/30" : "hover:bg-slate-50/80"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "py-3 px-4 text-slate-700 align-middle",
                      col.isNumeric && "tabular-nums",
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right" || col.isNumeric
                        ? "text-right"
                        : "text-left",
                      col.className
                    )}
                  >
                    {col.render ? col.render(row, i) : ((row[col.key] as ReactNode) ?? "-")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
