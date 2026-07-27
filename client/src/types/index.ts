export interface ComplianceRecord {
  id: string;
  storeNumber: number;
  city: string;
  streetName: string;
  facilityId: number | null;
  channelOfTrade: string | null;
  deliveryCertificateExpiredDate: string | null;
  insuranceExpiredDate: string | null;
  corrosionTestDate: string | null;
  corrosionTestStatus: string | null;
  spillBucketsTestDate: string | null;
  spillBucketTestStatus: string | null;
  overfillProtectionDeviceTestDate: string | null;
  overfillProtectionDeviceTestStatus: string | null;
  lldLineTightnessTestDate: string | null;
  lldLineTightnessTestStatus: string | null;
  atgProbesTestDate: string | null;
  atgProbesTestStatus: string | null;
  sumpTestDate: string | null;
  sumpTestStatus: string | null;
  stage1TestDate: string | null;
  stage1TestStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  fileType: string;
  rowsImported: number;
  importedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChatResponse {
  intent: string;
  answer: string;
  sql: string;
  rows: Record<string, unknown>[];
  chart: { type: string; labels: string[]; values: number[] } | null;
  mode: string;
}

export interface UploadResult {
  rowsImported: number;
  rowsSkipped: number;
  fileId: string;
}
