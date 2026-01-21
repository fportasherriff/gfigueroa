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
  | "Datos" 
  | "Mejora / Feature" 
  | "Bug / Error" 
  | "Consulta" 
  | "Otro";

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
  "Datos": { label: "Datos", color: "bg-blue-100 text-blue-700" },
  "Mejora / Feature": { label: "Mejora / Feature", color: "bg-purple-100 text-purple-700" },
  "Bug / Error": { label: "Bug / Error", color: "bg-red-100 text-red-700" },
  "Consulta": { label: "Consulta", color: "bg-cyan-100 text-cyan-700" },
  "Otro": { label: "Otro", color: "bg-gray-100 text-gray-700" },
};

// Mock data
export const mockTickets: Ticket[] = [
  {
    id: "1",
    title: "Agregar nombre a vendedores en agenda",
    description: "En el desplegable para seleccionar nombre en agenda falta el vendedor Manuel Márquez Cena.",
    status: "abierto",
    priority: "baja",
    category: "Datos",
    assignedTo: "Francisco Porta",
    reportedBy: "Admin",
    createdAt: "2024-01-12T10:00:00Z",
    updatedAt: "2024-01-12T10:00:00Z",
    comments: [],
  },
  {
    id: "2",
    title: "PRODUCCION",
    description: "Cuando cargamos hoy el número no se actualizó correctamente.",
    status: "abierto",
    priority: "alta",
    category: "Mejora / Feature",
    assignedTo: null,
    reportedBy: "Admin",
    createdAt: "2024-01-15T14:30:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    comments: [],
  },
  {
    id: "3",
    title: "Ver pipeline por vendedor",
    description: "Cuando pones el detalle del pipeline o ahí cuando entras al dashboard ve un ranking.",
    status: "en_revision",
    priority: "media",
    category: "Mejora / Feature",
    assignedTo: "JM",
    reportedBy: "Admin",
    createdAt: "2024-01-19T09:00:00Z",
    updatedAt: "2024-01-19T09:00:00Z",
    comments: [],
  },
  {
    id: "4",
    title: "Detalle facturado en el mes",
    description: "Necesitamos poder ver el detalle de lo facturado por cada vendedor en el mes.",
    status: "en_revision",
    priority: "media",
    category: "Mejora / Feature",
    assignedTo: null,
    reportedBy: "Admin",
    createdAt: "2024-01-18T11:00:00Z",
    updatedAt: "2024-01-18T11:00:00Z",
    comments: [],
  },
  {
    id: "5",
    title: "Error en fecha de vencimiento",
    description: "Se carga una fecha balance pero en la pantalla muestra otra fecha.",
    status: "resuelto",
    priority: "media",
    category: "Bug / Error",
    assignedTo: "FP",
    reportedBy: "Admin",
    createdAt: "2024-01-20T16:00:00Z",
    updatedAt: "2024-01-21T10:00:00Z",
    comments: [],
  },
];
