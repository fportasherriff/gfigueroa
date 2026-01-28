import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import type { FinanzasDiario } from '@/types/dashboard';

interface EvolucionCobranzaChartProps {
  data: FinanzasDiario[];
  isLoading: boolean;
}

export const EvolucionCobranzaChart = ({ data, isLoading }: EvolucionCobranzaChartProps) => {
  const [activeTab, setActiveTab] = useState('revenue');

  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Group by month
    const byMonth: Record<string, { facturado: number; turnos: number }> = {};
    
    data.forEach(row => {
      const mes = row.fecha.substring(0, 7); // YYYY-MM
      if (!byMonth[mes]) {
        byMonth[mes] = { facturado: 0, turnos: 0 };
      }
      byMonth[mes].facturado += Number(row.revenue_facturado) || 0;
      byMonth[mes].turnos += Number(row.turnos_con_revenue) || 0;
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, datos]) => ({
        mes,
        revenue: datos.facturado,
        ticket: datos.turnos > 0 ? datos.facturado / datos.turnos : 0
      }));
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!chartData.length) {
    return (
      <Card className="border-none shadow-sm">
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
              ${(entry.value / 1000000).toFixed(2)}M
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Calculate trend line for ticket
  const calculateTrend = () => {
    if (chartData.length < 2) return [];
    const n = chartData.length;
    const sumX = chartData.reduce((s, _, i) => s + i, 0);
    const sumY = chartData.reduce((s, d) => s + d.ticket, 0);
    const sumXY = chartData.reduce((s, d, i) => s + i * d.ticket, 0);
    const sumXX = chartData.reduce((s, _, i) => s + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return chartData.map((d, i) => ({
      ...d,
      trend: intercept + slope * i
    }));
  };

  const ticketDataWithTrend = calculateTrend();

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Evolución Temporal</CardTitle>
            <CardDescription>Revenue mensual y ticket promedio</CardDescription>
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
                  <p><strong>Revenue:</strong> Total facturado por mes (área + línea)</p>
                  <p><strong>Ticket:</strong> Promedio por turno (barras + tendencia)</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  Vista: finanzas_diario
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="revenue">Revenue Mensual</TabsTrigger>
            <TabsTrigger value="ticket">Ticket Promedio</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis 
                    dataKey="mes" 
                    tickFormatter={formatMonth}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue" 
                    fill="url(#revenueGradient)" 
                    stroke="#3B82F6"
                    strokeWidth={0}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue" 
                    stroke="#1D4ED8"
                    strokeWidth={3}
                    dot={{ fill: "#1D4ED8", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#1D4ED8" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="ticket">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ticketDataWithTrend} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis 
                    dataKey="mes" 
                    tickFormatter={formatMonth}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, 'Ticket']}
                    labelFormatter={formatMonth}
                  />
                  <Legend />
                  <Bar 
                    dataKey="ticket" 
                    name="Ticket Promedio" 
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="trend" 
                    name="Tendencia" 
                    stroke="#6B7280"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
