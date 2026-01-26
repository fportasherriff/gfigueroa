import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
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

// Create a generic Supabase client for dashboard schema queries
const supabaseUrl = "https://ehpmvahaixellqfwwyam.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocG12YWhhaXhlbGxxZnd3eWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjUzNDAsImV4cCI6MjA4NDE0MTM0MH0.VAfGXWOqrq-PpbA9zwvky3wi8td22luGPGl-VwEM_e4";

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'dashboard' }
});

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
      const { data, error } = await supabase
        .from('finanzas_diario')
        .select('*')
        .gte('fecha', filters?.fechaDesde || ranges.last12Months.from)
        .lte('fecha', filters?.fechaHasta || ranges.last12Months.to)
        .order('fecha', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FinanzasDiario[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Finanzas Deudores Hook
export const useFinanzasDeudores = (limit: number = 20) => {
  return useQuery({
    queryKey: ['finanzas-deudores', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finanzas_deudores')
        .select('*')
        .gt('deuda_total', 0)
        .order('deuda_total', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as FinanzasDeudores[];
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
      let query = supabase
        .from('operaciones_diario')
        .select('*')
        .gte('fecha', filters?.fechaDesde || ranges.last12Months.from)
        .lte('fecha', filters?.fechaHasta || ranges.last12Months.to)
        .order('fecha', { ascending: true });

      if (filters?.sucursal) {
        query = query.eq('sucursal', filters.sucursal);
      }
      if (filters?.profesional) {
        query = query.eq('profesional', filters.profesional);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as OperacionesDiario[];
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
      let query = supabase
        .from('operaciones_heatmap')
        .select('*')
        .order('dia_semana_num', { ascending: true })
        .order('hora', { ascending: true });

      if (filters?.sucursal) {
        query = query.eq('sucursal', filters.sucursal);
      }
      if (filters?.profesional) {
        query = query.eq('profesional', filters.profesional);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as OperacionesHeatmap[];
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
      const { data, error } = await supabase
        .from('operaciones_capacidad')
        .select('*')
        .gte('periodo_mes', filters?.periodoDesde || ranges.last12Months.from)
        .lte('periodo_mes', filters?.periodoHasta || ranges.last12Months.to)
        .order('ocupacion_estimada_pct', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as OperacionesCapacidad[];
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
      let query = supabase
        .from('comercial_embudo')
        .select('*')
        .gte('mes', filters?.mesDesde || ranges.last12Months.from)
        .lte('mes', filters?.mesHasta || ranges.last12Months.to)
        .order('mes', { ascending: true })
        .order('orden_etapa', { ascending: true });

      if (filters?.origen) {
        query = query.eq('origen', filters.origen);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ComercialEmbudo[];
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
      const { data, error } = await supabase
        .from('comercial_canales')
        .select('*')
        .gte('mes', filters?.mesDesde || ranges.last12Months.from)
        .lte('mes', filters?.mesHasta || ranges.last12Months.to)
        .order('revenue_generado', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ComercialCanales[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Get unique values for filters
export const useSucursales = () => {
  return useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finanzas_diario')
        .select('sucursal');

      if (error) throw error;
      const unique = [...new Set((data || []).map((d: any) => d.sucursal))];
      return unique.filter(Boolean) as string[];
    },
    staleTime: 30 * 60 * 1000,
  });
};

export const useProfesionales = () => {
  return useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operaciones_diario')
        .select('profesional');

      if (error) throw error;
      const unique = [...new Set((data || []).map((d: any) => d.profesional))];
      return unique.filter(Boolean) as string[];
    },
    staleTime: 30 * 60 * 1000,
  });
};

export const useOrigenes = () => {
  return useQuery({
    queryKey: ['origenes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comercial_canales')
        .select('origen');

      if (error) throw error;
      const unique = [...new Set((data || []).map((d: any) => d.origen))];
      return unique.filter(Boolean) as string[];
    },
    staleTime: 30 * 60 * 1000,
  });
};
