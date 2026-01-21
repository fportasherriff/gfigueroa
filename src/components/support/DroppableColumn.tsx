import { useDroppable } from "@dnd-kit/core";
import { TicketStatus } from "@/types/support";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DroppableColumnProps {
  status: TicketStatus;
  config: { label: string; color: string; bgColor: string };
  ticketCount: number;
  children: ReactNode;
}

export function DroppableColumn({
  status,
  config,
  ticketCount,
  children,
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 bg-muted/30 rounded-xl transition-all duration-200",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-t-xl",
          config.bgColor
        )}
      >
        <h3 className="font-semibold text-sm text-white">{config.label}</h3>
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-medium">
          {ticketCount}
        </span>
      </div>

      {/* Cards Container */}
      <div className="p-3 space-y-3 min-h-[100px]">{children}</div>
    </div>
  );
}
