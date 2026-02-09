import { Ticket, statusConfig, priorityConfig, categoryConfig } from "@/types/support";
import { useProfiles } from "@/hooks/useProfiles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, MessageSquare, Clock, Play, AtSign, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TicketDetailModalProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteTicket?: (ticketId: string) => Promise<void>;
}

export function TicketDetailModal({
  ticket,
  open,
  onOpenChange,
  onDeleteTicket,
}: TicketDetailModalProps) {
  const { profiles } = useProfiles();
  const [newComment, setNewComment] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!ticket || !onDeleteTicket) return;
    if (!window.confirm("¿Estás seguro de que querés eliminar este ticket?")) return;
    setDeleting(true);
    await onDeleteTicket(ticket.id);
    setDeleting(false);
    onOpenChange(false);
  };

  if (!ticket) return null;

  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];
  const category = categoryConfig[ticket.category];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2">
            <div className={cn("w-2.5 h-2.5 rounded-full", status.bgColor)} />
            <DialogTitle className="text-lg">Detalle del Ticket</DialogTitle>
            <span className="text-xs text-muted-foreground ml-auto">
              #{ticket.id.slice(0, 8)}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Título</label>
            <p className="mt-1 text-foreground">{ticket.title}</p>
          </div>

          {/* Reported By */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Reportado por</label>
            <p className="mt-1 text-sm text-foreground">{ticket.reportedBy}</p>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <Select defaultValue={ticket.status}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", value.bgColor)} />
                        {value.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Prioridad</label>
              <Select defaultValue={ticket.priority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category & Assigned Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <Select defaultValue={ticket.category}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Asignado a</label>
              <Select defaultValue={ticket.assignedTo || undefined}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.full_name || profile.user_id}>
                      {profile.full_name || "Sin nombre"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Descripción</label>
            <p className="mt-1 text-foreground bg-muted/30 p-3 rounded-lg text-sm">{ticket.description}</p>
          </div>

          {/* Screenshots */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Capturas de Pantalla</label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Arrastra o haz clic para subir capturas de pantalla</p>
              <p className="text-xs text-muted-foreground mt-1">0/5 imágenes</p>
            </div>
          </div>

          <Separator />

          {/* Time Tracking */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Time Tracking</p>
                <p className="text-xs text-muted-foreground">Sin timer activo</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Play className="w-4 h-4 mr-1" />
              Iniciar
            </Button>
          </div>

          <Separator />

          {/* Historial de Estados */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h4 className="font-medium">Historial de Estados</h4>
            </div>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
              {/* Current status */}
              <div className="relative flex items-start gap-3">
                <div className={cn("absolute left-[-18px] top-1 w-3 h-3 rounded-full border-2 border-background", status.bgColor)} />
                <div>
                  <p className="text-sm font-medium">{status.label}</p>
                  <p className="text-xs text-muted-foreground">Estado actual · {formatDate(ticket.updatedAt)}</p>
                </div>
              </div>
              {/* Creation event */}
              <div className="relative flex items-start gap-3">
                <div className="absolute left-[-18px] top-1 w-3 h-3 rounded-full border-2 border-background bg-kanban-open" />
                <div>
                  <p className="text-sm font-medium">Abierto</p>
                  <p className="text-xs text-muted-foreground">Creado por {ticket.reportedBy} · {formatDate(ticket.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Administrativas */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              🚫 Bloquear
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
              ❌ Rechazar
            </Button>
          </div>

          <Separator />

          {/* Comments Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-medium">Hilo de Comentarios</h4>
                <span className="text-sm text-muted-foreground">({ticket.comments.length})</span>
              </div>
              <Button variant="ghost" size="sm">
                <AtSign className="w-4 h-4 mr-1" />
                Mencionar Reporter
              </Button>
            </div>

            {/* Comment Input */}
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">FP</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Escribe un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm">Comentar</Button>
                </div>
              </div>
            </div>

            {/* Existing Comments */}
            {ticket.comments.length > 0 && (
              <div className="mt-4 space-y-4">
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        {getInitials(comment.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="border-t bg-background px-6 py-4 flex gap-3">
          <Button className="flex-1" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
          {onDeleteTicket && (
            <Button
              variant="destructive"
              size="lg"
              className="px-4"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
