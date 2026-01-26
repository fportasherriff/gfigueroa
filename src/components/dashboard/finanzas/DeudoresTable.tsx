import { useState } from 'react';
import { Copy, Download, Info, MessageCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { TableSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrencyFull, getRiskBadgeColor, getPriorityBadgeColor, getDaysColor } from '@/lib/formatters';
import type { FinanzasDeudores } from '@/types/dashboard';
import { toast } from 'sonner';

interface DeudoresTableProps {
  data: FinanzasDeudores[];
  isLoading: boolean;
}

export const DeudoresTable = ({ data, isLoading }: DeudoresTableProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id_cliente)));
    }
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast.success('Teléfono copiado');
  };

  const exportCSV = () => {
    const selectedData = data.filter(d => selectedIds.has(d.id_cliente));
    const headers = ['Nombre', 'Teléfono', 'Email', 'Deuda', 'LTV', 'Días sin pago', 'Riesgo', 'Prioridad'];
    const rows = selectedData.map(d => [
      d.nombre_completo,
      d.telefono,
      d.email,
      d.deuda_total,
      d.ltv,
      d.dias_desde_ultimo_pago,
      d.segmento_riesgo,
      d.prioridad_contacto,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deudores.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selectedData.length} deudores exportados`);
  };

  if (isLoading) {
    return <TableSkeleton rows={10} />;
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin deudores"
            description="¡Excelente! No hay clientes con deuda pendiente."
          />
        </CardContent>
      </Card>
    );
  }

  const getPriorityIcon = (prioridad: string) => {
    switch (prioridad) {
      case 'Crítica': return '🔴';
      case 'Alta': return '🟠';
      case 'Media': return '🟡';
      default: return '⚪';
    }
  };

  const getRiskIcon = (riesgo: string) => {
    switch (riesgo) {
      case 'Alto': return '🔴';
      case 'Medio': return '🟡';
      default: return '🟢';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">TOP 20 Deudores</CardTitle>
            <CardDescription>Clientes con mayor deuda pendiente</CardDescription>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
              </span>
              <Button size="sm" variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.size === data.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-right">Deuda</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    LTV
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">Lifetime Value</p>
                        <p className="text-xs text-muted-foreground">
                          Total histórico facturado del cliente
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="text-center">Días</TableHead>
                <TableHead className="text-center">Riesgo</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    Prioridad
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-2">Criterios de Prioridad:</p>
                        <ul className="text-xs space-y-1">
                          <li>🔴 Crítica: Deuda alta + LTV alto + Cliente activo</li>
                          <li>🟠 Alta: Deuda &gt;$500K o &gt;60 días sin pago</li>
                          <li>🟡 Media: Deuda $200-500K o 30-60 días</li>
                          <li>⚪ Baja: Deuda &lt;$200K y &lt;30 días</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id_cliente} className="group">
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(row.id_cliente)}
                      onCheckedChange={() => toggleSelection(row.id_cliente)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.nombre_completo}</p>
                      {row.ultimo_procedimiento && (
                        <p className="text-xs text-muted-foreground">{row.ultimo_procedimiento}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{row.telefono || 'N/A'}</span>
                      {row.telefono && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`https://wa.me/54${row.telefono.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MessageCircle className="h-3.5 w-3.5 text-white" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enviar WhatsApp a {row.nombre_completo}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyPhone(row.telefono)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-red-600">
                    {formatCurrencyFull(row.deuda_total)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatCurrencyFull(row.ltv)}
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getDaysColor(row.dias_desde_ultimo_pago)}`}>
                    {row.dias_desde_ultimo_pago ?? 'N/A'}d
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getRiskBadgeColor(row.segmento_riesgo)}>
                      {getRiskIcon(row.segmento_riesgo)} {row.segmento_riesgo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getPriorityBadgeColor(row.prioridad_contacto)}>
                      {getPriorityIcon(row.prioridad_contacto)} {row.prioridad_contacto}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
