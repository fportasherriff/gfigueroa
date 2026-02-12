import { Info, BarChart3 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency, getTasaColor } from '@/lib/formatters';
import type { ComercialCanales } from '@/types/dashboard';

interface CanalesTableProps {
  data: ComercialCanales[];
  isLoading: boolean;
}

export const CanalesTable = ({ data, isLoading }: CanalesTableProps) => {
  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de canales"
            description="No hay datos de rendimiento por canal disponibles."
          />
        </CardContent>
      </Card>
    );
  }

  // Aggregate by origen
  const aggregated = data.reduce((acc, d) => {
    if (!acc[d.origen]) {
      acc[d.origen] = {
        origen: d.origen,
        leads: 0,
        convertidos: 0,
        conRevenue: 0,
        revenue: 0,
        activos: 0,
      };
    }
    acc[d.origen].leads += Number(d.leads_generados || 0);
    acc[d.origen].convertidos += Number(d.clientes_convertidos || 0);
    acc[d.origen].conRevenue += Number(d.clientes_con_revenue || 0);
    acc[d.origen].revenue += Number(d.revenue_generado || 0);
    acc[d.origen].activos += Number(d.clientes_activos_mes || 0);
    return acc;
  }, {} as Record<string, any>);

  const tableData = Object.values(aggregated)
    .map((row: any) => ({
      ...row,
      tasaConversion: row.leads > 0 ? (row.convertidos / row.leads) * 100 : 0,
      revenuePorLead: row.leads > 0 ? row.revenue / row.leads : 0,
      revenuePorCliente: row.convertidos > 0 ? row.revenue / row.convertidos : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Rendimiento por Canal</CardTitle>
            <CardDescription>
              Métricas de conversión y revenue por origen de leads
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-semibold mb-2">¿Para qué sirve?</p>
              <p className="text-xs text-muted-foreground">
                Compara el rendimiento de cada canal de adquisición para optimizar inversión en marketing y esfuerzo comercial.
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-1 rounded">
                Conv% = (convertidos / leads) × 100 | Rev/Lead = revenue / leads
              </p>
              <p className="text-xs text-blue-600 mt-2 font-mono">
                📊 Vista: dashboard.comercial_canales
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Convertidos</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  Conv %
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>% de leads que realizaron al menos una consulta</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="text-right">Revenue Total</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  Rev/Lead
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Revenue promedio por lead (incluye no convertidos)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="text-right">Rev/Cliente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.origen}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{row.origen || 'Sin origen'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatNumber(row.leads)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatNumber(row.convertidos)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getTasaColor(row.tasaConversion, { good: 30, warning: 15 })}`}>
                    {formatPercent(row.tasaConversion)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(row.revenue)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCurrency(row.revenuePorLead)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCurrency(row.revenuePorCliente)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
