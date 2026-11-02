import { useState, useEffect } from "react";
import { useRecord, useUpdateRecord, useDeleteRecord } from "../hooks/useRecords";
import { Modal, Button, Input } from "./ui";
import {
  PencilLine,
  CheckMarkIcon,
  TrashIcon,
  Calendar,
  Building2,
  ShieldCheck,
  X,
} from "@assets/icons";

const FIELD_LABELS: Record<string, string> = {
  storeNumber: "Store #",
  city: "City",
  streetName: "Street Name",
  facilityId: "Facility ID",
  channelOfTrade: "Channel of Trade",
  deliveryCertificateExpiredDate: "Delivery Cert Expiry",
  insuranceExpiredDate: "Insurance Expiry",
  corrosionTestDate: "Corrosion Date",
  corrosionTestStatus: "Corrosion Status (PASS/FAIL)",
  spillBucketsTestDate: "Spill Buckets Date",
  spillBucketTestStatus: "Spill Buckets Status (PASS/FAIL)",
  overfillProtectionDeviceTestDate: "Overfill Date",
  overfillProtectionDeviceTestStatus: "Overfill Status (PASS/FAIL)",
  lldLineTightnessTestDate: "LLD Date",
  lldLineTightnessTestStatus: "LLD Status (PASS/FAIL)",
  atgProbesTestDate: "ATG Date",
  atgProbesTestStatus: "ATG Status (PASS/FAIL)",
  sumpTestDate: "Sump Date",
  sumpTestStatus: "Sump Status (PASS/FAIL)",
  stage1TestDate: "Stage 1 Date",
  stage1TestStatus: "Stage 1 Status (PASS/FAIL)",
};

const DATE_FIELDS = new Set([
  "deliveryCertificateExpiredDate",
  "insuranceExpiredDate",
  "corrosionTestDate",
  "spillBucketsTestDate",
  "overfillProtectionDeviceTestDate",
  "lldLineTightnessTestDate",
  "atgProbesTestDate",
  "sumpTestDate",
  "stage1TestDate",
]);

interface Props {
  recordId: string | null;
  onClose: () => void;
}

export function EditModal({ recordId, onClose }: Props) {
  const { data: record, isLoading } = useRecord(recordId);
  const updateMutation = useUpdateRecord();
  const deleteMutation = useDeleteRecord();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (record) {
      const init: Record<string, string> = {};
      for (const key of Object.keys(FIELD_LABELS)) {
        const val = (record as unknown as Record<string, unknown>)[key];
        init[key] = val
          ? DATE_FIELDS.has(key)
            ? new Date(val as string).toISOString().split("T")[0]
            : String(val)
          : "";
      }
      setForm(init);
    }
  }, [record]);

  if (!recordId) return null;

  const handleSave = async () => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (k === "storeNumber" || k === "facilityId") {
        payload[k] = v ? Number(v) : null;
      } else {
        payload[k] = v || null;
      }
    }
    await updateMutation.mutateAsync({ id: recordId, data: payload });
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete Store #${record?.storeNumber} record? This action is permanent.`)) {
      return;
    }
    await deleteMutation.mutateAsync(recordId);
    onClose();
  };

  return (
    <Modal
      open={Boolean(recordId)}
      onClose={onClose}
      title={record ? `Edit Compliance Record — Store #${record.storeNumber}` : "Loading Record..."}
      subtitle={record ? `${record.city} • ${record.streetName}` : undefined}
      icon={<PencilLine className="size-5" />}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || isLoading}
            leftIcon={<TrashIcon className="size-4" />}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Record"}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} leftIcon={<X className="size-4" />}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending || isLoading}
              loading={updateMutation.isPending}
              leftIcon={<CheckMarkIcon className="size-4" />}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-500 font-mono">
          Loading record details from database...
        </div>
      ) : (
        <div className="space-y-6">
          {/* General Station Information */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#15803D] font-semibold mb-3 flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              <span>Station Identification</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store Number"
                type="number"
                value={form.storeNumber ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, storeNumber: e.target.value }))}
                required
              />
              <Input
                label="Facility ID"
                type="number"
                value={form.facilityId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, facilityId: e.target.value }))}
              />
              <Input
                label="City Location"
                value={form.city ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
              <Input
                label="Street Name"
                value={form.streetName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, streetName: e.target.value }))}
                required
              />
              <Input
                label="Channel of Trade"
                value={form.channelOfTrade ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, channelOfTrade: e.target.value }))}
              />
            </div>
          </div>

          {/* Certificate Expirations */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#D97706] font-semibold mb-3 flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>Compliance Certificates Expiration</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Delivery Certificate Expiry Date"
                type="date"
                value={form.deliveryCertificateExpiredDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, deliveryCertificateExpiredDate: e.target.value }))}
                leftIcon={<Calendar className="size-4" />}
              />
              <Input
                label="Insurance Expiration Date"
                type="date"
                value={form.insuranceExpiredDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, insuranceExpiredDate: e.target.value }))}
                leftIcon={<Calendar className="size-4" />}
              />
            </div>
          </div>

          {/* Test Line Items */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-800 font-semibold mb-3 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#15803D]" />
              <span>System Compliance Inspection Lines</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {[
                { name: "Corrosion", dateKey: "corrosionTestDate", statusKey: "corrosionTestStatus" },
                { name: "Spill Buckets", dateKey: "spillBucketsTestDate", statusKey: "spillBucketTestStatus" },
                { name: "Overfill Protection", dateKey: "overfillProtectionDeviceTestDate", statusKey: "overfillProtectionDeviceTestStatus" },
                { name: "LLD / Line Tightness", dateKey: "lldLineTightnessTestDate", statusKey: "lldLineTightnessTestStatus" },
                { name: "ATG / Probes", dateKey: "atgProbesTestDate", statusKey: "atgProbesTestStatus" },
                { name: "Sump", dateKey: "sumpTestDate", statusKey: "sumpTestStatus" },
                { name: "Stage 1", dateKey: "stage1TestDate", statusKey: "stage1TestStatus" },
              ].map((test) => (
                <div key={test.name} className="p-3 rounded-md border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-800">{test.name}</div>
                  <Input
                    label="Inspection Date"
                    type="date"
                    value={form[test.dateKey] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [test.dateKey]: e.target.value }))}
                  />
                  <Input
                    label="Status (PASS / FAIL)"
                    value={form[test.statusKey] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [test.statusKey]: e.target.value.toUpperCase() }))}
                    placeholder="PASS or FAIL"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
