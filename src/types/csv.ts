export interface CsvFile {
  id: string;
  name: string;
  description: string;
  lastUpdated: string | null;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
}

export interface UploadHistoryEntry {
  id: string;
  fileType: string;
  fileName: string;
  timestamp: Date;
  status: "success" | "error";
  message?: string;
  recordsProcessed?: number;
}
