import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber } from '@/lib/formatters';
import type { ComercialEmbudo } from '@/types/dashboard';

interface EvolucionComercialChartProps {
  data: ComercialEmbudo[];
  isLoading: boolean;
}

export const EvolucionComercialChart = ({ data, isLoading }: EvolucionComercialChartProps) => {
  const { absoluteData, percentData } = useMemo(() => {
    if (!data.length) return { absoluteData: null, percentData: null };

    const filtered = data.filter(r => r.etapa === 'primera_consulta');
    if (!filtered.length) return { absoluteData: null, percentData: null };

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

    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));

    const absoluteData = sorted.map(([mes, vals]) => {
      const [year, month] = mes.split('-');
      const d = new Date(Number(year), Number(month) - 1, 15);
      const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      return {
        mes: label,
        Nuevos: vals.nuevos,
        'Reactivados dormidos': vals.reactivados_dormidos,
        Resucitados: vals.resucitados,
      };
    });

    const percentData = sorted.map(([mes, vals]) => {
      const [year, month] = mes.split('-');
      const d = new Date(Number(year), Number(month) - 1, 15);
      const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      const total = vals.nuevos + vals.reactivados_dormidos + vals.resucitados;
      if (total === 0) return { mes: label, Nuevos: 0, 'Reactivados dormidos': 0, Resucitados: 0 };
      return {
        mes: label,
        Nuevos: Number(((vals.nuevos / total) * 100).toFixed(1)),
        'Reactivados dormidos': Number(((vals.reactivados_dormidos / total) * 100).toFixed(1)),
        Resucitados: Number(((vals.resucitados / total) * 100).toFixed(1)),
      };
    });

    return { absoluteData, percentData };
  }, [data]);

  if (isLoading) return <ChartSkeleton />;
  if (!absoluteData || absoluteData.length === 0) {
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

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  const renderChart = (chartData: typeof absoluteData, isPercent: boolean) => (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={isPercent ? (v) => `${v}%` : undefined}
          />
          <RechartsTooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => [
              isPercent ? `${value.toFixed(1)}%` : formatNumber(value),
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Nuevos" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Reactivados dormidos" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Resucitados" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

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
                <p className="font-semibold mb-1">¿Para qué sirve?</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Muestra la tendencia mensual de clientes que tuvieron su primera consulta.
                </p>
                <p className="font-semibold mb-1">¿Cómo se interpreta?</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Tab "Cantidad": valores absolutos. Tab "% del mes": cada segmento como porcentaje del total mensual.
                </p>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border font-mono">
                  📊 Vista: dashboard.comercial_embudo (etapa = primera_consulta)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cantidad">
          <TabsList className="mb-4">
            <TabsTrigger value="cantidad">Cantidad</TabsTrigger>
            <TabsTrigger value="porcentaje">% del mes</TabsTrigger>
          </TabsList>
          <TabsContent value="cantidad">
            {renderChart(absoluteData, false)}
          </TabsContent>
          <TabsContent value="porcentaje">
            {renderChart(percentData, true)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
