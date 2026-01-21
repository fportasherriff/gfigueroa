import { useDraggable } from "@dnd-kit/core";
import { Ticket } from "@/types/support";
import { TicketCard } from "./TicketCard";
import { cn } from "@/lib/utils";

interface DraggableCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
}

export function DraggableCard({ ticket, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: ticket.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-50"
      )}
    >
      <TicketCard ticket={ticket} onClick={onClick} />
    </div>
  );
}
