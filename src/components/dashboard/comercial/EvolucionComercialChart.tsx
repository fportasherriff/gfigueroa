import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber } from '@/lib/formatters';
import type { ComercialEmbudo } from '@/types/dashboard';

interface EvolucionComercialChartProps {
  data: ComercialEmbudo[];
  isLoading: boolean;
}

export const EvolucionComercialChart = ({ data, isLoading }: EvolucionComercialChartProps) => {
  const chartData = useMemo(() => {
    if (!data.length) return null;

    // Filter only primera_consulta rows
    const filtered = data.filter(r => r.etapa === 'primera_consulta');
    if (!filtered.length) return null;

    // Aggregate by mes_evento
    const byMonth: Record<string, { nuevos: number; reactivados_dormidos: number; resucitados: number }> = {};
    for (const row of filtered) {
      const key = row.mes_evento || '';
      if (!key) continue;
      if (!byMonth[key]) {
        byMonth[key] = { nuevos: 0, reactivados_dormidos: 0, resucitados: 0 };
      }
      byMonth[key].nuevos += Number(row.nuevos || 0);
      byMonth[key].reactivados_dormidos += Number(row.reactivados_dormidos || 0);
      byMonth[key].resucitados += Number(row.resucitados || 0);
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, vals]) => {
        const d = new Date(mes + 'T00:00:00');
        const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
        return {
          mes: label,
          Nuevos: vals.nuevos,
          'Reactivados dormidos': vals.reactivados_dormidos,
          Resucitados: vals.resucitados,
        };
      });
  }, [data]);

  if (isLoading) return <ChartSkeleton />;
  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            title="Sin datos de evolución"
            description="No hay datos de primera consulta disponibles para el período seleccionado."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Evolución mensual por tipo de cliente</CardTitle>
            <CardDescription>
              Primeras consultas por mes, desglosadas por tipo de cliente.
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
                <p className="font-semibold mb-1">¿Qué muestra este gráfico?</p>
                <p className="text-xs text-muted-foreground">
                  Cantidad de clientes que tuvieron su primera consulta cada mes, separados en nuevos, reactivados dormidos y resucitados.
                </p>
                <p className="text-xs text-blue-600 mt-2 font-mono">
                  📊 Vista: dashboard.comercial_embudo (etapa = primera_consulta)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [formatNumber(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Nuevos" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Reactivados dormidos" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Resucitados" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
