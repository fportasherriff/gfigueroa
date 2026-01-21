import { useState, useRef } from "react";
import { Upload, Files, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CsvFile } from "@/types/csv";

interface BulkUploadProps {
  csvFiles: CsvFile[];
  onBulkUpload: (files: FileList) => Promise<void>;
  isUploading: boolean;
  uploadProgress: { current: number; total: number; currentFile: string } | null;
}

export function BulkUpload({ 
  csvFiles, 
  onBulkUpload, 
  isUploading,
  uploadProgress 
}: BulkUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles) {
      await onBulkUpload(selectedFiles);
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const expectedFileTypes = csvFiles.map(f => f.name);

  return (
    <Card className="mt-6">
      <CardContent className="py-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Files className="w-5 h-5 text-primary" />
                Carga múltiple
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sube varios archivos CSV de una vez. Se procesarán en secuencia.
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {expectedFileTypes.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="bulk-file-input"
                disabled={isUploading}
              />
              <label htmlFor="bulk-file-input">
                <Button 
                  variant="outline" 
                  asChild 
                  disabled={isUploading}
                  className="cursor-pointer"
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar archivos
                  </span>
                </Button>
              </label>
              {selectedFiles && selectedFiles.length > 0 && (
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Subir {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Selected files preview */}
          {selectedFiles && selectedFiles.length > 0 && !isUploading && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Archivos seleccionados:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedFiles).map((file, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && uploadProgress && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Procesando: {uploadProgress.currentFile}
                </span>
                <span className="text-muted-foreground">
                  {uploadProgress.current} de {uploadProgress.total}
                </span>
              </div>
              <Progress 
                value={(uploadProgress.current / uploadProgress.total) * 100} 
                className="h-2" 
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
