import { useState, useCallback } from "react";
import { Upload, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CsvFile, UploadHistoryEntry } from "@/types/csv";
import { CsvUploadCard } from "@/components/csv/CsvUploadCard";
import { UploadHistory } from "@/components/csv/UploadHistory";
import { BulkUpload } from "@/components/csv/BulkUpload";

const initialCsvFiles: CsvFile[] = [
  {
    id: "agenda_detallada",
    name: "Agenda detallada",
    description: "Detalle de citas y agenda de consultas programadas",
    lastUpdated: null,
    status: "idle",
    progress: 0,
  },
  {
    id: "cartera_pasiva",
    name: "Cartera Pasiva",
    description: "Clientes inactivos y cuentas por cobrar pendientes",
    lastUpdated: null,
    status: "idle",
    progress: 0,
  },
  {
    id: "leads",
    name: "Leads",
    description: "Prospectos y oportunidades de negocio",
    lastUpdated: null,
    status: "idle",
    progress: 0,
  },
  {
    id: "listado_clientes",
    name: "Listado Clientes",
    description: "Base de datos de clientes activos y su información",
    lastUpdated: null,
    status: "idle",
    progress: 0,
  },
  {
    id: "saldos",
    name: "Saldos",
    description: "Estado de cuenta y saldos de clientes",
    lastUpdated: null,
    status: "idle",
    progress: 0,
  },
];

export default function CsvUpload() {
  const [csvFiles, setCsvFiles] = useState<CsvFile[]>(initialCsvFiles);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);

  const addToHistory = useCallback((entry: Omit<UploadHistoryEntry, "id" | "timestamp">) => {
    const newEntry: UploadHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setUploadHistory((prev) => [newEntry, ...prev]);
  }, []);

  const handleFileUpload = useCallback(async (fileId: string, file: File): Promise<boolean> => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Solo se permiten archivos CSV");
      return false;
    }

    const csvFile = csvFiles.find(f => f.id === fileId);
    if (!csvFile) {
      toast.error("Tipo de archivo no reconocido");
      return false;
    }

    setCsvFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f
      )
    );

    // Simulate initial progress
    for (let i = 0; i <= 30; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setCsvFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: i } : f
        )
      );
    }

    try {
      // Read CSV file content
      const csvContent = await file.text();
      
      setCsvFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: 50 } : f
        )
      );

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('process-csv-upload', {
        body: {
          fileType: fileId,
          fileName: file.name,
          csvData: csvContent,
        },
      });

      setCsvFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: 90 } : f
        )
      );

      if (error) {
        throw new Error(error.message || 'Error al procesar el archivo');
      }

      setCsvFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "success",
                progress: 100,
                lastUpdated: new Date().toLocaleString("es-ES"),
              }
            : f
        )
      );

      // Add to history
      addToHistory({
        fileType: csvFile.name,
        fileName: file.name,
        status: "success",
        message: data?.message || `Datos actualizados correctamente`,
        recordsProcessed: data?.recordsProcessed,
      });

      toast.success(`${file.name} procesado exitosamente`, {
        description: data?.message || `Se actualizaron los datos de ${csvFile.name}`,
      });

      return true;
    } catch (error) {
      console.error('Error uploading CSV:', error);
      
      setCsvFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "error", progress: 0 }
            : f
        )
      );

      // Add to history
      addToHistory({
        fileType: csvFile.name,
        fileName: file.name,
        status: "error",
        message: error instanceof Error ? error.message : 'Error desconocido',
      });

      toast.error(`Error al procesar ${file.name}`, {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });

      return false;
    }
  }, [csvFiles, addToHistory]);

  const handleDrop = (fileId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(fileId, file);
    }
  };

  const handleFileSelect = (fileId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(fileId, file);
    }
  };

  const handleBulkUpload = async (files: FileList) => {
    setIsBulkUploading(true);
    const fileArray = Array.from(files);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setBulkProgress({
        current: i + 1,
        total: fileArray.length,
        currentFile: file.name,
      });

      // Try to match file name to a csv type
      const matchedType = csvFiles.find((csvFile) => {
        const normalizedFileName = file.name.toLowerCase().replace(/[_\-\s]/g, '');
        const normalizedTypeName = csvFile.name.toLowerCase().replace(/[_\-\s]/g, '');
        return normalizedFileName.includes(normalizedTypeName) || 
               normalizedTypeName.includes(normalizedFileName.replace('.csv', ''));
      });

      if (matchedType) {
        await handleFileUpload(matchedType.id, file);
      } else {
        // Try the first available idle type
        const firstIdle = csvFiles.find(f => f.status === "idle");
        if (firstIdle) {
          toast.warning(`"${file.name}" no coincide con ningún tipo conocido`, {
            description: `Se asignó automáticamente a "${firstIdle.name}"`,
          });
          await handleFileUpload(firstIdle.id, file);
        } else {
          toast.error(`No se pudo asignar "${file.name}" a ningún tipo`);
          addToHistory({
            fileType: "Desconocido",
            fileName: file.name,
            status: "error",
            message: "No se encontró un tipo de archivo disponible",
          });
        }
      }
    }

    setIsBulkUploading(false);
    setBulkProgress(null);
    toast.success("Carga múltiple completada", {
      description: `Se procesaron ${fileArray.length} archivos`,
    });
  };

  const handleClearHistory = () => {
    setUploadHistory([]);
    toast.info("Historial limpiado");
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
          <Upload className="w-7 h-7 text-primary" />
          Carga de CSV
        </h1>
        <p className="text-muted-foreground mt-1">
          Sube los archivos CSV para actualizar los datos del tablero
        </p>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-info/30 bg-info/5">
        <CardContent className="py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">¿Cómo funciona?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Descarga los archivos CSV desde tu sistema de gestión y súbelos aquí. 
              Cada archivo actualizará automáticamente las tablas correspondientes en la base de datos 
              y refrescará las vistas materializadas del tablero.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CSV Upload Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {csvFiles.map((csvFile) => (
          <CsvUploadCard
            key={csvFile.id}
            csvFile={csvFile}
            dragOver={dragOver === csvFile.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(csvFile.id);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(csvFile.id, e)}
            onFileSelect={(e) => handleFileSelect(csvFile.id, e)}
          />
        ))}
      </div>

      {/* Bulk Upload */}
      <BulkUpload
        csvFiles={csvFiles}
        onBulkUpload={handleBulkUpload}
        isUploading={isBulkUploading}
        uploadProgress={bulkProgress}
      />

      {/* Upload History - Below cards */}
      <div className="mt-6">
        <UploadHistory 
          history={uploadHistory} 
          onClearHistory={handleClearHistory} 
        />
      </div>
    </div>
  );
}
