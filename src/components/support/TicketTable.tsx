import { Ticket, statusConfig, priorityConfig, categoryConfig } from "@/types/support";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TicketTableProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

export function TicketTable({ tickets, onTicketClick }: TicketTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
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
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Título</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Asignado</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const priority = priorityConfig[ticket.priority];
            const category = categoryConfig[ticket.category];

            return (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onTicketClick(ticket)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground line-clamp-1">
                      {ticket.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {ticket.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn("w-2 h-2 rounded-full", status.bgColor)}
                    />
                    <span className={cn("text-sm", status.color)}>
                      {status.label}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", priority.color)}
                  >
                    {priority.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", category.color)}
                  >
                    {category.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(ticket.assignedTo)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{ticket.assignedTo}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(ticket.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
