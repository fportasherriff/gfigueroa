import { Ticket, TicketStatus, statusConfig } from "@/types/support";
import { TicketCard } from "./TicketCard";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
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

export function KanbanBoard({ tickets, onTicketClick }: KanbanBoardProps) {
  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter((t) => t.status === status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {kanbanColumns.map((status) => {
        const statusTickets = getTicketsByStatus(status);
        const config = statusConfig[status];

        return (
          <div
            key={status}
            className="flex-shrink-0 w-72 bg-muted/30 rounded-xl"
          >
            {/* Column Header */}
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-t-xl",
                config.bgColor
              )}
            >
              <h3 className="font-semibold text-sm text-white">
                {config.label}
              </h3>
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
                {statusTickets.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="p-3 space-y-3">
              {statusTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Sin tickets
                </div>
              ) : (
                statusTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={onTicketClick}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
