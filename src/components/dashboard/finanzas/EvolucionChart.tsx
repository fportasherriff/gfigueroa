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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartSkeleton } from '../DashboardStates';
import { formatCurrency, formatMonthYear } from '@/lib/formatters';
import type { FinanzasDiario } from '@/types/dashboard';

interface EvolucionChartProps {
  data: FinanzasDiario[];
  isLoading: boolean;
}

export const EvolucionChart = ({ data, isLoading }: EvolucionChartProps) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Group by month
    const monthlyData: Record<string, {
      mes: string;
      facturado: number;
      cobrado: number;
      tasaCobro: number;
    }> = {};

    data.forEach(d => {
      const monthKey = `${d.anio}-${String(d.mes).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          mes: monthKey,
          facturado: 0,
          cobrado: 0,
          tasaCobro: 0,
        };
      }
      monthlyData[monthKey].facturado += Number(d.revenue_facturado || 0);
    });

    // Calculate cobrado (estimated) and tasa
    return Object.values(monthlyData)
      .map(m => ({
        ...m,
        cobrado: m.facturado * 0.75, // Estimación
        tasaCobro: 75, // Estimación
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!chartData.length) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{formatMonthYear(label + '-01')}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {entry.name === 'Tasa Cobro' 
                ? `${entry.value.toFixed(1)}%`
                : formatCurrency(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolución Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="mes" 
                tickFormatter={(value) => formatMonthYear(value + '-01')}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="facturado" 
                name="Facturado"
                fill="hsl(217, 91%, 60%)" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="left"
                dataKey="cobrado" 
                name="Cobrado"
                fill="hsl(142, 76%, 36%)" 
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="tasaCobro" 
                name="Tasa Cobro"
                stroke="hsl(25, 95%, 53%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(25, 95%, 53%)', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
