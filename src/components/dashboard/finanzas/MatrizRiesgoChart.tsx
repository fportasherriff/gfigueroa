import { useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { ChartSkeleton } from '../DashboardStates';
import { formatCurrency } from '@/lib/formatters';
import type { FinanzasRecuperoMaster } from '@/types/dashboard';

interface MatrizRiesgoChartProps {
  data: FinanzasRecuperoMaster[];
  isLoading: boolean;
}

const PRIORIDAD_COLORS: Record<string, string> = {
  'Crítica': '#DC2626',
  'Alta': '#F97316',
  'Media': '#EAB308',
  'Baja': '#94A3B8'
};

const PRIORIDAD_BADGE: Record<string, string> = {
  'Crítica': 'bg-red-600 text-white',
  'Alta': 'bg-orange-500 text-white',
  'Media': 'bg-yellow-500 text-white',
  'Baja': 'bg-slate-400 text-white'
};

export const MatrizRiesgoChart = ({ data, isLoading }: MatrizRiesgoChartProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Prepare data grouped by priority
  const dataByPrioridad = useMemo(() => {
    const groups: Record<string, any[]> = {
      'Crítica': [],
      'Alta': [],
      'Media': [],
      'Baja': []
    };

    data.forEach(cliente => {
      const prioridad = cliente.prioridad_contacto || 'Baja';
      if (groups[prioridad]) {
        groups[prioridad].push({
          ...cliente,
          ltv: Number(cliente.ltv) || 0,
          saldo_total: Number(cliente.saldo_total) || 0,
          size: Math.min(20, Math.max(5, (cliente.dias_desde_ultima_visita || 0) / 5))
        });
      }
    });

    return groups;
  }, [data]);

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
          <div className="flex justify-between items-center pt-1 border-t border-border">
            <span className="text-muted-foreground">Prioridad:</span>
            <Badge className={PRIORIDAD_BADGE[d.prioridad_contacto] || PRIORIDAD_BADGE['Baja']}>
              {d.prioridad_contacto}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Matriz LTV vs Deuda</CardTitle>
            <CardDescription>Cada punto es un cliente • Tamaño = días sin visita</CardDescription>
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
                  <p>• Eje X: Valor histórico del cliente (LTV)</p>
                  <p>• Eje Y: Deuda actual total</p>
                  <p>• Tamaño: Mayor = más días sin visita</p>
                  <p>• Color: Por prioridad de contacto</p>
                </div>
                <div className="mt-2 pt-2 border-t border-border space-y-1 text-xs">
                  <p className="font-medium">Cuadrantes:</p>
                  <p>↗️ Alto LTV + Alta Deuda = Recuperar urgente</p>
                  <p>↘️ Alto LTV + Baja Deuda = Fidelizar</p>
                  <p>↖️ Bajo LTV + Alta Deuda = Riesgo alto</p>
                  <p>↙️ Bajo LTV + Baja Deuda = Seguimiento</p>
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
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
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
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />

              {Object.entries(dataByPrioridad).map(([prioridad, clientes]) => (
                <Scatter
                  key={prioridad}
                  name={prioridad}
                  data={clientes}
                  fill={PRIORIDAD_COLORS[prioridad]}
                  fillOpacity={0.7}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quadrant Legend */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-red-50 border border-red-200 rounded text-center">
            <span className="text-red-700 font-medium">↗️ Alto LTV + Alta Deuda</span>
            <p className="text-red-600 mt-1">Recuperar Urgente</p>
          </div>
          <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
            <span className="text-green-700 font-medium">↘️ Alto LTV + Baja Deuda</span>
            <p className="text-green-600 mt-1">Fidelizar</p>
          </div>
          <div className="p-2 bg-orange-50 border border-orange-200 rounded text-center">
            <span className="text-orange-700 font-medium">↖️ Bajo LTV + Alta Deuda</span>
            <p className="text-orange-600 mt-1">Riesgo Alto</p>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-slate-700 font-medium">↙️ Bajo LTV + Baja Deuda</span>
            <p className="text-slate-600 mt-1">Seguimiento Normal</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
