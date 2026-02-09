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
import { Clock, Send, AtSign, Trash2, Save, Lock, Ban, User, Calendar, Plus } from "lucide-react";
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
      day: "2-digit",
      month: "short",
      year: "numeric",
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
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-2.5 h-2.5 rounded-full", status.bgColor)} />
            <DialogTitle className="text-lg">{ticket.title}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-5">
          {/* Status & Priority & Category Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
              <Select defaultValue={ticket.status}>
                <SelectTrigger className="h-9">
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Prioridad</label>
              <Select defaultValue={ticket.priority}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoría</label>
              <Select defaultValue={ticket.category}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descripción</label>
            <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">{ticket.description}</p>
          </div>

          {/* Comment input */}
          <div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Escribí un comentario... (Ctrl+Enter para enviar)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] flex-1"
              />
              <div className="flex flex-col gap-1 pt-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <AtSign className="w-4 h-4" />
                </Button>
                <Button size="icon" className="h-9 w-9 rounded-lg">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Comments */}
          {ticket.comments.length > 0 && (
            <div className="space-y-3">
              {ticket.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                      {getInitials(comment.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Historial de Estados */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Historial de Estados</h4>
              <span className="text-xs text-muted-foreground">(1 evento)</span>
            </div>
            <div className="flex items-start gap-3 ml-1">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Plus className="w-3 h-3 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Ticket Creado</p>
                <p className="text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-24">Reportado por:</span>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getInitials(ticket.reportedBy)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{ticket.reportedBy}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-24">Asignado a:</span>
              <Select defaultValue={ticket.assignedTo || undefined}>
                <SelectTrigger className="h-8 w-auto min-w-[160px] border-none shadow-none px-2">
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
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-24">Creado:</span>
              <span className="text-sm font-medium">{formatDate(ticket.createdAt)}</span>
            </div>
          </div>

          <Separator />

          {/* Acciones Administrativas */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Acciones Administrativas</h4>
            <div className="flex gap-3">
              <Button variant="outline" className="text-orange-500 border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                <Lock className="w-4 h-4 mr-2" />
                Bloquear
              </Button>
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive">
                <Ban className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          </div>

          {/* Spacer for bottom bar */}
          <div className="h-4" />
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
