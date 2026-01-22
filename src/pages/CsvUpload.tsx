import { useState, useCallback, useMemo } from "react";
import { Upload, Info, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CsvFile, UploadHistoryEntry } from "@/types/csv";
import { CsvUploadCard } from "@/components/csv/CsvUploadCard";
import { UploadHistory } from "@/components/csv/UploadHistory";
import { BulkUpload } from "@/components/csv/BulkUpload";

// Instrucciones de descarga para cada tipo de archivo
const downloadInstructions: Record<string, string> = {
  agenda_detallada: "En SIAP: Reportes → Agenda Detallada. Seleccioná el rango de fechas a analizar. Descargá sin modificar filtros.",
  cartera_pasiva: "En SIAP: Reportes → Cartera Pasiva. Seleccioná el rango de fechas a analizar. Descargá sin modificar filtros.",
  leads: "En SIAP: Reportes → Leads. Seleccioná el rango de fechas a analizar. Descargá sin modificar filtros.",
  listado_clientes: "En SIAP: Reportes → Listado Clientes. Importante: usá fecha desde 01/01/2020 o anterior para incluir todo el historial.",
  saldos: "En SIAP: Reportes → Saldos. Seleccioná el rango de fechas a analizar. Descargá sin modificar filtros.",
};

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
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false);

  // Calcular cuáles archivos están cargados exitosamente
  const uploadStatus = useMemo(() => {
    const loaded = csvFiles.filter((f) => f.status === "success");
    const missing = csvFiles.filter((f) => f.status !== "success");
    return {
      loadedCount: loaded.length,
      totalCount: csvFiles.length,
      allLoaded: loaded.length === csvFiles.length,
      missingFiles: missing,
      loadedFiles: loaded,
    };
  }, [csvFiles]);

  const addToHistory = useCallback((entry: Omit<UploadHistoryEntry, "id" | "timestamp">) => {
    const newEntry: UploadHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setUploadHistory((prev) => [newEntry, ...prev]);
  }, []);

  const handleFileUpload = useCallback(
    async (fileId: string, file: File): Promise<boolean> => {
      if (!file.name.endsWith(".csv")) {
        toast.error("Solo se permiten archivos CSV");
        return false;
      }

      const csvFile = csvFiles.find((f) => f.id === fileId);
      if (!csvFile) {
        toast.error("Tipo de archivo no reconocido");
        return false;
      }

      setCsvFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f)));

      // Simulate initial progress
      for (let i = 0; i <= 30; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setCsvFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: i } : f)));
      }

      try {
        setCsvFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 50 } : f)));

        // Crear FormData con el tipo esperado para validación estricta
        const formData = new FormData();
        formData.append("file", file);
        formData.append("expectedType", fileId); // Enviar el tipo esperado para validación

        // Llamar a la Edge Function con FormData
        const response = await fetch(`https://ehpmvahaixellqfwwyam.supabase.co/functions/v1/process-csv-upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocG12YWhhaXhlbGxxZnd3eWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjUzNDAsImV4cCI6MjA4NDE0MTM0MH0.VAfGXWOqrq-PpbA9zwvky3wi8td22luGPGl-VwEM_e4`,
          },
          body: formData,
        });

        setCsvFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 90 } : f)));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.errors?.[0] || "Error al procesar el archivo");
        }

        const data = await response.json();

        setCsvFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "success",
                  progress: 100,
                  lastUpdated: new Date().toLocaleString("es-ES"),
                }
              : f,
          ),
        );

        // Add to history
        addToHistory({
          fileType: csvFile.name,
          fileName: file.name,
          status: "success",
          message: data?.message || `Datos actualizados correctamente`,
          recordsProcessed: data?.stats,
        });

        toast.success(`${file.name} procesado exitosamente`, {
          description: data?.message || `Se actualizaron los datos de ${csvFile.name}`,
        });

        return true;
      } catch (error) {
        console.error("Error uploading CSV:", error);

        setCsvFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error", progress: 0 } : f)));

        // Add to history
        addToHistory({
          fileType: csvFile.name,
          fileName: file.name,
          status: "error",
          message: error instanceof Error ? error.message : "Error desconocido",
        });

        toast.error(`Error al procesar ${file.name}`, {
          description: error instanceof Error ? error.message : "Error desconocido",
        });

        return false;
      }
    },
    [csvFiles, addToHistory],
  );

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
        const normalizedFileName = file.name.toLowerCase().replace(/[_\-\s]/g, "");
        const normalizedTypeName = csvFile.name.toLowerCase().replace(/[_\-\s]/g, "");
        return (
          normalizedFileName.includes(normalizedTypeName) ||
          normalizedTypeName.includes(normalizedFileName.replace(".csv", ""))
        );
      });

      if (matchedType) {
        await handleFileUpload(matchedType.id, file);
      } else {
        // Try the first available idle type
        const firstIdle = csvFiles.find((f) => f.status === "idle");
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

  const handleRefreshDashboard = async () => {
    if (!uploadStatus.allLoaded) {
      toast.error("Faltan archivos por cargar", {
        description: `Archivos pendientes: ${uploadStatus.missingFiles.map((f) => f.name).join(", ")}`,
      });
      return;
    }

    setIsRefreshingDashboard(true);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-dashboard");

      if (error) throw error;

      // Resetear el estado de todos los archivos para un nuevo ciclo de carga
      setCsvFiles(initialCsvFiles);

      // Agregar entrada al historial para el refresh del dashboard
      const dashboardHistoryEntry: UploadHistoryEntry = {
        id: Date.now().toString(),
        fileName: "Actualización Dashboard",
        fileType: "dashboard_refresh",
        status: data?.success ? "success" : "error",
        timestamp: new Date(),
        message: data?.message || "Dashboard actualizado",
        recordsProcessed: data?.results?.filter((r: any) => r.success).length || 0,
      };
      setUploadHistory((prev) => [dashboardHistoryEntry, ...prev]);

      if (data?.success) {
        toast.success("Dashboard actualizado - Nuevo ciclo iniciado", {
          description: "Los archivos fueron procesados. Podés comenzar un nuevo ciclo de carga.",
        });
      } else {
        const failedViews = data?.results?.filter((r: any) => !r.success) || [];
        if (failedViews.length > 0) {
          toast.warning(`Dashboard actualizado con advertencias`, {
            description: `Algunas vistas no se actualizaron: ${failedViews.map((v: any) => v.view).join(", ")}`,
          });
        } else {
          toast.success("Dashboard actualizado - Nuevo ciclo iniciado");
        }
      }
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsRefreshingDashboard(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
          <Upload className="w-7 h-7 text-primary" />
          Carga de CSV
        </h1>
        <p className="text-muted-foreground mt-1">Sube los archivos CSV para actualizar los datos del tablero</p>
      </div>

      {/* Info Banner - Cómo funciona (PRIMERO) */}
      <Card className="mb-6 border-info/30 bg-info/5">
        <CardContent className="py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">¿Cómo funciona?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Descargá los archivos CSV desde SIAP y súbilos aquí. Cada tarjeta tiene un ícono <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-xs font-medium">i</span> que te indica cómo descargar ese reporte específico. Una vez cargados los 5 archivos, podrás actualizar el dashboard con los nuevos datos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Card + Refresh Button (SEGUNDO) */}
      <Card
        className={`mb-6 ${uploadStatus.allLoaded ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5"}`}
      >
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              {uploadStatus.allLoaded ? (
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  Estado de carga: {uploadStatus.loadedCount}/{uploadStatus.totalCount} archivos
                </p>
                {!uploadStatus.allLoaded && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Faltan:</span>{" "}
                    {uploadStatus.missingFiles.map((f) => f.name).join(", ")}
                  </p>
                )}
                {uploadStatus.allLoaded && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Todos los archivos fueron cargados. Podés actualizar el dashboard.
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleRefreshDashboard}
              disabled={!uploadStatus.allLoaded || isRefreshingDashboard}
              className="gap-2 shrink-0"
              variant={uploadStatus.allLoaded ? "default" : "secondary"}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingDashboard ? "animate-spin" : ""}`} />
              {isRefreshingDashboard ? "Actualizando..." : "Actualizar Dashboard"}
            </Button>
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
            downloadInstruction={downloadInstructions[csvFile.id]}
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
        <UploadHistory history={uploadHistory} onClearHistory={handleClearHistory} />
      </div>
    </div>
  );
}
