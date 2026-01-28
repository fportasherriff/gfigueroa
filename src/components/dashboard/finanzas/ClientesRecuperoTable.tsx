import { useState } from 'react';
import { Phone, Mail, MessageSquare, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatPercent } from '@/lib/formatters';
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
  'Baja': 'bg-gray-400 text-white'
};

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

  if (isLoading) {
    return (
      <Card>
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

  // Limit to top 20 by debt
  const topClientes = data.slice(0, 20);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clientes con Deuda</CardTitle>
          <CardDescription>Top 20 ordenados por saldo total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Cliente</TableHead>
                  <TableHead className="text-right">Deuda Total</TableHead>
                  <TableHead className="text-right">TQP</TableHead>
                  <TableHead className="text-right">LTV</TableHead>
                  <TableHead className="text-right">Ratio %</TableHead>
                  <TableHead className="text-center">Días</TableHead>
                  <TableHead className="text-center">Riesgo</TableHead>
                  <TableHead className="text-center">Prioridad</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClientes.map((cliente) => (
                  <TableRow key={cliente.id_cliente} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[180px]" title={cliente.nombre_completo}>
                        {cliente.nombre_completo}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(cliente.saldo_total)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(cliente.deuda_tqp)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(cliente.ltv)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cliente.ratio_deuda_ltv_pct != null 
                        ? `${Number(cliente.ratio_deuda_ltv_pct).toFixed(1)}%` 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cliente.dias_desde_ultima_visita > 60 ? 'text-red-600 font-bold' : ''}>
                        {cliente.dias_desde_ultima_visita}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={RIESGO_BADGE[cliente.segmento_riesgo]}>
                        {cliente.segmento_riesgo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={PRIORIDAD_BADGE[cliente.prioridad_contacto]}>
                        {cliente.prioridad_contacto}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyPhone(cliente.telefono)}
                          title="Copiar teléfono"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(`mailto:${cliente.email}`, '_blank')}
                          title="Enviar email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => handleOpenScript(cliente)}
                          title="Ver script de contacto"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
