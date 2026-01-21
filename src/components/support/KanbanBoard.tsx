import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { Ticket, TicketStatus, statusConfig } from "@/types/support";
import { TicketCard } from "./TicketCard";
import { DroppableColumn } from "./DroppableColumn";
import { DraggableCard } from "./DraggableCard";

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onTicketMove?: (ticketId: string, newStatus: TicketStatus) => void;
}

const kanbanColumns: TicketStatus[] = [
  "abierto",
  "en_progreso",
  "en_revision",
  "resuelto",
  "bloqueado",
  "rechazado",
  "cerrado",
];

export function KanbanBoard({ tickets, onTicketClick, onTicketMove }: KanbanBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter((t) => t.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as TicketStatus;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket && ticket.status !== newStatus && onTicketMove) {
      onTicketMove(ticketId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {kanbanColumns.map((status) => {
          const statusTickets = getTicketsByStatus(status);
          const config = statusConfig[status];

          return (
            <DroppableColumn
              key={status}
              status={status}
              config={config}
              ticketCount={statusTickets.length}
            >
              {statusTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Sin tickets
                </div>
              ) : (
                statusTickets.map((ticket) => (
                  <DraggableCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={onTicketClick}
                  />
                ))
              )}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="opacity-90 rotate-3 scale-105">
            <TicketCard ticket={activeTicket} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
