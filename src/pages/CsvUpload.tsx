import { useState } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CsvFile {
  id: string;
  name: string;
  description: string;
  lastUpdated: string | null;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
}

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

  const handleFileUpload = async (fileId: string, file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Solo se permiten archivos CSV");
      return;
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

      toast.success(`${file.name} procesado exitosamente`, {
        description: data?.message || `Se actualizaron los datos de ${fileId}`,
      });
    } catch (error) {
      console.error('Error uploading CSV:', error);
      
      setCsvFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "error", progress: 0 }
            : f
        )
      );

      toast.error(`Error al procesar ${file.name}`, {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

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

  const getStatusIcon = (status: CsvFile["status"]) => {
    switch (status) {
      case "uploading":
        return <RefreshCw className="w-5 h-5 text-primary animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {csvFiles.map((csvFile) => (
          <Card
            key={csvFile.id}
            className={cn(
              "transition-all duration-200 hover:shadow-lg",
              dragOver === csvFile.id && "ring-2 ring-primary border-primary"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{csvFile.name}</CardTitle>
                    {csvFile.lastUpdated && (
                      <CardDescription className="text-xs">
                        Última actualización: {csvFile.lastUpdated}
                      </CardDescription>
                    )}
                  </div>
                </div>
                {getStatusIcon(csvFile.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {csvFile.description}
              </p>

              {csvFile.status === "uploading" ? (
                <div className="space-y-2">
                  <Progress value={csvFile.progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Procesando... {csvFile.progress}%
                  </p>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(csvFile.id);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(csvFile.id, e)}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer hover:border-primary hover:bg-primary/5",
                    dragOver === csvFile.id
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  )}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileSelect(csvFile.id, e)}
                    className="hidden"
                    id={`file-${csvFile.id}`}
                  />
                  <label
                    htmlFor={`file-${csvFile.id}`}
                    className="cursor-pointer"
                  >
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Arrastra o{" "}
                      <span className="text-primary font-medium">
                        selecciona archivo
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo archivos .csv
                    </p>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Upload Option */}
      <Card className="mt-6">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Carga múltiple</h3>
              <p className="text-sm text-muted-foreground">
                ¿Tienes todos los archivos listos? Súbelos todos de una vez.
              </p>
            </div>
            <Button variant="outline" size="lg">
              <Upload className="w-4 h-4 mr-2" />
              Cargar todos los CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
