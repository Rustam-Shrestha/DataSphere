import { useState } from "react";
import { useRecords } from "../hooks/useRecords";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EditModal } from "../components/EditModal";
import { Card, Button, Input, Table, Badge, type Column } from "../components/ui";
import {
  SearchIcon,
  X,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  Table as TableIcon,
  Building2,
  ShieldCheck,
} from "@assets/icons";

export default function Data() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const { data, isLoading } = useRecords(page, 25, search);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "storeNumber",
      label: "Store#",
      align: "left",
      render: (r) => (
        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
          #{String(r.storeNumber)}
        </span>
      ),
    },
    {
      key: "city",
      label: "City",
      render: (r) => (
        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
          <Building2 className="size-3.5 text-gray-400" />
          {String(r.city)}
        </span>
      ),
    },
    {
      key: "streetName",
      label: "Street Address",
      className: "max-w-[160px] truncate",
      render: (r) => <span className="text-gray-600 truncate block">{String(r.streetName)}</span>,
    },
    {
      key: "facilityId",
      label: "Facility ID",
      align: "center",
      render: (r) => (
        <span className="text-xs font-mono text-gray-500">
          {r.facilityId ? String(r.facilityId) : "—"}
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
    {
      key: "lldLineTightnessTestStatus",
      label: "LLD",
      align: "center",
      render: (r) => <StatusBadge status={r.lldLineTightnessTestStatus as string} />,
    },
    {
      key: "atgProbesTestStatus",
      label: "ATG Probes",
      align: "center",
      render: (r) => <StatusBadge status={r.atgProbesTestStatus as string} />,
    },
    {
      key: "sumpTestStatus",
      label: "Sump",
      align: "center",
      render: (r) => <StatusBadge status={r.sumpTestStatus as string} />,
    },
    {
      key: "stage1TestStatus",
      label: "Stage 1",
      align: "center",
      render: (r) => <StatusBadge status={r.stage1TestStatus as string} />,
    },
    {
      key: "id",
      label: "Action",
      align: "right",
      render: (r) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditId(r.id as string)}
          leftIcon={<PencilLine className="size-3.5" />}
          className="text-xs"
        >
          Edit
        </Button>
      ),
    },
  ];

  const totalPages = data ? Math.ceil(data.total / data.pageSize) || 1 : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-5">
        <div>
          <span className="section-tag">COMPLIANCE LEDGER</span>
          <h1 className="text-2xl font-bold font-heading text-gray-900 mt-1">Compliance Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Query, inspect test statuses across all fuel stations, and update inspection records.
          </p>
        </div>
        {data && (
          <Badge variant="primary" icon={<ShieldCheck className="size-3.5" />}>
            {data.total} Total Records Indexed
          </Badge>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 card-shadow">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by store number, city, or street..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<SearchIcon className="size-4" />}
            />
          </div>
          {search && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              leftIcon={<X className="size-4" />}
            >
              Clear Filter
            </Button>
          )}
          <div className="sm:ml-auto flex items-center gap-2 text-xs text-gray-500 font-mono">
            <TableIcon className="size-4 text-emerald-700" />
            <span>25 records / page</span>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="card-shadow overflow-hidden">
        <Table
          columns={columns}
          data={(data?.items as unknown as Record<string, unknown>[]) ?? []}
          loading={isLoading}
          emptyMessage={search ? `No records matching "${search}"` : "No compliance records available. Upload data first."}
          emptyIcon={<TableIcon className="size-8 text-gray-300" />}
        />
      </Card>

      {/* Pagination Controls */}
      {data && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <span className="text-xs text-gray-500 font-medium">
            Showing Page <span className="font-bold text-gray-800">{data.page}</span> of{" "}
            <span className="font-bold text-gray-800">{totalPages}</span> ({data.total} total)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="size-4" />}
            >
              Previous
            </Button>
            <div className="px-3 py-1 rounded-md text-xs font-mono font-semibold bg-gray-100 text-gray-700">
              {page} / {totalPages}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronRight className="size-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editId && <EditModal recordId={editId} onClose={() => setEditId(null)} />}
    </div>
  );
}
