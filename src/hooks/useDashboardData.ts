import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  FinanzasDiario,
  FinanzasDeudores,
  OperacionesDiario,
  OperacionesHeatmap,
  OperacionesCapacidad,
  ComercialEmbudo,
  ComercialCanales,
} from '@/types/dashboard';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

// Helper function to query dashboard views using execute_select RPC
const queryDashboardView = async <T>(sql: string): Promise<T[]> => {
  const { data, error } = await supabase.rpc('execute_select', { query: sql });
  
  if (error) throw error;
  
  // Handle error returned from the function
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error((data as any).error);
  }
  
  return (data || []) as T[];
};

// Helper to get date ranges
const getDefaultDateRange = () => {
  const now = new Date();
  return {
    currentMonth: {
      from: format(startOfMonth(now), 'yyyy-MM-dd'),
      to: format(endOfMonth(now), 'yyyy-MM-dd'),
    },
    previousMonth: {
      from: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
      to: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
    },
    last12Months: {
      from: format(startOfMonth(subMonths(now, 11)), 'yyyy-MM-dd'),
      to: format(endOfMonth(now), 'yyyy-MM-dd'),
    },
  };
};

// Finanzas Diario Hook
export const useFinanzasDiario = (filters?: { 
  fechaDesde?: string; 
  fechaHasta?: string; 
  sucursal?: string;
}) => {
  const ranges = getDefaultDateRange();
  
  return useQuery({
    queryKey: ['finanzas-diario', filters],
    queryFn: async () => {
      const fechaDesde = filters?.fechaDesde || ranges.last12Months.from;
      const fechaHasta = filters?.fechaHasta || ranges.last12Months.to;
      
      let sql = `SELECT * FROM dashboard.finanzas_diario WHERE fecha >= '${fechaDesde}' AND fecha <= '${fechaHasta}'`;
      
      if (filters?.sucursal) {
        sql += ` AND sucursal = '${filters.sucursal}'`;
      }
      
      sql += ` ORDER BY fecha ASC`;
      
      return queryDashboardView<FinanzasDiario>(sql);
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Finanzas Deudores Hook
export const useFinanzasDeudores = (limit: number = 20) => {
  return useQuery({
    queryKey: ['finanzas-deudores', limit],
    queryFn: async () => {
      const sql = `SELECT * FROM dashboard.finanzas_deudores WHERE deuda_total > 0 ORDER BY deuda_total DESC LIMIT ${limit}`;
      return queryDashboardView<FinanzasDeudores>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Operaciones Diario Hook
export const useOperacionesDiario = (filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  sucursal?: string;
  profesional?: string;
}) => {
  const ranges = getDefaultDateRange();

  return useQuery({
    queryKey: ['operaciones-diario', filters],
    queryFn: async () => {
      const fechaDesde = filters?.fechaDesde || ranges.last12Months.from;
      const fechaHasta = filters?.fechaHasta || ranges.last12Months.to;
      
      let sql = `SELECT * FROM dashboard.operaciones_diario WHERE fecha >= '${fechaDesde}' AND fecha <= '${fechaHasta}'`;

      if (filters?.sucursal) {
        sql += ` AND sucursal = '${filters.sucursal}'`;
      }
      if (filters?.profesional) {
        sql += ` AND profesional = '${filters.profesional}'`;
      }

      sql += ` ORDER BY fecha ASC`;

      return queryDashboardView<OperacionesDiario>(sql);
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Operaciones Heatmap Hook
export const useOperacionesHeatmap = (filters?: {
  sucursal?: string;
  profesional?: string;
}) => {
  return useQuery({
    queryKey: ['operaciones-heatmap', filters],
    queryFn: async () => {
      let sql = `SELECT * FROM dashboard.operaciones_heatmap WHERE 1=1`;

      if (filters?.sucursal) {
        sql += ` AND sucursal = '${filters.sucursal}'`;
      }
      if (filters?.profesional) {
        sql += ` AND profesional = '${filters.profesional}'`;
      }

      sql += ` ORDER BY dia_semana_num ASC, hora ASC`;

      return queryDashboardView<OperacionesHeatmap>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Operaciones Capacidad Hook
export const useOperacionesCapacidad = (filters?: {
  periodoDesde?: string;
  periodoHasta?: string;
}) => {
  const ranges = getDefaultDateRange();

  return useQuery({
    queryKey: ['operaciones-capacidad', filters],
    queryFn: async () => {
      const periodoDesde = filters?.periodoDesde || ranges.last12Months.from;
      const periodoHasta = filters?.periodoHasta || ranges.last12Months.to;
      
      const sql = `SELECT * FROM dashboard.operaciones_capacidad WHERE periodo_mes >= '${periodoDesde}' AND periodo_mes <= '${periodoHasta}' ORDER BY ocupacion_estimada_pct DESC`;

      return queryDashboardView<OperacionesCapacidad>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Comercial Embudo Hook
export const useComercialEmbudo = (filters?: {
  mesDesde?: string;
  mesHasta?: string;
  origen?: string;
}) => {
  const ranges = getDefaultDateRange();

  return useQuery({
    queryKey: ['comercial-embudo', filters],
    queryFn: async () => {
      const mesDesde = filters?.mesDesde || ranges.last12Months.from;
      const mesHasta = filters?.mesHasta || ranges.last12Months.to;
      
      let sql = `SELECT * FROM dashboard.comercial_embudo WHERE mes >= '${mesDesde}' AND mes <= '${mesHasta}'`;

      if (filters?.origen) {
        sql += ` AND origen = '${filters.origen}'`;
      }

      sql += ` ORDER BY mes ASC, orden_etapa ASC`;

      return queryDashboardView<ComercialEmbudo>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Comercial Canales Hook
export const useComercialCanales = (filters?: {
  mesDesde?: string;
  mesHasta?: string;
}) => {
  const ranges = getDefaultDateRange();

  return useQuery({
    queryKey: ['comercial-canales', filters],
    queryFn: async () => {
      const mesDesde = filters?.mesDesde || ranges.last12Months.from;
      const mesHasta = filters?.mesHasta || ranges.last12Months.to;
      
      const sql = `SELECT * FROM dashboard.comercial_canales WHERE mes >= '${mesDesde}' AND mes <= '${mesHasta}' ORDER BY revenue_generado DESC`;

      return queryDashboardView<ComercialCanales>(sql);
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Get unique values for filters
export const useSucursales = () => {
  return useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const sql = `SELECT DISTINCT sucursal FROM dashboard.finanzas_diario WHERE sucursal IS NOT NULL ORDER BY sucursal`;
      const data = await queryDashboardView<{ sucursal: string }>(sql);
      return data.map(d => d.sucursal).filter(Boolean);
    },
    staleTime: 30 * 60 * 1000,
  });
};

export const useProfesionales = () => {
  return useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const sql = `SELECT DISTINCT profesional FROM dashboard.operaciones_diario WHERE profesional IS NOT NULL ORDER BY profesional`;
      const data = await queryDashboardView<{ profesional: string }>(sql);
      return data.map(d => d.profesional).filter(Boolean);
    },
    staleTime: 30 * 60 * 1000,
  });
};

export const useOrigenes = () => {
  return useQuery({
    queryKey: ['origenes'],
    queryFn: async () => {
      const sql = `SELECT DISTINCT origen FROM dashboard.comercial_canales WHERE origen IS NOT NULL ORDER BY origen`;
      const data = await queryDashboardView<{ origen: string }>(sql);
      return data.map(d => d.origen).filter(Boolean);
    },
    staleTime: 30 * 60 * 1000,
  });
};
