import { 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  FileSpreadsheet,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UploadHistoryEntry } from "@/types/csv";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface UploadHistoryProps {
  history: UploadHistoryEntry[];
  onClearHistory: () => void;
}

export function UploadHistory({ history, onClearHistory }: UploadHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historial de cargas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay cargas registradas aún</p>
            <p className="text-xs mt-1">El historial aparecerá aquí después de subir archivos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Historial de cargas
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearHistory}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Limpiar
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="mt-0.5">
                  {entry.status === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {entry.fileName}
                    </span>
                    <Badge 
                      variant={entry.status === "success" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {entry.status === "success" ? "Éxito" : "Error"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tipo: {entry.fileType}
                  </p>
                  {entry.message && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.message}
                    </p>
                  )}
                  {entry.recordsProcessed !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Registros procesados: {entry.recordsProcessed}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(entry.timestamp, { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
