import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrency } from '@/lib/formatters';
import type { FinanzasPorProcedimiento } from '@/types/dashboard';

interface TopProcedimientosProps {
  data: FinanzasPorProcedimiento[];
  isLoading: boolean;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#06B6D4', '#84CC16'
];

export const TopProcedimientos = ({ data, isLoading }: TopProcedimientosProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de procedimientos"
            description="No hay información de procedimientos disponible."
          />
        </CardContent>
      </Card>
    );
  }

  // Take top 10
  const topData = data.slice(0, 10);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="font-medium text-foreground mb-2 text-sm">{d.procedimiento}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue:</span>
            <span className="font-medium">{formatCurrency(d.revenue_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Veces:</span>
            <span>{d.veces_realizado}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Precio prom:</span>
            <span>{formatCurrency(d.precio_promedio)}</span>
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
            <CardTitle className="text-lg">Top 10 Procedimientos por Revenue</CardTitle>
            <CardDescription>Servicios más rentables</CardDescription>
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
                <p className="text-xs">
                  Identifica qué procedimientos generan mayor facturación 
                  para enfocar esfuerzos comerciales y optimizar agenda.
                </p>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  Vista: finanzas_por_procedimiento
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="revenue_total"
                  nameKey="procedimiento"
                  label={({ procedimiento, percent }) => 
                    `${procedimiento.substring(0, 12)}... (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {topData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Procedimiento</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Veces</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topData.map((proc, index) => (
                  <TableRow key={proc.procedimiento}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[150px]" title={proc.procedimiento}>
                        {proc.procedimiento}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(proc.revenue_total)}
                    </TableCell>
                    <TableCell className="text-right">{proc.veces_realizado}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(proc.precio_promedio)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
