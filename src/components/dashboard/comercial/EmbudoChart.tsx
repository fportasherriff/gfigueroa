import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber } from '@/lib/formatters';
import type { ComercialEmbudo } from '@/types/dashboard';

interface EmbudoChartProps {
  data: ComercialEmbudo[];
  isLoading: boolean;
}

const ETAPA_ORDER = ['alta', 'primera_consulta', 'primer_pago', 'recurrente'] as const;

const ETAPA_CONFIG: Record<string, { label: string; tooltip: string }> = {
  alta: {
    label: 'Alta',
    tooltip: 'Clientes dados de alta en el período seleccionado.',
  },
  primera_consulta: {
    label: 'Primera Consulta',
    tooltip: 'Primera vez que el cliente asistió en toda su historia. Incluye: Nuevos (alta en el período), Reactivados dormidos (alta previa, primera visita ahora), Resucitados (ya habían venido pero hace más de 12 meses).',
  },
  primer_pago: {
    label: 'Primer Pago',
    tooltip: 'Primer turno asistido con monto > $0 en toda la historia del cliente. No se cuentan cortesías ni turnos gratuitos (monto = $0).',
  },
  recurrente: {
    label: 'Recurrente (3+ turnos)',
    tooltip: 'Clientes que alcanzaron 3 o más asistencias históricas acumuladas durante el período.',
  },
};

const SEGMENT_COLORS = {
  nuevos: { bg: 'bg-blue-500', text: 'text-blue-600', label: 'Nuevos' },
  reactivados_dormidos: { bg: 'bg-orange-500', text: 'text-orange-600', label: 'Reactivados dormidos' },
  resucitados: { bg: 'bg-green-500', text: 'text-green-600', label: 'Resucitados' },
};

export const EmbudoChart = ({ data, isLoading }: EmbudoChartProps) => {
  const stages = useMemo(() => {
    if (!data.length) return null;

    // Aggregate by etapa across all rows
    const agg: Record<string, { nuevos: number; reactivados_dormidos: number; resucitados: number }> = {};
    for (const etapa of ETAPA_ORDER) {
      agg[etapa] = { nuevos: 0, reactivados_dormidos: 0, resucitados: 0 };
    }
    for (const row of data) {
      const e = row.etapa;
      if (!agg[e]) continue;
      agg[e].nuevos += Number(row.nuevos || 0);
      agg[e].reactivados_dormidos += Number(row.reactivados_dormidos || 0);
      agg[e].resucitados += Number(row.resucitados || 0);
    }

    return ETAPA_ORDER.map(etapa => {
      const d = agg[etapa];
      const total = d.nuevos + d.reactivados_dormidos + d.resucitados;
      return {
        etapa,
        ...ETAPA_CONFIG[etapa],
        nuevos: d.nuevos,
        reactivados_dormidos: d.reactivados_dormidos,
        resucitados: d.resucitados,
        total,
      };
    });
  }, [data]);

  if (isLoading) return <ChartSkeleton />;
  if (!stages || stages.every(s => s.total === 0)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            title="Sin datos de embudo"
            description="No hay datos de activación disponibles para el período seleccionado."
          />
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...stages.map(s => s.total));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Activación de Clientes</CardTitle>
            <CardDescription>
              Recorrido desde el alta hasta la recurrencia — desglosado por tipo de cliente.
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-semibold mb-2">¿Cómo se lee este gráfico?</p>
                <p className="text-xs text-muted-foreground">
                  Cada barra muestra cuántos clientes alcanzaron esa etapa, desglosados en 3 segmentos:
                </p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  <li><span className="font-medium text-blue-600">Nuevos</span>: alta en el período</li>
                  <li><span className="font-medium text-orange-600">Reactivados</span>: alta previa, primera visita ahora</li>
                  <li><span className="font-medium text-green-600">Resucitados</span>: volvieron después de 12+ meses</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Los clientes "Activos" (última visita &lt; 12 meses) no aparecen — el funnel mide conversión y reactivación, no retención.
                </p>
                <p className="text-xs text-blue-600 mt-2 font-mono">
                  📊 Vista: dashboard.comercial_embudo
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {stages.map((stage) => {
          const barWidth = maxTotal > 0 ? Math.max((stage.total / maxTotal) * 100, 8) : 8;
          const nuevoPct = stage.total > 0 ? (stage.nuevos / stage.total) * 100 : 0;
          const reactivadoPct = stage.total > 0 ? (stage.reactivados_dormidos / stage.total) * 100 : 0;
          const resucitadoPct = stage.total > 0 ? (stage.resucitados / stage.total) * 100 : 0;

          return (
            <div key={stage.etapa} className="space-y-1.5">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{stage.label}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{stage.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-lg font-bold">{formatNumber(stage.total)}</span>
              </div>

              {/* Stacked bar */}
              <div
                className="h-10 rounded-lg overflow-hidden flex transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              >
                {stage.nuevos > 0 && (
                  <div
                    className="bg-blue-500 h-full flex items-center justify-center"
                    style={{ width: `${nuevoPct}%` }}
                  >
                    {nuevoPct >= 15 && (
                      <span className="text-xs font-medium text-white">{formatNumber(stage.nuevos)}</span>
                    )}
                  </div>
                )}
                {stage.reactivados_dormidos > 0 && (
                  <div
                    className="bg-orange-500 h-full flex items-center justify-center"
                    style={{ width: `${reactivadoPct}%` }}
                  >
                    {reactivadoPct >= 15 && (
                      <span className="text-xs font-medium text-white">{formatNumber(stage.reactivados_dormidos)}</span>
                    )}
                  </div>
                )}
                {stage.resucitados > 0 && (
                  <div
                    className="bg-green-500 h-full flex items-center justify-center"
                    style={{ width: `${resucitadoPct}%` }}
                  >
                    {resucitadoPct >= 15 && (
                      <span className="text-xs font-medium text-white">{formatNumber(stage.resucitados)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Segment detail line */}
              <div className="flex gap-4 text-xs text-muted-foreground pl-1">
                {stage.nuevos > 0 && (
                  <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />{formatNumber(stage.nuevos)} nuevos</span>
                )}
                {stage.reactivados_dormidos > 0 && (
                  <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />{formatNumber(stage.reactivados_dormidos)} reactivados</span>
                )}
                {stage.resucitados > 0 && (
                  <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />{formatNumber(stage.resucitados)} resucitados</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-6 pt-2 border-t border-border/50">
          {Object.entries(SEGMENT_COLORS).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Los clientes "Activos" (ya asistieron antes con última visita &lt; 12 meses) no aparecen en el funnel — este gráfico mide conversión y reactivación, no retención.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
