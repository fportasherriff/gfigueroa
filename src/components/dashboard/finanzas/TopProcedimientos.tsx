import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Info, Download } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrency } from '@/lib/formatters';
import { toast } from '@/hooks/use-toast';
import type { FinanzasPorProcedimiento } from '@/types/dashboard';

interface TopProcedimientosProps {
  data: FinanzasPorProcedimiento[];
  isLoading: boolean;
}

export const TopProcedimientos = ({ data, isLoading }: TopProcedimientosProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data?.length) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de procedimientos"
            description="No hay información de procedimientos disponible."
          />
        </CardContent>
      </Card>
    );
  }

  // Take top 20 and calculate cumulative
  const topData = data.slice(0, 20);
  const totalRevenue = data.reduce((sum, p) => sum + (Number(p.revenue_total) || 0), 0);
  const top3Revenue = topData.slice(0, 3).reduce((sum, p) => sum + (Number(p.revenue_total) || 0), 0);
  const top10Revenue = topData.slice(0, 10).reduce((sum, p) => sum + (Number(p.revenue_total) || 0), 0);

  const dataWithCumulative = useMemo(() => {
    let cumulative = 0;
    return topData.map((proc, index) => {
      cumulative += Number(proc.revenue_total) || 0;
      const pct = totalRevenue > 0 ? ((Number(proc.revenue_total) || 0) / totalRevenue) * 100 : 0;
      const cumulativePct = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
      return {
        ...proc,
        pct,
        cumulativePct
      };
    });
  }, [topData, totalRevenue]);

  const handleExportCSV = () => {
    const headers = ['#', 'Procedimiento', 'Facturación Total', '% Fact', 'Veces', 'Precio Promedio', '% Acumulado'];
    const rows = dataWithCumulative.map((proc, index) => [
      index + 1,
      proc.procedimiento,
      proc.revenue_total,
      proc.pct.toFixed(1),
      proc.veces_realizado,
      proc.precio_promedio,
      proc.cumulativePct.toFixed(1)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `procedimientos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "CSV exportado", description: `${dataWithCumulative.length} procedimientos exportados` });
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Top Procedimientos por Facturación</CardTitle>
            <CardDescription>Servicios más rentables</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-semibold mb-2">¿Para qué sirve?</p>
                  <p className="text-xs text-muted-foreground">
                    Identifica qué procedimientos generan mayor facturación para enfocar esfuerzos comerciales y optimizar agenda.
                  </p>
                  <p className="text-xs font-medium mt-2 mb-1">¿Cómo se calcula?</p>
                  <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded">
                    % = (revenue_procedimiento / revenue_total) × 100 | Acum% = suma acumulada
                  </p>
                  <p className="text-xs text-blue-600 mt-2 font-mono">
                    📊 Vista: dashboard.finanzas_por_procedimiento
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead className="text-right">Facturación Total</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Veces</TableHead>
                <TableHead className="text-right">Precio Prom.</TableHead>
                <TableHead className="w-[150px]">Acum %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataWithCumulative.map((proc, index) => (
                <TableRow key={proc.procedimiento}>
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="truncate max-w-[200px]" title={proc.procedimiento}>
                      {proc.procedimiento}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(proc.revenue_total)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {proc.pct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{proc.veces_realizado}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(proc.precio_promedio)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={proc.cumulativePct} 
                        className={`h-2 ${proc.cumulativePct <= 80 ? '[&>div]:bg-blue-500' : '[&>div]:bg-slate-400'}`}
                      />
                      <span className={`text-xs w-10 ${proc.cumulativePct <= 80 ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                        {proc.cumulativePct.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer Stats */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {((top3Revenue / totalRevenue) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Top 3 concentra</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {((top10Revenue / totalRevenue) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Top 10 concentra</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-600">
              {data.length}
            </p>
            <p className="text-xs text-muted-foreground">Total procedimientos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
