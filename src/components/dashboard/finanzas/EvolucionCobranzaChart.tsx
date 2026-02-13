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
  const [activeTab, setActiveTab] = useState('facturacion');

  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Group by month
    const byMonth: Record<string, { facturado: number; turnos: number; turnosAsistidos: number; turnosConRevenue: number }> = {};
    
    data.forEach(row => {
      const mes = row.fecha.substring(0, 7); // YYYY-MM
      if (!byMonth[mes]) {
        byMonth[mes] = { facturado: 0, turnos: 0, turnosAsistidos: 0, turnosConRevenue: 0 };
      }
      byMonth[mes].facturado += Number(row.revenue_facturado) || 0;
      byMonth[mes].turnos += Number(row.turnos_con_revenue) || 0;
      byMonth[mes].turnosAsistidos += Number(row.turnos_asistidos) || 0;
      byMonth[mes].turnosConRevenue += Number(row.turnos_con_revenue) || 0;
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, datos]) => {
        const ticket = datos.turnos > 0 ? datos.facturado / datos.turnos : 0;
        // Tasa de cobranza = (turnos con revenue / turnos asistidos) * 100
        const tasaCobranza = datos.turnosAsistidos > 0 
          ? (datos.turnosConRevenue / datos.turnosAsistidos) * 100 
          : 0;
        // Cobrado estimado = facturado * tasa
        const cobrado = datos.facturado * (tasaCobranza / 100);
        return {
          mes,
          facturacion: datos.facturado,
          cobrado,
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

    // Filter to avoid duplicates (Area and Line with same dataKey)
    const seen = new Set<string>();
    const uniquePayload = payload.filter((entry: any) => {
      if (seen.has(entry.dataKey)) return false;
      seen.add(entry.dataKey);
      return true;
    });

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{formatMonth(label)}</p>
        {uniquePayload.map((entry: any, index: number) => (
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

    const seen = new Set<string>();
    const uniquePayload = payload.filter((entry: any) => {
      if (seen.has(entry.dataKey)) return false;
      seen.add(entry.dataKey);
      return true;
    });

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{formatMonth(label)}</p>
        {uniquePayload.map((entry: any, index: number) => (
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
                <p className="font-semibold mb-2">¿Para qué sirve?</p>
                <p className="text-xs text-muted-foreground">
                  Visualiza la evolución mensual de facturación, ticket promedio y tasa de cobranza para identificar tendencias y estacionalidad.
                </p>
                <p className="text-xs font-medium mt-2 mb-1">¿Cómo se calcula?</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Facturación:</strong> SUM(revenue_facturado) por mes</p>
                  <p><strong>Ticket:</strong> SUM(revenue) / SUM(turnos_con_revenue)</p>
                  <p><strong>Tasa:</strong> (turnos_con_revenue / turnos_asistidos) × 100</p>
                </div>
                <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-border font-mono">
                  📊 Vista: dashboard.finanzas_diario
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
              <ResponsiveContainer width="100%" height="100%" data-validation="dashboard.finanzas_diario.revenue_facturado.SUM">
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

          {/* Tab 3: Cobranza - Bar (Facturado) + Line (Tasa %) */}
          <TabsContent value="tasa">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 50, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="facturadoBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4}/>
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
                    yAxisId="left"
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-foreground mb-2">{formatMonth(label)}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-blue-600">Facturado:</span>
                            <span className="font-medium">${(payload[0]?.value as number / 1000000).toFixed(2)}M</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-green-600">Tasa Cobro:</span>
                            <span className="font-medium">{(payload[1]?.value as number)?.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }} />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="facturacion" 
                    name="Facturado"
                    fill="url(#facturadoBarGradient)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tasaCobranza" 
                    name="Tasa Cobro %"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#10B981" }}
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
