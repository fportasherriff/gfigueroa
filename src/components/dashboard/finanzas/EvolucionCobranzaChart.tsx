import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import type { FinanzasDiario } from '@/types/dashboard';

interface EvolucionCobranzaChartProps {
  data: FinanzasDiario[];
  isLoading: boolean;
}

export const EvolucionCobranzaChart = ({ data, isLoading }: EvolucionCobranzaChartProps) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Group by month
    const byMonth: Record<string, { facturado: number; cobrado: number }> = {};
    
    data.forEach(row => {
      const mes = row.fecha.substring(0, 7); // YYYY-MM
      if (!byMonth[mes]) {
        byMonth[mes] = { facturado: 0, cobrado: 0 };
      }
      byMonth[mes].facturado += Number(row.revenue_facturado) || 0;
      // Estimate cobrado based on turnos_con_revenue ratio
      const tasaCobro = row.turnos_asistidos > 0 
        ? (row.turnos_con_revenue / row.turnos_asistidos) 
        : 0.9;
      byMonth[mes].cobrado += (Number(row.revenue_facturado) || 0) * tasaCobro;
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, datos]) => ({
        mes,
        cobrado: datos.cobrado,
        facturado: datos.facturado,
        tasa_cobro: datos.facturado > 0 
          ? Number(((datos.cobrado / datos.facturado) * 100).toFixed(1))
          : 0
      }));
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de evolución"
            description="No hay datos disponibles para el período seleccionado."
          />
        </CardContent>
      </Card>
    );
  }

  const formatMonth = (value: string) => {
    const [year, month] = value.split('-');
    return `${month}/${year.slice(2)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{formatMonth(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">
              {entry.name === 'Tasa Cobro' 
                ? `${entry.value}%` 
                : `$${(entry.value / 1000000).toFixed(2)}M`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Evolución de Cobranza</CardTitle>
            <CardDescription>Monto cobrado mensual y tasa de cobro</CardDescription>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-semibold mb-2">¿Qué muestra este gráfico?</p>
                <div className="space-y-1 text-xs">
                  <p>■ Barras: Monto cobrado por mes</p>
                  <p>● Línea: Tasa de cobro mensual %</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  Tasa = (Cobrado / Facturado) × 100
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="mes" 
                tickFormatter={formatMonth}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="cobrado" 
                name="Cobrado" 
                fill="hsl(221, 83%, 53%)" 
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="tasa_cobro" 
                name="Tasa Cobro" 
                stroke="hsl(38, 92%, 50%)" 
                strokeWidth={2}
                dot={{ fill: "hsl(38, 92%, 50%)", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
