interface Props {
  status: string | null | undefined;
}

const styles: Record<string, string> = {
  PASS: "bg-emerald-100 text-emerald-800",
  FAIL: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: Props) {
  if (!status) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">-</span>;
  const cls = styles[status] ?? "bg-amber-100 text-amber-800";
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}
