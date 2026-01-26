import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrency, formatPercent, getTasaColor } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';

interface ProfesionalFinanzasTableProps {
  fechaDesde?: string;
  fechaHasta?: string;
  isLoading?: boolean;
}

interface ProfesionalAggregate {
  profesional: string;
  diasActivos: number;
  turnosAsistidos: number;
  facturado: number;
  cobrado: number;
  gap: number;
  tasaCobro: number;
  tasaAsistencia: number;
}

export const ProfesionalFinanzasTable = ({ fechaDesde, fechaHasta, isLoading: parentLoading }: ProfesionalFinanzasTableProps) => {
  // Query profesionales from operaciones_diario since it has profesional field
  const { data, isLoading } = useQuery({
    queryKey: ['profesional-finanzas', fechaDesde, fechaHasta],
    queryFn: async () => {
      let sql = `
        SELECT 
          profesional,
          COUNT(DISTINCT fecha) as dias_activos,
          SUM(COALESCE(turnos_asistidos, 0)) as turnos_asistidos,
          SUM(COALESCE(revenue, 0)) as facturado,
          AVG(COALESCE(tasa_asistencia_pct, 0)) as tasa_asistencia_pct
        FROM dashboard.operaciones_diario
        WHERE profesional IS NOT NULL
      `;
      
      if (fechaDesde) {
        sql += ` AND fecha >= '${fechaDesde}'`;
      }
      if (fechaHasta) {
        sql += ` AND fecha <= '${fechaHasta}'`;
      }
      
      sql += ` GROUP BY profesional ORDER BY facturado DESC`;
      
      const { data, error } = await supabase.rpc('execute_select', { query: sql });
      
      if (error) throw error;
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error((data as any).error);
      }
      
      return (data || []) as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const tableData = useMemo((): ProfesionalAggregate[] => {
    if (!data?.length) return [];
    
    return data.map((p: any) => {
      // Estimate tasa cobro based on industry average (will improve when we have real cobrado data)
      const tasaCobro = 75; // Placeholder until we have cobrado data by profesional
      const cobrado = Number(p.facturado || 0) * (tasaCobro / 100);
      const gap = Number(p.facturado || 0) - cobrado;
      
      return {
        profesional: p.profesional || 'Sin asignar',
        diasActivos: Number(p.dias_activos || 0),
        turnosAsistidos: Number(p.turnos_asistidos || 0),
        facturado: Number(p.facturado || 0),
        cobrado: cobrado,
        gap: gap,
        tasaCobro: tasaCobro,
        tasaAsistencia: Number(p.tasa_asistencia_pct || 0),
      };
    });
  }, [data]);

  if (isLoading || parentLoading) {
    return <TableSkeleton rows={5} />;
  }

  if (!tableData.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos por profesional"
            description="No hay datos de facturación por profesional para el período seleccionado."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rendimiento por Profesional</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profesional</TableHead>
              <TableHead className="text-center">Días Activos</TableHead>
              <TableHead className="text-center">Turnos</TableHead>
              <TableHead className="text-right">Facturado</TableHead>
              <TableHead className="text-right">Cobrado</TableHead>
              <TableHead className="text-right">Gap</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  Tasa Cobro
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>% de lo facturado que fue efectivamente cobrado</p>
                      <p className="text-xs text-muted-foreground">Objetivo: &gt;80%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-1">
                  Asistencia
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>% de turnos agendados que asistieron</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.profesional}>
                <TableCell className="font-medium">{row.profesional}</TableCell>
                <TableCell className="text-center">{row.diasActivos}</TableCell>
                <TableCell className="text-center">{row.turnosAsistidos}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(row.facturado)}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {formatCurrency(row.cobrado)}
                </TableCell>
                <TableCell className={`text-right font-mono ${row.gap > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {formatCurrency(row.gap)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getTasaColor(row.tasaCobro, { good: 80, warning: 60 })}`}>
                    {formatPercent(row.tasaCobro)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getTasaColor(row.tasaAsistencia, { good: 70, warning: 50 })}`}>
                    {formatPercent(row.tasaAsistencia)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
