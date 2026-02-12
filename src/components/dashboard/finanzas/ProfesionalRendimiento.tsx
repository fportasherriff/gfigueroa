import { useState, useMemo } from 'react';
import { ArrowUpDown, Download, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrency } from '@/lib/formatters';
import { toast } from '@/hooks/use-toast';
import type { FinanzasPorProfesional, FinanzasRecuperoMaster } from '@/types/dashboard';

interface ProfesionalRendimientoProps {
  data: FinanzasPorProfesional[];
  clientesData?: FinanzasRecuperoMaster[];
  isLoading: boolean;
}

type SortField = 'profesional' | 'revenue_generado' | 'turnos_facturados' | 'ticket_promedio' | 'tasa_facturacion_pct' | 'participation';
type SortDirection = 'asc' | 'desc';

export const ProfesionalRendimiento = ({ data, clientesData = [], isLoading }: ProfesionalRendimientoProps) => {
  const [sortField, setSortField] = useState<SortField>('revenue_generado');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Memoize derived data
  const { dataWithRevenue, totalRevenue } = useMemo(() => {
    if (!data?.length) return { dataWithRevenue: [], totalRevenue: 0 };
    const filtered = data.filter(p => Number(p.revenue_generado) > 0);
    const total = filtered.reduce((sum, p) => sum + (Number(p.revenue_generado) || 0), 0);
    
    // Add participation field
    const withParticipation = filtered.map(p => ({
      ...p,
      participation: total > 0 ? ((Number(p.revenue_generado) || 0) / total) * 100 : 0
    }));
    
    return {
      dataWithRevenue: withParticipation,
      totalRevenue: total
    };
  }, [data]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!dataWithRevenue.length) return [];
    
    return [...dataWithRevenue].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      
      if (sortField === 'profesional') {
        aVal = a.profesional || '';
        bVal = b.profesional || '';
        return sortDirection === 'desc' 
          ? bVal.localeCompare(aVal as string)
          : (aVal as string).localeCompare(bVal as string);
      }
      
      aVal = Number(a[sortField as keyof typeof a]) || 0;
      bVal = Number(b[sortField as keyof typeof b]) || 0;
      return sortDirection === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
  }, [dataWithRevenue, sortField, sortDirection]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Profesional', 'Facturación', 'Turnos $', 'Ticket', 'Tasa Fact. %', '% Participación'];
    const rows = sortedData.map(p => [
      p.profesional,
      p.revenue_generado,
      p.turnos_facturados,
      p.ticket_promedio,
      p.tasa_facturacion_pct?.toFixed(1) || '',
      p.participation.toFixed(1)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profesionales-rendimiento-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "CSV exportado", description: `${sortedData.length} profesionales exportados` });
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 -ml-2"
      onClick={() => handleSort(field)}
    >
      {label}
      <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  );

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Rendimiento por Profesional</CardTitle>
            <CardDescription>Facturación generada y métricas de rendimiento</CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
                    Compara el rendimiento de facturación de cada profesional para identificar oportunidades de mejora y reconocer top performers.
                  </p>
                  <p className="text-xs font-medium mt-2 mb-1">¿Qué mide cada columna?</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>• Facturación: Total facturado por profesional</p>
                    <p>• Turnos $: Turnos con facturación</p>
                    <p>• Ticket: Promedio por turno facturado</p>
                    <p>• Tasa Fact.: (Turnos con $ / Total Turnos) × 100</p>
                    <p>• % Part.: Participación en facturación total</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-border font-mono">
                    📊 Vista: dashboard.finanzas_por_profesional
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="profesional" label="Profesional" />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="revenue_generado" label="Facturación" />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="turnos_facturados" label="Turnos $" />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="ticket_promedio" label="Ticket" />
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <SortButton field="tasa_facturacion_pct" label="Tasa Fact." />
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
                <TableHead className="w-[150px]">
                  <SortButton field="participation" label="% Part." />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.slice(0, 15).map((prof) => {
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
                            style={{ width: `${Math.min(100, prof.participation)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {prof.participation.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
