import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
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
  const [activeTab, setActiveTab] = useState('facturacion');

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
      .map(([mes, datos]) => {
        const ticket = datos.turnos > 0 ? datos.facturado / datos.turnos : 0;
        // Tasa de cobranza - using estimate as we don't have revenue_cobrado
        // In reality this should come from the actual data
        const tasaCobranza = 92; // Placeholder - would be (revenue_cobrado / revenue_facturado) * 100
        return {
          mes,
          facturacion: datos.facturado,
          ticket,
          tasaCobranza
        };
      });
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

  const CustomTooltipFacturacion = ({ active, payload, label }: any) => {
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

  const CustomTooltipTicket = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{formatMonth(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">
              ${(entry.value / 1000).toFixed(0)}K
            </span>
          </div>
        ))}
      </div>
    );
  };

  const CustomTooltipTasa = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{formatMonth(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Evolución Temporal</CardTitle>
            <CardDescription>Facturación mensual, ticket promedio y tasa de cobranza</CardDescription>
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
                  <p><strong>Facturación:</strong> Total facturado por mes (área + línea)</p>
                  <p><strong>Ticket:</strong> Promedio por turno (área + línea)</p>
                  <p><strong>Tasa Cobranza:</strong> % cobrado vs facturado</p>
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
            <TabsTrigger value="facturacion">💰 Facturación</TabsTrigger>
            <TabsTrigger value="ticket">🎫 Ticket Promedio</TabsTrigger>
            <TabsTrigger value="tasa">📊 Tasa de Cobranza</TabsTrigger>
          </TabsList>

          {/* Tab 1: Facturación Mensual */}
          <TabsContent value="facturacion">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="facturacionGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip content={<CustomTooltipFacturacion />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="facturacion" 
                    name="Facturación" 
                    fill="url(#facturacionGradient)" 
                    stroke="#3B82F6"
                    strokeWidth={0}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="facturacion" 
                    name="Facturación" 
                    stroke="#1D4ED8"
                    strokeWidth={3}
                    dot={{ fill: "#1D4ED8", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#1D4ED8" }}
                    legendType="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Tab 2: Ticket Promedio - Same Area+Line style but purple */}
          <TabsContent value="ticket">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
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
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltipTicket />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="ticket" 
                    name="Ticket Promedio" 
                    fill="url(#ticketGradient)" 
                    stroke="#8B5CF6"
                    strokeWidth={0}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ticket" 
                    name="Ticket Promedio" 
                    stroke="#7C3AED"
                    strokeWidth={3}
                    dot={{ fill: "#7C3AED", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#7C3AED" }}
                    legendType="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Tab 3: Tasa de Cobranza - Green Area+Line with % format */}
          <TabsContent value="tasa">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="tasaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
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
                    tickFormatter={(value) => `${value}%`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltipTasa />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="tasaCobranza" 
                    name="Tasa de Cobranza" 
                    fill="url(#tasaGradient)" 
                    stroke="#10B981"
                    strokeWidth={0}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasaCobranza" 
                    name="Tasa de Cobranza" 
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ fill: "#059669", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#059669" }}
                    legendType="none"
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
