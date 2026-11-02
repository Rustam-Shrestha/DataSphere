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
  const getAlignment = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center justify-center";
    if (align === "right") return "text-right justify-end";
    return "text-left justify-start";
  };

  return (
    <div className={cn("overflow-x-auto w-full", className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 text-xs uppercase tracking-wider font-semibold">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-3 px-4 font-semibold text-gray-700 whitespace-nowrap",
                  getAlignment(col.align),
                  col.className
                )}
              >
                <div className={cn("inline-flex items-center gap-1.5", getAlignment(col.align))}>
                  {col.icon && <span className="text-gray-400 size-3.5">{col.icon}</span>}
                  <span>{col.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: loadingRows }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="py-3.5 px-4">
                    <div className="h-4 bg-gray-200/80 rounded w-4/5" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-gray-50 rounded-full text-gray-300">
                    {emptyIcon || <TableIcon className="size-6" />}
                  </div>
                  <span className="text-sm font-medium text-gray-500">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={(row.id as string) ?? i}
                className={cn(
                  "transition-colors duration-150",
                  striped && i % 2 === 1 ? "bg-gray-50/40" : "bg-white",
                  onRowClick ? "cursor-pointer hover:bg-emerald-50/40" : "hover:bg-gray-50/70"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "py-3 px-4 text-gray-700 align-middle",
                      col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left",
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
