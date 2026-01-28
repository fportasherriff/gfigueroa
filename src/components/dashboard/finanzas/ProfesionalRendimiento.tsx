import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import type { FinanzasPorProfesional } from '@/types/dashboard';

interface ProfesionalRendimientoProps {
  data: FinanzasPorProfesional[];
  isLoading: boolean;
}

export const ProfesionalRendimiento = ({ data, isLoading }: ProfesionalRendimientoProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de profesionales"
            description="No hay información de rendimiento disponible."
          />
        </CardContent>
      </Card>
    );
  }

  // Filter to those with revenue and take top 10 for chart
  const dataWithRevenue = data.filter(p => Number(p.revenue_generado) > 0);
  const chartData = dataWithRevenue.slice(0, 10);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="font-medium text-foreground mb-2">{d.profesional}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue:</span>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Rendimiento por Profesional</CardTitle>
            <CardDescription>Revenue generado y tasa de facturación</CardDescription>
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
                  <p>Revenue: Total facturado por profesional</p>
                  <p>Turnos $: Cantidad de turnos con facturación</p>
                  <p>Ticket: Promedio por turno facturado</p>
                  <p>Tasa Fact.: % de turnos que generaron revenue</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Turnos $</TableHead>
                  <TableHead className="text-right">Ticket</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataWithRevenue.slice(0, 10).map((prof) => (
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
                      {(prof.tasa_facturacion_pct || 0).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
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
                  tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue_generado" 
                  fill="hsl(221, 83%, 53%)" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
