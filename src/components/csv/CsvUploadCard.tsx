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
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CsvFile } from "@/types/csv";

interface CsvUploadCardProps {
  csvFile: CsvFile;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadInstruction?: string;
}

export function CsvUploadCard({
  csvFile,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  downloadInstruction,
}: CsvUploadCardProps) {
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
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-lg h-full flex flex-col",
        dragOver && "ring-2 ring-primary border-primary"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-base leading-tight">{csvFile.name}</CardTitle>
                {downloadInstruction && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button"
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground text-xs font-medium transition-colors cursor-help"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        <p>{downloadInstruction}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {csvFile.lastUpdated && (
                <CardDescription className="text-xs">
                  Última actualización: {csvFile.lastUpdated}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusIcon(csvFile.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
          {csvFile.description}
        </p>

        <div className="mt-auto">
          {csvFile.status === "uploading" ? (
            <div className="space-y-2">
              <Progress value={csvFile.progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Procesando... {csvFile.progress}%
              </p>
            </div>
          ) : (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer hover:border-primary hover:bg-primary/5",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted"
              )}
            >
              <input
                type="file"
                accept=".csv"
                onChange={onFileSelect}
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
        </div>
      </CardContent>
    </Card>
  );
}
