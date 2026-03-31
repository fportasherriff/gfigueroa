import { useMemo } from 'react';
import { ChartSkeleton } from '../DashboardStates';
import { FunnelSVG } from './FunnelSVG';
import type { ComercialEmbudo } from '@/types/dashboard';

interface EmbudoChartProps {
  data: ComercialEmbudo[];
  isLoading: boolean;
}

const ETAPA_ORDER = ['alta', 'primera_consulta', 'primer_pago', 'recurrente'] as const;
const REACTIVACION_ORDER = ['primera_consulta', 'primer_pago', 'recurrente'] as const;

const ETAPA_LABELS: Record<string, string> = {
  alta: 'Alta',
  primera_consulta: 'Primera Consulta',
  primer_pago: 'Primer Pago',
  recurrente: 'Recurrente (3+)',
};

const ETAPA_TOOLTIPS: Record<string, string> = {
  alta: 'Clientes dados de alta en el período seleccionado.',
  primera_consulta: 'Primera visita histórica del cliente que ocurrió en el período. Incluye reactivados dormidos (alta previa, nunca habían venido) y resucitados (volvieron tras +12 meses sin visita). Nota: los resucitados son pocos actualmente porque el historial de agenda cubre desde enero 2025 — irán creciendo con el tiempo.',
  primer_pago: 'Primera vez que el cliente pagó en toda su historia — no se cuentan cortesías ni turnos gratuitos (monto = $0).',
  recurrente: 'Clientes que alcanzaron 3 o más asistencias acumuladas históricas durante el período.',
};

export const EmbudoChart = ({ data, isLoading }: EmbudoChartProps) => {
  const { nuevosStages, reactivacionStages } = useMemo(() => {
    if (!data.length) return { nuevosStages: [], reactivacionStages: [] };

    const agg: Record<string, { nuevos: number; reactivados: number }> = {};
    for (const etapa of ETAPA_ORDER) {
      agg[etapa] = { nuevos: 0, reactivados: 0 };
    }
    for (const row of data) {
      if (!agg[row.etapa]) continue;
      agg[row.etapa].nuevos += Number(row.nuevos || 0);
      agg[row.etapa].reactivados += Number(row.reactivados_dormidos || 0) + Number(row.resucitados || 0);
    }

    const nuevosStages = ETAPA_ORDER.map(etapa => ({
      label: ETAPA_LABELS[etapa],
      value: agg[etapa].nuevos,
      tooltip: ETAPA_TOOLTIPS[etapa],
    }));

    const reactivacionStages = REACTIVACION_ORDER.map(etapa => ({
      label: ETAPA_LABELS[etapa],
      value: agg[etapa].reactivados,
      tooltip: ETAPA_TOOLTIPS[etapa],
    }));

    return { nuevosStages, reactivacionStages };
  }, [data]);

  if (isLoading) return <ChartSkeleton />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelSVG
          title="Adquisición de Nuevos"
          description="Conversión de clientes nuevos desde el alta hasta la recurrencia"
          stages={nuevosStages}
          colorStart="#0075FF"
          colorEnd="#66B2FF"
          tooltipInfo={{
            description: 'Muestra la conversión progresiva de clientes nuevos dados de alta en el período.',
            calculation: 'SUM(nuevos) por cada etapa del funnel: alta → primera_consulta → primer_pago → recurrente.',
            source: 'dashboard.comercial_embudo',
          }}
        />
        <FunnelSVG
          title="Reactivación"
          description="Conversión de clientes reactivados dormidos y resucitados"
          stages={reactivacionStages}
          colorStart="#F97316"
          colorEnd="#FDBA74"
          tooltipInfo={{
            description: 'Muestra la conversión de clientes que volvieron: dormidos (alta previa, nunca visitaron) y resucitados (+12 meses sin visita).',
            calculation: 'SUM(reactivados_dormidos + resucitados) por cada etapa: primera_consulta → primer_pago → recurrente.',
            source: 'dashboard.comercial_embudo',
          }}
        />
      </div>
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 Los clientes "Activos" (ya asistieron con última visita reciente {'<'} 12 meses) no aparecen en estos funnels — el funnel mide conversión y reactivación, no retención.
        </p>
      </div>
    </div>
  );
};
