import { useState } from "react";
import { LifeBuoy, Plus, HelpCircle, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/support/KanbanBoard";
import { TicketTable } from "@/components/support/TicketTable";
import { TicketDetailModal } from "@/components/support/TicketDetailModal";
import { NewTicketModal } from "@/components/support/NewTicketModal";
import { HowItWorksModal } from "@/components/support/HowItWorksModal";
import { useTickets } from "@/hooks/useTickets";
import { 
  Ticket, 
  TicketStatus, 
  statusConfig, 
} from "@/types/support";

type ViewMode = "kanban" | "table";

export default function Support() {
  const { tickets, loading, createTicket, moveTicket, deleteTicket } = useTickets();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");

  // Status counts
  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status as TicketStatus] = tickets.filter(
      (t) => t.status === status
    ).length;
    return acc;
  }, {} as Record<TicketStatus, number>);

  // Filter tickets based on search
  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <LifeBuoy className="w-7 h-7 text-primary" />
            Soporte
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setHowItWorksOpen(true)}>
            <HelpCircle className="w-4 h-4 mr-2" />
            ¿Cómo funciona?
          </Button>
          <Button onClick={() => setNewTicketModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
            <span className="text-muted-foreground">
              {config.label}:
            </span>
            <span className="font-medium">
              {statusCounts[key as TicketStatus]}
            </span>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
        <Button variant="outline" size="sm" className="w-fit">
          👤 Mis Tickets
          <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
            {tickets.length}
          </span>
        </Button>

        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="visualizacion">Visualización</SelectItem>
              <SelectItem value="mejora">Mejora / Feature</SelectItem>
              <SelectItem value="bug">Bug / Métrica</SelectItem>
              <SelectItem value="nueva">Nueva Métrica</SelectItem>
              <SelectItem value="datos">Datos</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList className="grid w-20 grid-cols-2">
              <TabsTrigger value="kanban" className="px-2">
                <LayoutGrid className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="table" className="px-2">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <KanbanBoard 
          tickets={filteredTickets} 
          onTicketClick={(ticket) => { setSelectedTicket(ticket); setDetailModalOpen(true); }}
          onTicketMove={moveTicket}
        />
      ) : (
        <TicketTable tickets={filteredTickets} onTicketClick={(ticket) => { setSelectedTicket(ticket); setDetailModalOpen(true); }} />
      )}

      {/* Modals */}
      <TicketDetailModal
        ticket={selectedTicket}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onDeleteTicket={deleteTicket}
      />
      <NewTicketModal
        open={newTicketModalOpen}
        onOpenChange={setNewTicketModalOpen}
        onCreateTicket={createTicket}
      />
      <HowItWorksModal open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
    </div>
  );
}
