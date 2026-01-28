import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Phone, Mail, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { toast } from '@/hooks/use-toast';
import type { FinanzasRecuperoMaster } from '@/types/dashboard';

interface MatrizRiesgoCardsProps {
  data: FinanzasRecuperoMaster[];
  isLoading: boolean;
}

interface SegmentData {
  cantidad: number;
  deudaTotal: number;
  deudaPromedio: number;
  clientes: FinanzasRecuperoMaster[];
}

type SegmentKey = 'premiumActivos' | 'premiumRiesgo' | 'mediosActivos' | 'criticosInactivos';

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
    return `Hola ${nombre}, te contacto de Centro Ghigi Figueroa.\n\nComo cliente Premium con más de $${ltv}K en tratamientos, queremos asegurarnos de que tu experiencia siga siendo excepcional.\n\nVeo que tenés un saldo pendiente de $${deuda}K desde hace ${dias} días. ¿Te gustaría que coordinemos un plan de pagos personalizado?\n\n¿Cuándo te vendría bien que hablemos?`;
  } 
  else if (cliente.tipo_mensaje === 'alto_valor') {
    return `Hola ${nombre}, soy del equipo de Centro Ghigi Figueroa.\n\nTe escribo porque tenés un saldo pendiente de $${deuda}K desde hace ${dias} días. Como cliente valorado, queremos ofrecerte facilidades de pago.\n\n¿Te gustaría que coordinemos opciones de financiación?`;
  }
  return `Hola ${nombre}, te contacto de Centro Ghigi Figueroa.\n\nTe recordamos que tenés un saldo pendiente de $${deuda}K. ¿Podemos coordinar un pago o establecer un plan de cuotas?\n\nGracias por tu atención.`;
};

export const MatrizRiesgoCards = ({ data, isLoading }: MatrizRiesgoCardsProps) => {
  const [selectedSegment, setSelectedSegment] = useState<SegmentKey | null>(null);

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Segment clients into risk matrix
  const segmentos = {
    premiumActivos: data.filter(c => 
      Number(c.ltv) >= 1000000 && c.dias_desde_ultima_visita <= 30
    ),
    premiumRiesgo: data.filter(c => 
      Number(c.ltv) >= 1000000 && c.dias_desde_ultima_visita > 30 && c.dias_desde_ultima_visita <= 90
    ),
    mediosActivos: data.filter(c => 
      Number(c.ltv) >= 200000 && Number(c.ltv) < 1000000 && c.dias_desde_ultima_visita <= 60
    ),
    criticosInactivos: data.filter(c => 
      c.dias_desde_ultima_visita > 90
    )
  };

  const calcSegmentData = (clients: FinanzasRecuperoMaster[]): SegmentData => ({
    cantidad: clients.length,
    deudaTotal: clients.reduce((sum, c) => sum + Number(c.saldo_total), 0),
    deudaPromedio: clients.length > 0 
      ? clients.reduce((sum, c) => sum + Number(c.saldo_total), 0) / clients.length 
      : 0,
    clientes: clients
  });

  const segmentosData: Record<SegmentKey, SegmentData> = {
    premiumActivos: calcSegmentData(segmentos.premiumActivos),
    premiumRiesgo: calcSegmentData(segmentos.premiumRiesgo),
    mediosActivos: calcSegmentData(segmentos.mediosActivos),
    criticosInactivos: calcSegmentData(segmentos.criticosInactivos)
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast({ title: "Teléfono copiado", description: phone });
  };

  const handleWhatsApp = (cliente: FinanzasRecuperoMaster) => {
    const script = generarScript(cliente);
    const phone = (cliente.telefono || '').replace(/\D/g, '');
    const url = `https://wa.me/54${phone}?text=${encodeURIComponent(script)}`;
    window.open(url, '_blank');
  };

  const segmentConfig: Record<SegmentKey, { 
    title: string; 
    subtitle: string; 
    borderColor: string; 
    textColor: string;
    footer: string;
    emoji: string;
  }> = {
    premiumActivos: {
      title: '🟢 Premium Activos',
      subtitle: 'LTV ≥$1M • Última visita ≤30 días',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
      footer: '✓ Alto valor • Buen engagement • Proteger relación',
      emoji: '🟢'
    },
    premiumRiesgo: {
      title: '🟡 Premium En Riesgo',
      subtitle: 'LTV ≥$1M • Última visita 31-90 días',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
      footer: '⚠️ Alto valor • Inactividad creciente • Contactar esta semana',
      emoji: '🟡'
    },
    mediosActivos: {
      title: '🔵 Medios Activos',
      subtitle: 'LTV $200K-$1M • Última visita ≤60 días',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
      footer: 'ℹ️ Valor medio • Buen engagement • Seguimiento normal',
      emoji: '🔵'
    },
    criticosInactivos: {
      title: '🔴 Críticos Inactivos',
      subtitle: 'Cualquier LTV • Última visita >90 días',
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
      footer: '🔥 ALTO RIESGO • Contactar HOY • Recupero difícil',
      emoji: '🔴'
    }
  };

  const selectedData = selectedSegment ? segmentosData[selectedSegment] : null;
  const selectedConfig = selectedSegment ? segmentConfig[selectedSegment] : null;

  return (
    <>
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Matriz de Riesgo</CardTitle>
              <CardDescription>Segmentación por LTV y actividad • Click para ver clientes</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-semibold mb-2">¿Cómo interpretar?</p>
                  <div className="space-y-1 text-xs">
                    <p>🟢 Premium Activos: Proteger y fidelizar</p>
                    <p>🟡 Premium Riesgo: Recuperar urgente</p>
                    <p>🔵 Medios Activos: Mantener engagement</p>
                    <p>🔴 Críticos Inactivos: Acción inmediata</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                    Vista: finanzas_recupero_master
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(segmentConfig) as SegmentKey[]).map((key) => {
              const config = segmentConfig[key];
              const data = segmentosData[key];
              
              return (
                <Card 
                  key={key}
                  className={`border-2 ${config.borderColor} bg-white cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]`}
                  onClick={() => setSelectedSegment(key)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-semibold ${config.textColor}`}>
                      {config.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {config.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className={`text-4xl font-bold ${config.textColor}`}>
                        {data.cantidad}
                      </span>
                      <span className="text-sm text-muted-foreground">clientes</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deuda Total:</span>
                        <span className="font-medium">{formatCurrency(data.deudaTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Promedio:</span>
                        <span className="font-medium">{formatCurrency(data.deudaPromedio)}</span>
                      </div>
                    </div>
                    <p className="text-xs mt-3 pt-2 border-t border-border text-muted-foreground">
                      {config.footer}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal for segment clients */}
      <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedConfig?.emoji}</span>
              {selectedConfig?.title.replace(selectedConfig.emoji, '').trim()}
            </DialogTitle>
            <DialogDescription>
              {selectedData?.cantidad} clientes • Click en WhatsApp para enviar mensaje
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {selectedData?.clientes.slice(0, 20).map((cliente) => (
              <Card key={cliente.id_cliente} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold truncate max-w-[250px]">{cliente.nombre_completo}</p>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Deuda:</span>
                        <p className="font-medium text-red-600">{formatCurrency(cliente.saldo_total)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">LTV:</span>
                        <p className="font-medium text-blue-600">{formatCurrency(cliente.ltv)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Días:</span>
                        <p className="font-medium">{cliente.dias_desde_ultima_visita}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ratio:</span>
                        <p className="font-medium">{cliente.ratio_deuda_ltv_pct?.toFixed(1) || '-'}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyPhone(cliente.telefono)}
                      title="Copiar teléfono"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`mailto:${cliente.email}`, '_blank')}
                      title="Enviar email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleWhatsApp(cliente)}
                      title="Enviar WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
