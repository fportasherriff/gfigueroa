import { useState, useMemo } from 'react';
import { Phone, Mail, MessageSquare, Copy, Download, Info, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import type { FinanzasRecuperoMaster } from '@/types/dashboard';

interface ClientesRecuperoTableProps {
  data: FinanzasRecuperoMaster[];
  isLoading: boolean;
}

const RIESGO_BADGE: Record<string, string> = {
  'Alto': 'bg-red-100 text-red-800 border-red-300',
  'Medio': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Bajo': 'bg-green-100 text-green-800 border-green-300'
};

const PRIORIDAD_BADGE: Record<string, string> = {
  'Crítica': 'bg-red-600 text-white',
  'Alta': 'bg-orange-500 text-white',
  'Media': 'bg-yellow-500 text-white',
  'Baja': 'bg-slate-400 text-white'
};

type SortField = 'saldo_total' | 'ltv' | 'dias_desde_ultima_visita' | 'ratio_deuda_ltv_pct' | 'segmento_riesgo' | 'prioridad_contacto';
type SortDirection = 'asc' | 'desc';

const RIESGO_ORDER: Record<string, number> = { 'Alto': 3, 'Medio': 2, 'Bajo': 1 };
const PRIORIDAD_ORDER: Record<string, number> = { 'Crítica': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };

const generarScript = (cliente: FinanzasRecuperoMaster) => {
  const nombreCompleto = cliente.nombre_completo || '';
  const partes = nombreCompleto.includes(',') 
    ? nombreCompleto.split(',') 
    : nombreCompleto.split(' ');
  const nombre = partes.length > 1 ? partes[1]?.trim() : partes[0]?.trim();
  const deuda = (Number(cliente.saldo_total) / 1000).toFixed(0);
  const dias = cliente.dias_desde_ultima_visita;
  const ltv = (Number(cliente.ltv) / 1000).toFixed(0);

  if (cliente.tipo_mensaje === 'premium') {
    return `Hola ${nombre}, te contacto de Centro Ghigi Figueroa. 

Como cliente Premium con más de $${ltv}K en tratamientos, queremos asegurarnos de que tu experiencia siga siendo excepcional.

Veo que tenés un saldo pendiente de $${deuda}K desde hace ${dias} días. ¿Te gustaría que coordinemos un plan de pagos personalizado para regularizar tu cuenta?

También podemos agendar tu próxima consulta para dar continuidad a tus tratamientos.

¿Cuándo te vendría bien que hablemos?`;
  } 
  else if (cliente.tipo_mensaje === 'alto_valor') {
    return `Hola ${nombre}, soy del equipo de Centro Ghigi Figueroa.

Te escribo porque tenés un saldo pendiente de $${deuda}K desde hace ${dias} días. Como cliente valorado con $${ltv}K en tratamientos, queremos ofrecerte facilidades de pago.

¿Te gustaría que coordinemos opciones de financiación o un plan de cuotas?

Quedamos atentos a tu respuesta.`;
  }
  else {
    return `Hola ${nombre}, te contacto de Centro Ghigi Figueroa.

Te escribimos para recordarte que tenés un saldo pendiente de $${deuda}K. Queremos ayudarte a regularizar tu cuenta.

¿Podemos coordinar un pago o establecer un plan de cuotas?

Gracias por tu atención.`;
  }
};

export const ClientesRecuperoTable = ({ data, isLoading }: ClientesRecuperoTableProps) => {
  const [selectedCliente, setSelectedCliente] = useState<FinanzasRecuperoMaster | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('saldo_total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [riesgoFilter, setRiesgoFilter] = useState<string>('all');
  const [prioridadFilter, setPrioridadFilter] = useState<string>('all');
  const itemsPerPage = 50;

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.nombre_completo?.toLowerCase().includes(term) ||
        c.telefono?.includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }

    // Riesgo filter
    if (riesgoFilter !== 'all') {
      filtered = filtered.filter(c => c.segmento_riesgo === riesgoFilter);
    }

    // Prioridad filter
    if (prioridadFilter !== 'all') {
      filtered = filtered.filter(c => c.prioridad_contacto === prioridadFilter);
    }

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortField === 'segmento_riesgo') {
        const aVal = RIESGO_ORDER[a.segmento_riesgo] || 0;
        const bVal = RIESGO_ORDER[b.segmento_riesgo] || 0;
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      }
      if (sortField === 'prioridad_contacto') {
        const aVal = PRIORIDAD_ORDER[a.prioridad_contacto] || 0;
        const bVal = PRIORIDAD_ORDER[b.prioridad_contacto] || 0;
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      }
      const aVal = Number(a[sortField]) || 0;
      const bVal = Number(b[sortField]) || 0;
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [data, searchTerm, sortField, sortDirection, riesgoFilter, prioridadFilter]);

  // Paginate
  const paginatedData = processedData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
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

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast({ title: "Teléfono copiado", description: phone });
  };

  const handleOpenScript = (cliente: FinanzasRecuperoMaster) => {
    setSelectedCliente(cliente);
    setShowScriptModal(true);
  };

  const handleCopyScript = () => {
    if (selectedCliente) {
      const script = generarScript(selectedCliente);
      navigator.clipboard.writeText(script);
      toast({ title: "Mensaje copiado", description: "Script listo para enviar" });
    }
  };

  const handleWhatsApp = () => {
    if (selectedCliente?.telefono) {
      const script = generarScript(selectedCliente);
      const phone = selectedCliente.telefono.replace(/\D/g, '');
      const url = `https://wa.me/54${phone}?text=${encodeURIComponent(script)}`;
      window.open(url, '_blank');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Cliente', 'Deuda Total', 'TQP', 'LTV', 'Ratio %', 'Días', 'Riesgo', 'Prioridad', 'Teléfono', 'Email'];
    const rows = processedData.map(c => [
      c.nombre_completo,
      c.saldo_total,
      c.deuda_tqp,
      c.ltv,
      c.ratio_deuda_ltv_pct?.toFixed(1) || '',
      c.dias_desde_ultima_visita,
      c.segmento_riesgo,
      c.prioridad_contacto,
      c.telefono,
      c.email
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes-deuda-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "CSV exportado", description: `${processedData.length} clientes exportados` });
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
    <>
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Clientes con Deuda</CardTitle>
              <CardDescription>{processedData.length} clientes ordenados por saldo total</CardDescription>
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
                      Lista detallada de clientes con deuda pendiente, con acciones de contacto rápido (WhatsApp, teléfono, email) y scripts personalizados.
                    </p>
                    <p className="text-xs font-medium mt-2 mb-1">¿Cómo usar?</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>• Click en columnas para ordenar</p>
                      <p>• Buscar por nombre, teléfono o email</p>
                      <p>• Click en 💬 para ver script de contacto</p>
                      <p>• Exportar a CSV para análisis offline</p>
                    </div>
                    <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-border font-mono">
                      📊 Vista: dashboard.finanzas_recupero_master
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
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-40"
            />
            <Select value={riesgoFilter} onValueChange={setRiesgoFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Riesgo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo Riesgo</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
                <SelectItem value="Medio">Medio</SelectItem>
                <SelectItem value="Bajo">Bajo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda Prioridad</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Cliente</TableHead>
                <TableHead className="text-right w-[90px]">
                  <SortButton field="saldo_total" label="Deuda" />
                </TableHead>
                <TableHead className="text-right w-[80px]">
                  <SortButton field="ltv" label="LTV" />
                </TableHead>
                <TableHead className="text-center w-[50px]">
                  <SortButton field="dias_desde_ultima_visita" label="Días" />
                </TableHead>
                <TableHead className="text-center w-[70px]">
                  <SortButton field="segmento_riesgo" label="Riesgo" />
                </TableHead>
                <TableHead className="text-center w-[80px]">
                  <SortButton field="prioridad_contacto" label="Prior." />
                </TableHead>
                <TableHead className="text-center w-[90px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-validation="dashboard.finanzas_deudores.COUNT">
              {paginatedData.map((cliente) => (
                <TableRow key={cliente.id_cliente} className="hover:bg-muted/50">
                  <TableCell className="font-medium py-2">
                    <div className="truncate max-w-[150px]" title={cliente.nombre_completo}>
                      {cliente.nombre_completo}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 font-semibold text-red-600">
                    {formatCurrency(cliente.saldo_total)}
                  </TableCell>
                  <TableCell className="text-right py-2 text-blue-600">
                    {formatCurrency(cliente.ltv)}
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <span className={cliente.dias_desde_ultima_visita > 60 ? 'text-red-600 font-bold' : ''}>
                      {cliente.dias_desde_ultima_visita}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <Badge variant="outline" className={`text-xs ${RIESGO_BADGE[cliente.segmento_riesgo]}`}>
                      {cliente.segmento_riesgo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <Badge className={`text-xs ${PRIORIDAD_BADGE[cliente.prioridad_contacto]}`}>
                      {cliente.prioridad_contacto}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex items-center justify-center gap-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopyPhone(cliente.telefono)}
                        title="Copiar teléfono"
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(`mailto:${cliente.email}`, '_blank')}
                        title="Enviar email"
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-green-700"
                        onClick={() => handleOpenScript(cliente)}
                        title="Ver script de contacto"
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, processedData.length)} de {processedData.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Script Modal */}
      <Dialog open={showScriptModal} onOpenChange={setShowScriptModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Script de Contacto</DialogTitle>
            <DialogDescription>
              Mensaje personalizado para {selectedCliente?.nombre_completo}
            </DialogDescription>
          </DialogHeader>

          {selectedCliente && (
            <div className="space-y-4">
              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">Deuda Total:</span>
                  <p className="font-semibold text-red-600">{formatCurrency(selectedCliente.saldo_total)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Días sin visita:</span>
                  <p className="font-semibold">{selectedCliente.dias_desde_ultima_visita}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">LTV:</span>
                  <p className="font-semibold text-blue-600">{formatCurrency(selectedCliente.ltv)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Segmento:</span>
                  <Badge className={PRIORIDAD_BADGE[selectedCliente.prioridad_contacto]}>
                    {selectedCliente.prioridad_contacto}
                  </Badge>
                </div>
              </div>

              {/* Script */}
              <div className="p-4 border rounded-lg bg-card">
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {generarScript(selectedCliente)}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleCopyScript}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Mensaje
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleWhatsApp}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar por WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
