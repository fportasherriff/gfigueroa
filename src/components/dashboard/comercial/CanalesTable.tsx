import { Info, BarChart3 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency } from '@/lib/formatters';
import type { ComercialCanales } from '@/types/dashboard';

interface CanalesTableProps {
  data: ComercialCanales[];
  isLoading: boolean;
}

const PctBadge = ({ value, thresholds }: { value: number; thresholds: { good: number; warn: number } }) => {
  const color =
    value >= thresholds.good ? 'bg-green-100 text-green-700' :
    value >= thresholds.warn ? 'bg-yellow-100 text-yellow-700' :
                               'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${color}`}>
      {formatPercent(value)}
    </span>
  );
};

export const CanalesTable = ({ data, isLoading }: CanalesTableProps) => {
  if (isLoading) return <TableSkeleton rows={5} />;
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Rendimiento por Canal</CardTitle>
            <CardDescription>Qué tan bien convierte cada canal — % sobre el total de clientes de ese canal</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-semibold mb-2">¿Cómo leer esta tabla?</p>
              <p className="text-xs text-muted-foreground">
                Todos los % son sobre el total de clientes de ese canal.
                <br />
                Consulta %: tuvieron al menos 1 turno asistido.
                <br />
                Pago %: al menos 1 turno con monto {'>'} 0.
                <br />
                Recurrente %: 3 o más turnos asistidos.
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
              <TableHead className="text-right">Clientes</TableHead>
              <TableHead className="text-right">Consulta %</TableHead>
              <TableHead className="text-right">Pago %</TableHead>
              <TableHead className="text-right">Recurrente %</TableHead>
              <TableHead className="text-right">Revenue Total</TableHead>
              <TableHead className="text-right">Rev/Cliente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.canal}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{row.canal || 'Sin origen'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{formatNumber(row.total_clientes)}</TableCell>
                <TableCell className="text-right">
                  <PctBadge value={row.pct_con_consulta} thresholds={{ good: 65, warn: 45 }} />
                </TableCell>
                <TableCell className="text-right">
                  <PctBadge value={row.pct_con_pago} thresholds={{ good: 18, warn: 12 }} />
                </TableCell>
                <TableCell className="text-right">
                  <PctBadge value={row.pct_recurrente} thresholds={{ good: 28, warn: 18 }} />
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(row.revenue_total)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCurrency(row.revenue_por_cliente)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
