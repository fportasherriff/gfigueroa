import { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ZAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Phone, Mail, MessageSquare } from 'lucide-react';
import { ChartSkeleton } from '../DashboardStates';
import { formatCurrency } from '@/lib/formatters';
import { toast } from '@/hooks/use-toast';
import type { FinanzasRecuperoMaster } from '@/types/dashboard';

interface MatrizRiesgoChartProps {
  data: FinanzasRecuperoMaster[];
  isLoading: boolean;
}

// Color by debt amount instead of priority
const getDebtColor = (deuda: number): string => {
  if (deuda > 1000000) return '#EF4444'; // Red: >$1M
  if (deuda > 500000) return '#F97316';  // Orange: $500K-$1M
  if (deuda > 200000) return '#F59E0B';  // Yellow: $200K-$500K
  if (deuda > 50000) return '#3B82F6';   // Blue: $50K-$200K
  return '#94A3B8';                       // Gray: <$50K
};

const DEBT_RANGES = [
  { label: 'Deuda > $1M', color: '#EF4444', min: 1000001 },
  { label: 'Deuda $500K-$1M', color: '#F97316', min: 500001, max: 1000000 },
  { label: 'Deuda $200K-$500K', color: '#F59E0B', min: 200001, max: 500000 },
  { label: 'Deuda $50K-$200K', color: '#3B82F6', min: 50001, max: 200000 },
  { label: 'Deuda < $50K', color: '#94A3B8', max: 50000 },
];

type QuadrantKey = 'altoLtvAltaDeuda' | 'altoLtvBajaDeuda' | 'bajoLtvAltaDeuda' | 'bajoLtvBajaDeuda';

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

export const MatrizRiesgoChart = ({ data, isLoading }: MatrizRiesgoChartProps) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantKey | null>(null);

  // Prepare data with debt-based colors
  const { scatterData, quadrants } = useMemo(() => {
    const processed = data.map(cliente => ({
      ...cliente,
      ltv: Number(cliente.ltv) || 0,
      saldo_total: Number(cliente.saldo_total) || 0,
      size: Math.min(20, Math.max(5, (cliente.dias_desde_ultima_visita || 0) / 5)),
      fill: getDebtColor(Number(cliente.saldo_total) || 0)
    }));

    // Calculate quadrant data
    const quads = {
      altoLtvAltaDeuda: processed.filter(c => c.ltv > 1000000 && c.saldo_total > 500000),
      altoLtvBajaDeuda: processed.filter(c => c.ltv > 1000000 && c.saldo_total <= 500000),
      bajoLtvAltaDeuda: processed.filter(c => c.ltv <= 1000000 && c.saldo_total > 500000),
      bajoLtvBajaDeuda: processed.filter(c => c.ltv <= 1000000 && c.saldo_total <= 500000),
    };

    return { scatterData: processed, quadrants: quads };
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[220px]">
        <p className="font-semibold text-foreground mb-2 truncate max-w-[200px]">
          {d.nombre_completo}
        </p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">LTV:</span>
            <span className="font-medium text-blue-600">{formatCurrency(d.ltv)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deuda:</span>
            <span className="font-medium text-red-600">{formatCurrency(d.saldo_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Días s/visita:</span>
            <span className="font-medium">{d.dias_desde_ultima_visita}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ratio:</span>
            <span>{d.ratio_deuda_ltv_pct?.toFixed(1) || '-'}%</span>
          </div>
        </div>
      </div>
    );
  };

  const quadrantConfig: Record<QuadrantKey, {
    title: string;
    subtitle: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }> = {
    altoLtvAltaDeuda: {
      title: '↗️ Alto LTV + Alta Deuda',
      subtitle: 'Recuperar Urgente',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    },
    altoLtvBajaDeuda: {
      title: '↘️ Alto LTV + Baja Deuda',
      subtitle: 'Fidelizar',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    bajoLtvAltaDeuda: {
      title: '↖️ Bajo LTV + Alta Deuda',
      subtitle: 'Riesgo Alto',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700'
    },
    bajoLtvBajaDeuda: {
      title: '↙️ Bajo LTV + Baja Deuda',
      subtitle: 'Seguimiento Normal',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    }
  };

  const selectedData = selectedQuadrant ? quadrants[selectedQuadrant] : null;
  const selectedConfig = selectedQuadrant ? quadrantConfig[selectedQuadrant] : null;

  return (
    <>
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Matriz LTV vs Deuda</CardTitle>
              <CardDescription>Cada punto es un cliente • Tamaño = días sin visita • Color = monto deuda</CardDescription>
            </div>
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
                    Visualiza la relación entre el valor histórico (LTV) y la deuda actual de cada cliente para priorizar estrategias de recupero.
                  </p>
                  <p className="text-xs font-medium mt-2 mb-1">¿Cómo se interpreta?</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>• Eje X: Valor histórico del cliente (LTV)</p>
                    <p>• Eje Y: Deuda actual total</p>
                    <p>• Tamaño: Mayor = más días sin visita</p>
                    <p>• Color: Según monto de deuda</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
                    <p className="font-medium">Cuadrantes (click para ver clientes):</p>
                    <p>↗️ Alto LTV + Alta Deuda = Recuperar urgente</p>
                    <p>↘️ Alto LTV + Baja Deuda = Fidelizar</p>
                    <p>↖️ Bajo LTV + Alta Deuda = Riesgo alto</p>
                    <p>↙️ Bajo LTV + Baja Deuda = Seguimiento</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-border font-mono">
                    📊 Vista: dashboard.finanzas_recupero_master
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%" data-validation="dashboard.finanzas_recupero_master.COUNT">
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis 
                  type="number"
                  dataKey="ltv"
                  name="LTV"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  label={{ 
                    value: 'LTV (Valor Histórico)', 
                    position: 'bottom', 
                    offset: 40,
                    fontSize: 12,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
                <YAxis 
                  type="number"
                  dataKey="saldo_total"
                  name="Deuda"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  label={{ 
                    value: 'Deuda Total', 
                    angle: -90, 
                    position: 'insideLeft',
                    fontSize: 12,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
                <ZAxis type="number" dataKey="size" range={[40, 400]} />
                
                {/* Reference lines */}
                <ReferenceLine 
                  x={1000000} 
                  stroke="#3B82F6" 
                  strokeDasharray="5 5" 
                  label={{ value: 'LTV $1M', position: 'top', fontSize: 10 }}
                />
                <ReferenceLine 
                  y={500000} 
                  stroke="#EF4444" 
                  strokeDasharray="5 5"
                  label={{ value: 'Deuda $500K', position: 'right', fontSize: 10 }}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Single Scatter with individual colors */}
                <Scatter
                  name="Clientes"
                  data={scatterData}
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Debt Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 mb-4 text-xs">
            {DEBT_RANGES.map((range) => (
              <div key={range.label} className="flex items-center gap-1.5">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: range.color }}
                />
                <span className="text-muted-foreground">{range.label}</span>
              </div>
            ))}
          </div>

          {/* Clickable Quadrant Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            {(Object.keys(quadrantConfig) as QuadrantKey[]).map((key) => {
              const config = quadrantConfig[key];
              const clients = quadrants[key];
              const totalDeuda = clients.reduce((sum, c) => sum + c.saldo_total, 0);
              
              return (
                <div 
                  key={key}
                  className={`p-3 ${config.bgColor} border ${config.borderColor} rounded-lg cursor-pointer hover:shadow-md transition-all hover:scale-105`}
                  onClick={() => setSelectedQuadrant(key)}
                >
                  <span className={`text-sm font-medium ${config.textColor}`}>{config.title}</span>
                  <p className={`text-xs ${config.textColor} mt-1`}>{config.subtitle}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>{clients.length} clientes</p>
                    <p className="font-medium">{formatCurrency(totalDeuda)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal for quadrant clients */}
      <Dialog open={!!selectedQuadrant} onOpenChange={() => setSelectedQuadrant(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedConfig?.title}</DialogTitle>
            <DialogDescription>
              {selectedData?.length} clientes • {selectedConfig?.subtitle} • Click en WhatsApp para enviar mensaje
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {selectedData?.slice(0, 20).map((cliente) => (
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
