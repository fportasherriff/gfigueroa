import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, TicketStatus } from "@/types/support";
import { toast } from "sonner";

interface DbTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  reported_by: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbToTicket(row: DbTicket): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Ticket["status"],
    priority: row.priority as Ticket["priority"],
    category: row.category as Ticket["category"],
    assignedTo: row.assigned_to,
    reportedBy: row.reported_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comments: [],
  };
}

export function useTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Error al cargar tickets");
      return;
    }
    setTickets((data as DbTicket[]).map(mapDbToTicket));
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("support_tickets_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets]);

  const createTicket = useCallback(
    async (ticketData: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "comments">) => {
      if (!user) {
        toast.error("Debes iniciar sesión para crear un ticket");
        return;
      }

      const { error } = await supabase.from("support_tickets").insert({
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status,
        priority: ticketData.priority,
        category: ticketData.category,
        assigned_to: ticketData.assignedTo,
        reported_by: ticketData.reportedBy,
        user_id: user.id,
      });

      if (error) {
        console.error("Error creating ticket:", error);
        toast.error("Error al crear el ticket");
        return;
      }
      toast.success("Ticket creado correctamente");
    },
    [user]
  );

  const moveTicket = useCallback(
    async (ticketId: string, newStatus: TicketStatus) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
        )
      );

      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) {
        console.error("Error moving ticket:", error);
        toast.error("Error al mover el ticket");
        fetchTickets();
      }
    },
    [fetchTickets]
  );

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      // Delete comments first
      await supabase.from("ticket_comments").delete().eq("ticket_id", ticketId);

      const { error } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", ticketId);

      if (error) {
        console.error("Error deleting ticket:", error);
        toast.error("Error al eliminar el ticket");
        return;
      }
      toast.success("Ticket eliminado correctamente");
    },
    []
  );

  return { tickets, loading, createTicket, moveTicket, deleteTicket };
}
