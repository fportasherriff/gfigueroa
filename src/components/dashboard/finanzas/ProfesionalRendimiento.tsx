import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import type { FinanzasPorProfesional, FinanzasRecuperoMaster } from '@/types/dashboard';

interface ProfesionalRendimientoProps {
  data: FinanzasPorProfesional[];
  clientesData?: FinanzasRecuperoMaster[];
  isLoading: boolean;
}

export const ProfesionalRendimiento = ({ data, clientesData = [], isLoading }: ProfesionalRendimientoProps) => {
  const [activeTab, setActiveTab] = useState('facturacion');

  // All hooks must be called before any conditional returns
  const debtByProfesional = useMemo(() => {
    if (!clientesData.length) return {};
    const grouped = clientesData.reduce((acc, cliente) => {
      return acc;
    }, {} as Record<string, { deuda: number; clientes: number }>);
    return grouped;
  }, [clientesData]);

  // Memoize derived data
  const { dataWithRevenue, totalRevenue, chartData } = useMemo(() => {
    if (!data?.length) return { dataWithRevenue: [], totalRevenue: 0, chartData: [] };
    const filtered = data.filter(p => Number(p.revenue_generado) > 0);
    const total = filtered.reduce((sum, p) => sum + (Number(p.revenue_generado) || 0), 0);
    return {
      dataWithRevenue: filtered,
      totalRevenue: total,
      chartData: filtered.slice(0, 10)
    };
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data?.length) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de profesionales"
            description="No hay información de rendimiento disponible."
          />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="font-medium text-foreground mb-2">{d.profesional}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Facturación:</span>
            <span className="font-medium">{formatCurrency(d.revenue_generado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Turnos $:</span>
            <span>{d.turnos_facturados}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasa Fact.:</span>
            <span>{d.tasa_facturacion_pct?.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const getRateBadge = (rate: number) => {
    if (rate <= 5) return 'bg-green-100 text-green-800';
    if (rate <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Rendimiento por Profesional</CardTitle>
            <CardDescription>Facturación generada y métricas de rendimiento</CardDescription>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-semibold mb-2">¿Qué mide?</p>
                <div className="space-y-1 text-xs">
                  <p>Facturación: Total facturado por profesional</p>
                  <p>Turnos $: Cantidad de turnos con facturación</p>
                  <p>Ticket: Promedio por turno facturado</p>
                  <p>Tasa Fact.: % de turnos que generaron facturación</p>
                  <p>% Part.: Participación en facturación total</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  Vista: finanzas_por_profesional
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="facturacion">Facturación</TabsTrigger>
            <TabsTrigger value="comparativa">Comparativa</TabsTrigger>
          </TabsList>

          <TabsContent value="facturacion">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead className="text-right">Facturación</TableHead>
                    <TableHead className="text-right">Turnos $</TableHead>
                    <TableHead className="text-right">Ticket</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        Tasa Fact.
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground">
                                <Info className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="font-semibold mb-1">Tasa de Facturación</p>
                              <p className="text-xs text-muted-foreground">
                                Porcentaje de turnos que generaron facturación sobre el total de turnos del profesional.
                              </p>
                              <p className="text-xs mt-2 font-medium">
                                Fórmula: (Turnos con $ / Total Turnos) × 100
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Indica efectividad en convertir consultas en facturación.
                              </p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px]">% Participación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataWithRevenue.slice(0, 15).map((prof) => {
                    const participation = totalRevenue > 0 
                      ? ((Number(prof.revenue_generado) || 0) / totalRevenue) * 100 
                      : 0;
                    const tasaFacturacion = prof.tasa_facturacion_pct || 0;
                    
                    return (
                      <TableRow key={prof.profesional}>
                        <TableCell className="font-medium">{prof.profesional}</TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {formatCurrency(prof.revenue_generado || 0)}
                        </TableCell>
                        <TableCell className="text-right">{prof.turnos_facturados}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(prof.ticket_promedio || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="w-full">
                            <div className="text-xs text-muted-foreground mb-1 text-right">
                              {tasaFacturacion.toFixed(1)}%
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, tasaFacturacion)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, participation)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {participation.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="comparativa">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={chartData} 
                  layout="vertical"
                  margin={{ top: 10, right: 50, left: 80, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    type="category"
                    dataKey="profesional"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={70}
                    tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="revenue_generado" 
                    name="Facturación"
                    fill="#3B82F6" 
                    radius={[0, 4, 4, 0]}
                  />
                  <Line 
                    dataKey="tasa_facturacion_pct"
                    name="Tasa Fact. %"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
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
