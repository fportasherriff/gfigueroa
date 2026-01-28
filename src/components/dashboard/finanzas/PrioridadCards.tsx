import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Phone, Mail, MessageSquare, Copy, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { toast } from '@/hooks/use-toast';
import type { FinanzasPrioridad, FinanzasRecuperoMaster } from '@/types/dashboard';

interface PrioridadCardsProps {
  data: FinanzasPrioridad[];
  clientesData?: FinanzasRecuperoMaster[];
  isLoading: boolean;
}

const PRIORIDAD_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  badge: string;
  criteria: string[];
  chartColor: string;
}> = {
  'Crítica': {
    color: 'text-red-700',
    bgColor: 'bg-white',
    borderColor: 'border-red-500',
    dotColor: 'bg-red-500',
    badge: 'Contactar HOY',
    criteria: ['+90 días sin visita Y deuda >$500K'],
    chartColor: '#DC2626'
  },
  'Alta': {
    color: 'text-orange-700',
    bgColor: 'bg-white',
    borderColor: 'border-orange-500',
    dotColor: 'bg-orange-500',
    badge: 'Esta semana',
    criteria: ['+60 días sin visita', 'O deuda >$1M'],
    chartColor: '#F97316'
  },
  'Media': {
    color: 'text-yellow-700',
    bgColor: 'bg-white',
    borderColor: 'border-yellow-500',
    dotColor: 'bg-yellow-500',
    badge: 'Este mes',
    criteria: ['+30 días sin visita', 'O deuda >$300K'],
    chartColor: '#EAB308'
  },
  'Baja': {
    color: 'text-slate-600',
    bgColor: 'bg-white',
    borderColor: 'border-slate-400',
    dotColor: 'bg-slate-400',
    badge: 'Seguimiento',
    criteria: ['Deuda menor', 'Actividad reciente'],
    chartColor: '#94A3B8'
  }
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
    return `Hola ${nombre}, te contacto de Centro Ghigi Figueroa.\n\nComo cliente Premium con más de $${ltv}K en tratamientos, queremos asegurarnos de que tu experiencia siga siendo excepcional.\n\nVeo que tenés un saldo pendiente de $${deuda}K desde hace ${dias} días. ¿Te gustaría que coordinemos un plan de pagos personalizado?\n\n¿Cuándo te vendría bien que hablemos?`;
  } 
  else if (cliente.tipo_mensaje === 'alto_valor') {
    return `Hola ${nombre}, soy del equipo de Centro Ghigi Figueroa.\n\nTe escribo porque tenés un saldo pendiente de $${deuda}K desde hace ${dias} días. Como cliente valorado, queremos ofrecerte facilidades de pago.\n\n¿Te gustaría que coordinemos opciones de financiación?`;
  }
  return `Hola ${nombre}, te contacto de Centro Ghigi Figueroa.\n\nTe recordamos que tenés un saldo pendiente de $${deuda}K. ¿Podemos coordinar un pago o establecer un plan de cuotas?\n\nGracias por tu atención.`;
};

export const PrioridadCards = ({ data, clientesData = [], isLoading }: PrioridadCardsProps) => {
  const [selectedPrioridad, setSelectedPrioridad] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<FinanzasRecuperoMaster | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2 border-gray-200">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const critica = data.find(p => p.prioridad === 'Crítica');
  const alta = data.find(p => p.prioridad === 'Alta');
  const media = data.find(p => p.prioridad === 'Media');
  const baja = data.find(p => p.prioridad === 'Baja');

  // Prepare chart data
  const chartData = data.map(p => ({
    name: p.prioridad,
    value: p.cantidad_clientes,
    color: PRIORIDAD_CONFIG[p.prioridad]?.chartColor || '#94A3B8'
  }));

  // Get clients for selected priority
  const clientesFiltered = clientesData.filter(c => c.prioridad_contacto === selectedPrioridad);

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

  const PrioridadCard = ({ 
    prioridad, 
    data: prioData 
  }: { 
    prioridad: string; 
    data?: FinanzasPrioridad 
  }) => {
    const config = PRIORIDAD_CONFIG[prioridad];
    if (!config || !prioData) return null;

    return (
      <Card 
        className={`border-2 ${config.borderColor} ${config.bgColor} cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]`}
        onClick={() => setSelectedPrioridad(prioridad)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.dotColor} ${prioridad === 'Crítica' ? 'animate-pulse' : ''}`} />
              <CardTitle className={`text-base font-semibold ${config.color}`}>
                {prioridad.toUpperCase()}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {config.badge}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className={`text-4xl font-bold ${config.color}`}>
            {prioData.cantidad_clientes}
          </p>
          <p className={`text-lg font-semibold ${config.color} opacity-80 mt-1`}>
            {formatCurrency(prioData.deuda_total)}
          </p>
          {prioridad === 'Crítica' && (
            <div className="flex items-center gap-1 mt-3 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Acción inmediata requerida</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Main Layout: 3 columns top + 2 columns bottom */}
      <div className="space-y-4">
        {/* Row 1: Crítica + Donut + Alta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PrioridadCard prioridad="Crítica" data={critica} />
          
          {/* Central Donut */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Distribución</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Proporción de clientes por nivel de prioridad de contacto</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <PrioridadCard prioridad="Alta" data={alta} />
        </div>

        {/* Row 2: Media + Baja */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PrioridadCard prioridad="Media" data={media} />
          <PrioridadCard prioridad="Baja" data={baja} />
        </div>
      </div>

      {/* Modal for clients */}
      <Dialog open={!!selectedPrioridad} onOpenChange={() => setSelectedPrioridad(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={
                selectedPrioridad === 'Crítica' ? 'bg-red-600' :
                selectedPrioridad === 'Alta' ? 'bg-orange-500' :
                selectedPrioridad === 'Media' ? 'bg-yellow-500' : 'bg-slate-400'
              }>
                {selectedPrioridad}
              </Badge>
              Clientes a Contactar
            </DialogTitle>
            <DialogDescription>
              {clientesFiltered.length} clientes • Click en WhatsApp para enviar mensaje
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {clientesFiltered.slice(0, 20).map((cliente) => (
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
