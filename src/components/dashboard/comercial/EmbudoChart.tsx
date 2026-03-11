import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber, formatPercent } from '@/lib/formatters';
import type { ComercialEmbudo } from '@/types/dashboard';

interface EmbudoChartProps {
  data: ComercialEmbudo[];
  isLoading: boolean;
}

const STAGES = [
  { key: 'clientes_nuevos',       pctKey: null,              label: 'Alta como cliente',       color: 'bg-slate-500',  dot: 'bg-slate-500'   },
  { key: 'con_primera_consulta',  pctKey: 'pct_consulta',    label: 'Primera Consulta',        color: 'bg-blue-500',   dot: 'bg-blue-500'    },
  { key: 'con_primer_pago',       pctKey: 'pct_pago',        label: 'Primer Pago',             color: 'bg-green-500',  dot: 'bg-green-500'   },
  { key: 'recurrentes',           pctKey: 'pct_recurrente',  label: 'Recurrente (3+ turnos)',  color: 'bg-purple-500', dot: 'bg-purple-500'  },
] as const;

export const EmbudoChart = ({ data, isLoading }: EmbudoChartProps) => {
  const totals = useMemo(() => {
    if (!data.length) return null;
    return data.reduce(
      (acc, row) => ({
        clientes_nuevos:      acc.clientes_nuevos      + Number(row.clientes_nuevos      || 0),
        con_primera_consulta: acc.con_primera_consulta + Number(row.con_primera_consulta || 0),
        con_primer_pago:      acc.con_primer_pago      + Number(row.con_primer_pago      || 0),
        recurrentes:          acc.recurrentes          + Number(row.recurrentes          || 0),
      }),
      { clientes_nuevos: 0, con_primera_consulta: 0, con_primer_pago: 0, recurrentes: 0 }
    );
  }, [data]);

  if (isLoading) return <ChartSkeleton />;
  if (!totals || totals.clientes_nuevos === 0) {
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

  const base = totals.clientes_nuevos;

  const stages = STAGES.map(s => ({
    label:   s.label,
    color:   s.color,
    dot:     s.dot,
    value:   totals[s.key],
    pct:     s.pctKey === null ? 100 : Math.round((totals[s.key] / base) * 100 * 10) / 10,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Activación de Clientes</CardTitle>
            <CardDescription>
              De cada 100 clientes que se dan de alta, ¿cuántos llegan a cada etapa?
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-semibold mb-2">¿Cómo se calcula?</p>
              <p className="text-xs text-muted-foreground">
                Todos los porcentajes son sobre el total de clientes dados de alta. Un cliente puede estar en varias etapas a la vez.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Recurrente = 3 o más turnos asistidos.
              </p>
              <p className="text-xs text-blue-600 mt-2 font-mono">
                📊 Vista: dashboard.comercial_embudo
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stage.dot}`} />
                <span className="font-medium">{stage.label}</span>
                <span className="text-lg font-bold">{formatNumber(stage.value)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatPercent(stage.pct)} del total
              </span>
            </div>

            <div className="h-10 rounded-lg overflow-hidden bg-muted/30 transition-all duration-500"
              style={{ width: `${Math.max(stage.pct, 8)}%` }}
            >
              <div className={`h-full ${stage.color} flex items-center justify-end pr-3`}>
                {stage.pct >= 12 && (
                  <span className="text-xs font-medium text-white">{formatPercent(stage.pct)}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Los porcentajes son independientes entre sí — un cliente puede tener consulta, pago y ser recurrente al mismo tiempo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
