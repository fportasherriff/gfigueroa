export type TicketStatus = 
  | "abierto" 
  | "en_progreso" 
  | "en_revision" 
  | "resuelto" 
  | "bloqueado" 
  | "rechazado" 
  | "cerrado";

export type TicketPriority = "baja" | "media" | "alta";

export type TicketCategory = 
  | "Visualización" 
  | "Mejora / Feature" 
  | "Bug / Métrica" 
  | "Nueva Métrica" 
  | "Datos";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo: string | null;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
}

export interface TicketComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  abierto: {
    label: "Abierto",
    color: "text-info",
    bgColor: "bg-kanban-open",
  },
  en_progreso: {
    label: "En Progreso",
    color: "text-warning",
    bgColor: "bg-kanban-progress",
  },
  en_revision: {
    label: "En Revisión",
    color: "text-purple-500",
    bgColor: "bg-kanban-review",
  },
  resuelto: {
    label: "Resuelto",
    color: "text-success",
    bgColor: "bg-kanban-resolved",
  },
  bloqueado: {
    label: "Bloqueado",
    color: "text-destructive",
    bgColor: "bg-kanban-blocked",
  },
  rechazado: {
    label: "Rechazado",
    color: "text-red-600",
    bgColor: "bg-kanban-rejected",
  },
  cerrado: {
    label: "Cerrado",
    color: "text-muted-foreground",
    bgColor: "bg-kanban-closed",
  },
};

export const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-green-100 text-green-700" },
  media: { label: "Media", color: "bg-orange-100 text-orange-700" },
  alta: { label: "Alta", color: "bg-red-100 text-red-700" },
};

export const categoryConfig: Record<TicketCategory, { label: string; color: string }> = {
  "Visualización": { label: "Visualización", color: "bg-blue-100 text-blue-700" },
  "Mejora / Feature": { label: "Mejora / Feature", color: "bg-purple-100 text-purple-700" },
  "Bug / Métrica": { label: "Bug / Métrica", color: "bg-red-100 text-red-700" },
  "Nueva Métrica": { label: "Nueva Métrica", color: "bg-emerald-100 text-emerald-700" },
  "Datos": { label: "Datos", color: "bg-amber-100 text-amber-700" },
};

// Empty initial tickets - ready for user creation
export const mockTickets: Ticket[] = [];
