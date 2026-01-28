import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const SEGMENT_COLORS: Record<SegmentKey, string> = {
  premiumActivos: '#10B981',
  premiumRiesgo: '#F59E0B',
  mediosActivos: '#3B82F6',
  criticosInactivos: '#EF4444'
};

export const MatrizRiesgoCards = ({ data, isLoading }: MatrizRiesgoCardsProps) => {
  const [selectedSegment, setSelectedSegment] = useState<SegmentKey | null>(null);

  // Segment clients into risk matrix
  const { segmentosData, totalClientes, donutData } = useMemo(() => {
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

    const segmentosDataCalc: Record<SegmentKey, SegmentData> = {
      premiumActivos: calcSegmentData(segmentos.premiumActivos),
      premiumRiesgo: calcSegmentData(segmentos.premiumRiesgo),
      mediosActivos: calcSegmentData(segmentos.mediosActivos),
      criticosInactivos: calcSegmentData(segmentos.criticosInactivos)
    };

    const total = Object.values(segmentosDataCalc).reduce((sum, s) => sum + s.cantidad, 0);

    const donut = [
      { name: 'Premium Activos', value: segmentosDataCalc.premiumActivos.cantidad, color: SEGMENT_COLORS.premiumActivos },
      { name: 'Premium Riesgo', value: segmentosDataCalc.premiumRiesgo.cantidad, color: SEGMENT_COLORS.premiumRiesgo },
      { name: 'Medios Activos', value: segmentosDataCalc.mediosActivos.cantidad, color: SEGMENT_COLORS.mediosActivos },
      { name: 'Críticos Inactivos', value: segmentosDataCalc.criticosInactivos.cantidad, color: SEGMENT_COLORS.criticosInactivos },
    ];

    return { segmentosData: segmentosDataCalc, totalClientes: total, donutData: donut };
  }, [data]);

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
    criteria: string;
    borderColor: string; 
    textColor: string;
    footer: string;
    emoji: string;
  }> = {
    premiumActivos: {
      title: '🟢 Premium Activos',
      subtitle: 'LTV ≥$1M • Última visita ≤30 días',
      criteria: 'Clientes con LTV mayor o igual a $1 millón y que visitaron en los últimos 30 días. Incluye clientes con o sin deuda.',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
      footer: '✓ Alto valor • Buen engagement • Proteger relación',
      emoji: '🟢'
    },
    premiumRiesgo: {
      title: '🟡 Premium En Riesgo',
      subtitle: 'LTV ≥$1M • Última visita 31-90 días',
      criteria: 'Clientes con LTV mayor o igual a $1 millón pero con inactividad de 31 a 90 días. Incluye clientes con o sin deuda.',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
      footer: '⚠️ Alto valor • Inactividad creciente • Contactar esta semana',
      emoji: '🟡'
    },
    mediosActivos: {
      title: '🔵 Medios Activos',
      subtitle: 'LTV $200K-$1M • Última visita ≤60 días',
      criteria: 'Clientes con LTV entre $200K y $1M que visitaron en los últimos 60 días. Incluye clientes con o sin deuda.',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
      footer: 'ℹ️ Valor medio • Buen engagement • Seguimiento normal',
      emoji: '🔵'
    },
    criticosInactivos: {
      title: '🔴 Críticos Inactivos',
      subtitle: 'Cualquier LTV • Última visita >90 días',
      criteria: 'Clientes con más de 90 días sin visita, independientemente de su LTV. Incluye clientes con o sin deuda.',
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
      footer: '🔥 ALTO RIESGO • Contactar HOY • Recupero difícil',
      emoji: '🔴'
    }
  };

  const selectedData = selectedSegment ? segmentosData[selectedSegment] : null;
  const selectedConfig = selectedSegment ? segmentConfig[selectedSegment] : null;

  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-2 shadow-lg text-sm">
        <p className="font-medium">{d.name}</p>
        <p className="text-muted-foreground">{d.value} clientes</p>
      </div>
    );
  };

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
              <UITooltip>
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
              </UITooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          {/* Grid with donut in center */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left column: Premium Activos + Medios Activos */}
            <div className="space-y-4">
              {(['premiumActivos', 'mediosActivos'] as SegmentKey[]).map((key) => {
                const config = segmentConfig[key];
                const segData = segmentosData[key];
                
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
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-3xl font-bold ${config.textColor}`}>
                          {segData.cantidad}
                        </span>
                        <span className="text-sm text-muted-foreground">clientes</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{config.criteria}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deuda Total:</span>
                          <span className="font-medium">{formatCurrency(segData.deudaTotal)}</span>
                        </div>
                      </div>
                      <p className="text-xs mt-2 pt-2 border-t border-border text-muted-foreground">
                        {config.footer}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Center: Donut Chart */}
            <div className="flex flex-col items-center justify-center">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                      labelLine={false}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomDonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-sm font-medium mt-2">
                {totalClientes} clientes total
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                {donutData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: Premium Riesgo + Críticos Inactivos */}
            <div className="space-y-4">
              {(['premiumRiesgo', 'criticosInactivos'] as SegmentKey[]).map((key) => {
                const config = segmentConfig[key];
                const segData = segmentosData[key];
                
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
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-3xl font-bold ${config.textColor}`}>
                          {segData.cantidad}
                        </span>
                        <span className="text-sm text-muted-foreground">clientes</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{config.criteria}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deuda Total:</span>
                          <span className="font-medium">{formatCurrency(segData.deudaTotal)}</span>
                        </div>
                      </div>
                      <p className="text-xs mt-2 pt-2 border-t border-border text-muted-foreground">
                        {config.footer}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
