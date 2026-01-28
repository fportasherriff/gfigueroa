import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  FinanzasDiario,
  FinanzasRecuperoMaster,
  FinanzasDeudaAging,
  FinanzasPrioridad,
  FinanzasPorProfesional,
  FinanzasPorProcedimiento,
} from '@/types/dashboard';

// Helper function to query dashboard views using execute_select RPC
const queryDashboardView = async <T>(sql: string): Promise<T[]> => {
  const { data, error } = await supabase.rpc('execute_select', { query: sql });
  
  if (error) throw error;
  
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error((data as any).error);
  }
  
  return (data || []) as T[];
};

// Finanzas Diario Hook with date filters
export const useFinanzasDiarioV2 = (filters?: { 
  fechaDesde?: string; 
  fechaHasta?: string; 
  sucursal?: string;
}) => {
  return useQuery({
    queryKey: ['finanzas-diario-v2', filters],
    queryFn: async () => {
      let sql = `SELECT * FROM dashboard.finanzas_diario WHERE 1=1`;
      
      if (filters?.fechaDesde) {
        sql += ` AND fecha >= '${filters.fechaDesde}'`;
      }
      if (filters?.fechaHasta) {
        sql += ` AND fecha <= '${filters.fechaHasta}'`;
      }
      if (filters?.sucursal && filters.sucursal !== 'all') {
        sql += ` AND sucursal = '${filters.sucursal}'`;
      }
      
      sql += ` ORDER BY fecha ASC`;
      
      return queryDashboardView<FinanzasDiario>(sql);
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Finanzas Recupero Master Hook
export const useFinanzasRecuperoMaster = () => {
  return useQuery({
    queryKey: ['finanzas-recupero-master'],
    queryFn: async () => {
      const sql = `SELECT * FROM dashboard.finanzas_recupero_master WHERE saldo_total > 0 ORDER BY saldo_total DESC`;
      return queryDashboardView<FinanzasRecuperoMaster>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Finanzas Deuda Aging Hook
export const useFinanzasDeudaAging = () => {
  return useQuery({
    queryKey: ['finanzas-deuda-aging'],
    queryFn: async () => {
      const sql = `SELECT * FROM dashboard.finanzas_deuda_aging ORDER BY orden ASC`;
      return queryDashboardView<FinanzasDeudaAging>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Finanzas Prioridades Hook
export const useFinanzasPrioridades = () => {
  return useQuery({
    queryKey: ['finanzas-prioridades'],
    queryFn: async () => {
      const sql = `SELECT * FROM dashboard.finanzas_prioridades ORDER BY orden ASC`;
      return queryDashboardView<FinanzasPrioridad>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Finanzas Por Profesional Hook
export const useFinanzasPorProfesional = () => {
  return useQuery({
    queryKey: ['finanzas-por-profesional'],
    queryFn: async () => {
      const sql = `SELECT * FROM dashboard.finanzas_por_profesional ORDER BY revenue_generado DESC NULLS LAST`;
      return queryDashboardView<FinanzasPorProfesional>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Finanzas Por Procedimiento Hook
export const useFinanzasPorProcedimiento = (limit: number = 10) => {
  return useQuery({
    queryKey: ['finanzas-por-procedimiento', limit],
    queryFn: async () => {
      const sql = `SELECT * FROM dashboard.finanzas_por_procedimiento ORDER BY revenue_total DESC NULLS LAST LIMIT ${limit}`;
      return queryDashboardView<FinanzasPorProcedimiento>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// KPI Calculations
export const useFinanzasKPIs = (filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  sucursal?: string;
}) => {
  const { data: diarioData, isLoading: diarioLoading } = useFinanzasDiarioV2(filters);
  const { data: recuperoData, isLoading: recuperoLoading } = useFinanzasRecuperoMaster();

  const isLoading = diarioLoading || recuperoLoading;

  const kpis = {
    // Revenue from finanzas_diario
    revenueTotal: diarioData?.reduce((sum, r) => sum + (Number(r.revenue_facturado) || 0), 0) || 0,
    turnosTotales: diarioData?.reduce((sum, r) => sum + (Number(r.turnos_con_revenue) || 0), 0) || 0,
    
    // Debt from finanzas_recupero_master
    deudaTQP: recuperoData?.reduce((sum, r) => sum + (Number(r.deuda_tqp) || 0), 0) || 0,
    deudaExtras: recuperoData?.reduce((sum, r) => sum + (Number(r.deuda_extras) || 0), 0) || 0,
    deudaTotal: recuperoData?.reduce((sum, r) => sum + (Number(r.saldo_total) || 0), 0) || 0,
    clientesConDeuda: recuperoData?.length || 0,
    clientesTQP: recuperoData?.filter(r => Number(r.deuda_tqp) > 0).length || 0,
    
    // Critical debt (>60 days)
    deudaCritica: recuperoData?.filter(r => r.dias_desde_ultima_visita > 60)
      .reduce((sum, r) => sum + (Number(r.saldo_total) || 0), 0) || 0,
    clientesCriticos: recuperoData?.filter(r => r.dias_desde_ultima_visita > 60).length || 0,
  };

  // Calculated KPIs
  const ticketPromedio = kpis.turnosTotales > 0 ? kpis.revenueTotal / kpis.turnosTotales : 0;
  const tasaCobro = kpis.revenueTotal > 0 
    ? ((kpis.revenueTotal - kpis.deudaTQP) / kpis.revenueTotal) * 100 
    : 0;

  return {
    isLoading,
    kpis: {
      ...kpis,
      ticketPromedio,
      tasaCobro: Math.min(100, Math.max(0, tasaCobro)), // Clamp between 0-100
    },
    diarioData,
    recuperoData,
  };
};
