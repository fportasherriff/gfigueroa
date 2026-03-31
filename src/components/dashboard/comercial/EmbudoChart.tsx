import { useMemo, useState, useEffect } from 'react';
import { ChartSkeleton } from '../DashboardStates';
import { FunnelSVG } from './FunnelSVG';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ComercialEmbudo } from '@/types/dashboard';

interface EmbudoChartProps {
  data: ComercialEmbudo[];
  isLoading: boolean;
  fechaDesde: string; // YYYY-MM-DD
}

const ETAPA_ORDER = ['alta', 'primera_consulta', 'primer_pago', 'recurrente'] as const;
const REACTIVACION_ORDER = ['primera_consulta', 'primer_pago', 'recurrente'] as const;

const ETAPA_LABELS: Record<string, string> = {
  alta: 'Alta',
  primera_consulta: 'Primera Consulta',
  primer_pago: 'Primer Pago',
  recurrente: 'Recurrente (3+)',
};

const ETAPA_TOOLTIPS_NUEVOS: Record<string, string> = {
  alta: 'Clientes dados de alta en el período seleccionado',
  primera_consulta: 'Primera visita histórica del cliente que ocurrió en el período. Nuevo = alta en el período. Reactivado dormido = alta previa, nunca había venido. Resucitado = ya había venido pero hace más de 12 meses.',
  primer_pago: 'Primer pago histórico (monto > $0) del cliente, que ocurrió en el período. Es subconjunto de Primera Consulta — solo clientes que ya pasaron por esa etapa.',
  recurrente: 'Clientes con 3+ asistencias desde su primera consulta, que ya realizaron al menos un pago. Es subconjunto de Primer Pago.',
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
      tooltip: ETAPA_TOOLTIPS_NUEVOS[etapa],
    }));

    const reactivacionStages = REACTIVACION_ORDER.map(etapa => ({
      label: ETAPA_LABELS[etapa],
      value: agg[etapa].reactivados,
      tooltip: ETAPA_TOOLTIPS_NUEVOS[etapa],
    }));

    return { nuevosStages, reactivacionStages };
  }, [data]);

  if (isLoading) return <ChartSkeleton />;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="adquisicion" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="adquisicion" className="flex-1">Adquisición</TabsTrigger>
          <TabsTrigger value="reactivacion" className="flex-1">Reactivación</TabsTrigger>
        </TabsList>

        <TabsContent value="adquisicion">
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
        </TabsContent>

        <TabsContent value="reactivacion">
          <div className="space-y-4">
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
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Los Resucitados (clientes que vuelven tras +12 meses sin visita) aparecen en este funnel pero actualmente son muy pocos porque el historial de agenda disponible arranca en enero 2025. Este número irá creciendo naturalmente a medida que pasen los meses.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 Los clientes "Activos" (ya asistieron con última visita reciente {'<'} 12 meses) no aparecen en estos funnels — el funnel mide conversión y reactivación, no retención.
        </p>
      </div>
    </div>
  );
};
