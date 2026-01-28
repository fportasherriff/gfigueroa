// Dashboard Types - Mapeados a las vistas materializadas en Supabase

export interface FinanzasDiario {
  fecha: string;
  sucursal: string;
  turnos_agendados: number;
  turnos_asistidos: number;
  turnos_cancelados: number;
  turnos_inasistidos: number;
  turnos_pendientes: number;
  revenue_facturado: number;
  tasa_asistencia_pct: number;
  tasa_cancelacion_pct: number;
  ticket_promedio: number;
  clientes_unicos_atendidos: number;
  turnos_con_revenue: number;
  dia_semana: string;
  dia_semana_num: number;
  anio: number;
  mes: number;
}

export interface FinanzasDeudores {
  id_cliente: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  sucursal: string;
  deuda_total: number;
  revenue_historico: number;
  revenue_12m: number;
  frecuencia_visitas_total: number;
  frecuencia_visitas_12m: number;
  ultimo_turno_fecha: string | null;
  ultimo_pago_fecha: string | null;
  ultimo_procedimiento: string | null;
  dias_desde_ultimo_pago: number | null;
  dias_desde_ultima_visita: number | null;
  ltv: number;
  ratio_deuda_ltv_pct: number;
  estado_actividad: 'Activo' | 'Inactivo';
  segmento_riesgo: 'Bajo' | 'Medio' | 'Alto';
  prioridad_contacto: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}

// New Finanzas types for redesigned module
export interface FinanzasRecuperoMaster {
  id_cliente: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  sucursal: string;
  saldo_total: number;
  deuda_tqp: number;
  deuda_extras: number;
  ltv: number;
  ratio_deuda_ltv_pct: number | null;
  dias_desde_ultima_visita: number;
  segmento_riesgo: 'Bajo' | 'Medio' | 'Alto';
  segmento_ltv: 'Premium' | 'Medio' | 'Nuevo';
  prioridad_contacto: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  tipo_mensaje: 'premium' | 'alto_valor' | 'estandar';
}

export interface FinanzasDeudaAging {
  segmento_antiguedad: string;
  orden: number;
  cantidad_clientes: number;
  deuda_total: number;
  deuda_tqp: number;
  deuda_promedio: number;
}

export interface FinanzasPrioridad {
  prioridad: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  orden: number;
  cantidad_clientes: number;
  deuda_total: number;
  deuda_promedio: number;
}

export interface FinanzasPorProfesional {
  profesional: string;
  turnos_atendidos: number;
  turnos_facturados: number;
  clientes_atendidos: number;
  revenue_generado: number | null;
  ticket_promedio: number | null;
  tasa_facturacion_pct: number;
}

export interface FinanzasPorProcedimiento {
  procedimiento: string;
  veces_realizado: number;
  clientes_unicos: number;
  revenue_total: number;
  precio_promedio: number;
  primera_vez: string;
  ultima_vez: string;
}

export interface OperacionesDiario {
  fecha: string;
  profesional: string;
  sucursal: string;
  turnos_agendados: number;
  turnos_asistidos: number;
  turnos_cancelados: number;
  turnos_inasistidos: number;
  turnos_pendientes: number;
  revenue: number;
  tasa_asistencia_pct: number;
  tasa_cancelacion_pct: number;
  tasa_inasistencia_pct: number;
  clientes_unicos: number;
  dia_semana_num: number;
  dia_semana: string;
  anio: number;
  mes: number;
}

export interface OperacionesHeatmap {
  dia_semana_num: number;
  dia_semana: string;
  hora: number;
  franja_horaria: string;
  profesional: string;
  sucursal: string;
  turnos_agendados: number;
  turnos_asistidos: number;
  turnos_cancelados: number;
  turnos_inasistidos: number;
  revenue: number;
  tasa_asistencia_pct: number;
  tasa_cancelacion_pct: number;
  revenue_promedio_turno: number;
}

export interface OperacionesCapacidad {
  periodo_mes: string;
  profesional: string;
  sucursal: string;
  turnos_agendados: number;
  turnos_asistidos: number;
  turnos_cancelados: number;
  turnos_inasistidos: number;
  dias_activos: number;
  turnos_promedio_dia: number;
  revenue_total: number;
  tasa_asistencia_pct: number;
  tasa_cancelacion_pct: number;
  tasa_inasistencia_pct: number;
  clientes_unicos: number;
  revenue_promedio_turno: number;
  ocupacion_estimada_pct: number;
  alerta_sobrecarga: boolean;
  alerta_alta_cancelacion: boolean;
  anio: number;
  mes: number;
}

export interface ComercialEmbudo {
  mes: string;
  origen: string;
  etapa: 'Lead' | 'Consulta' | 'Tratamiento' | 'Recurrente';
  orden_etapa: number;
  cantidad: number;
}

export interface ComercialCanales {
  mes: string;
  origen: string;
  leads_generados: number;
  clientes_convertidos: number;
  clientes_con_revenue: number;
  tasa_conversion_pct: number;
  revenue_generado: number;
  clientes_activos_mes: number;
  revenue_por_lead: number;
  revenue_por_cliente: number;
  anio: number;
  mes_num: number;
}

// KPI Types
export interface KPIData {
  value: number;
  previousValue?: number;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Filters
export interface DashboardFilters {
  dateRange: DateRange;
  sucursal?: string;
  profesional?: string;
  origen?: string;
}
