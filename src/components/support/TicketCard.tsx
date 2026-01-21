import { Ticket, statusConfig, priorityConfig, categoryConfig } from "@/types/support";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const priority = priorityConfig[ticket.priority];
  const category = categoryConfig[ticket.category];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
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
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 bg-card"
      onClick={() => onClick(ticket)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1 pr-2">
            {ticket.title}
          </h4>
          <div className="flex items-center gap-1">
            {ticket.status === "bloqueado" && (
              <Lock className="w-3.5 h-3.5 text-destructive" />
            )}
            <Badge variant="secondary" className={cn("text-xs", priority.color)}>
              {priority.label}
            </Badge>
          </div>
        </div>

        <Badge variant="secondary" className={cn("text-xs mb-3", category.color)}>
          {category.label}
        </Badge>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {ticket.description}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(ticket.createdAt)}
          </div>
          {ticket.assignedTo && (
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(ticket.assignedTo)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
