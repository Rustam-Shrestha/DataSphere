import { useState } from "react";
import { useRecords } from "../hooks/useRecords";
import { StatusBadge } from "../components/StatusBadge";
import { EditModal } from "../components/EditModal";
import { Card, Button, Input, Table } from "../components/ui";

export default function Data() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const { data, isLoading } = useRecords(page, 25, search);

  const columns = [
    { key: "storeNumber", label: "Store#" },
    { key: "city", label: "City" },
    { key: "streetName", label: "Street", className: "max-w-[140px] truncate" },
    { key: "facilityId", label: "Facility", render: (r: Record<string, unknown>) => String(r.facilityId ?? "-") },
    { key: "corrosionTestStatus", label: "Corrosion", render: (r: Record<string, unknown>) => <StatusBadge status={r.corrosionTestStatus as string} /> },
    { key: "spillBucketTestStatus", label: "Spill", render: (r: Record<string, unknown>) => <StatusBadge status={r.spillBucketTestStatus as string} /> },
    { key: "overfillProtectionDeviceTestStatus", label: "Overfill", render: (r: Record<string, unknown>) => <StatusBadge status={r.overfillProtectionDeviceTestStatus as string} /> },
    { key: "lldLineTightnessTestStatus", label: "LLD", render: (r: Record<string, unknown>) => <StatusBadge status={r.lldLineTightnessTestStatus as string} /> },
    { key: "atgProbesTestStatus", label: "ATG", render: (r: Record<string, unknown>) => <StatusBadge status={r.atgProbesTestStatus as string} /> },
    { key: "sumpTestStatus", label: "Sump", render: (r: Record<string, unknown>) => <StatusBadge status={r.sumpTestStatus as string} /> },
    { key: "stage1TestStatus", label: "Stage 1", render: (r: Record<string, unknown>) => <StatusBadge status={r.stage1TestStatus as string} /> },
    { key: "id", label: "", render: (r: Record<string, unknown>) => <Button variant="ghost" onClick={() => setEditId(r.id as string)}>Edit</Button> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Compliance Records</h1>
        <p className="text-gray-500 text-sm mt-1">Browse, search, and manage imported records.</p>
      </div>

      <div className="flex items-center gap-3">
        <Input className="max-w-xs" placeholder="Search by city, store#, street..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <Button variant="secondary" onClick={() => { setSearch(""); setPage(1); }}>Clear</Button>
        <span className="text-sm text-gray-500 ml-auto">{data ? `${data.total} record(s)` : ""}</span>
      </div>

      <Card className="overflow-hidden">
        <Table columns={columns} data={(data?.items as unknown as Record<string, unknown>[]) ?? []}
          loading={isLoading} emptyMessage="No records found" />
      </Card>

      {data && (
        <div className="flex items-center gap-3 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-gray-600">Page {data.page} of {Math.ceil(data.total / data.pageSize) || 1}</span>
          <Button variant="secondary" disabled={page * data.pageSize >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {editId && <EditModal recordId={editId} onClose={() => setEditId(null)} />}
    </div>
  );
}
