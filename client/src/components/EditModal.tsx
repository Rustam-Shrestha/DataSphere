import { useState, useEffect } from "react";
import { useRecord, useUpdateRecord, useDeleteRecord } from "../hooks/useRecords";
import { Modal, Button, Input } from "./ui";

const FIELD_LABELS: Record<string, string> = {
  storeNumber: "Store#",
  city: "City",
  streetName: "Street Name",
  facilityId: "Facility ID",
  channelOfTrade: "Channel of Trade",
  deliveryCertificateExpiredDate: "Delivery Cert Expiry",
  insuranceExpiredDate: "Insurance Expiry",
  corrosionTestDate: "Corrosion Date",
  corrosionTestStatus: "Corrosion Status",
  spillBucketsTestDate: "Spill Buckets Date",
  spillBucketTestStatus: "Spill Buckets Status",
  overfillProtectionDeviceTestDate: "Overfill Date",
  overfillProtectionDeviceTestStatus: "Overfill Status",
  lldLineTightnessTestDate: "LLD Date",
  lldLineTightnessTestStatus: "LLD Status",
  atgProbesTestDate: "ATG Date",
  atgProbesTestStatus: "ATG Status",
  sumpTestDate: "Sump Date",
  sumpTestStatus: "Sump Status",
  stage1TestDate: "Stage 1 Date",
  stage1TestStatus: "Stage 1 Status",
};

const DATE_FIELDS = new Set([
  "deliveryCertificateExpiredDate", "insuranceExpiredDate",
  "corrosionTestDate", "spillBucketsTestDate",
  "overfillProtectionDeviceTestDate", "lldLineTightnessTestDate",
  "atgProbesTestDate", "sumpTestDate", "stage1TestDate",
]);

interface Props {
  recordId: string | null;
  onClose: () => void;
}

export function EditModal({ recordId, onClose }: Props) {
  const { data: record } = useRecord(recordId);
  const updateMutation = useUpdateRecord();
  const deleteMutation = useDeleteRecord();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (record) {
      const init: Record<string, string> = {};
      for (const key of Object.keys(FIELD_LABELS)) {
        const val = (record as unknown as Record<string, unknown>)[key];
        init[key] = val ? (DATE_FIELDS.has(key) ? new Date(val as string).toISOString().split("T")[0] : String(val)) : "";
      }
      setForm(init);
    }
  }, [record]);

  if (!recordId || !record) return null;

  const handleSave = async () => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) payload[k] = v || null;
    await updateMutation.mutateAsync({ id: recordId, data: payload });
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this record?")) return;
    await deleteMutation.mutateAsync(recordId);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`Edit Record #${record.storeNumber} - ${record.city}`}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {Object.entries(FIELD_LABELS).map(([key, label]) => (
          <Input
            key={key}
            label={label}
            type={DATE_FIELDS.has(key) ? "date" : "text"}
            value={form[key] ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          />
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" className="ml-auto" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? "Deleting..." : "Delete Record"}
        </Button>
      </div>
    </Modal>
  );
}
