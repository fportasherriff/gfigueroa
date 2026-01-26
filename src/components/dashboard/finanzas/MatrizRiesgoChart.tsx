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
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrency, formatCurrencyFull } from '@/lib/formatters';
import type { FinanzasDeudores } from '@/types/dashboard';

interface MatrizRiesgoChartProps {
  data: FinanzasDeudores[];
  isLoading: boolean;
}

export const MatrizRiesgoChart = ({ data, isLoading }: MatrizRiesgoChartProps) => {
  const { bajoRiesgo, medioRiesgo, altoRiesgo } = useMemo(() => {
    return {
      bajoRiesgo: data.filter(d => d.segmento_riesgo === 'Bajo'),
      medioRiesgo: data.filter(d => d.segmento_riesgo === 'Medio'),
      altoRiesgo: data.filter(d => d.segmento_riesgo === 'Alto'),
    };
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de deudores"
            description="No hay clientes con deuda pendiente en este momento."
          />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const d = payload[0].payload;
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
        <p className="font-medium text-foreground mb-2">{d.nombre_completo}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">📞 Teléfono:</span>
            <span>{d.telefono || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">💰 Deuda:</span>
            <span className="font-medium text-red-600">{formatCurrencyFull(d.deuda_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">💎 LTV:</span>
            <span>{formatCurrencyFull(d.ltv)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">📅 Días sin pago:</span>
            <span>{d.dias_desde_ultimo_pago || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
            <span className="text-muted-foreground">Riesgo:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              d.segmento_riesgo === 'Alto' ? 'bg-red-100 text-red-700' :
              d.segmento_riesgo === 'Medio' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {d.segmento_riesgo}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Matriz de Riesgo</CardTitle>
        <CardDescription>
          Distribución de deudores por días sin pago y monto de deuda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                type="number" 
                dataKey="dias_desde_ultimo_pago" 
                name="Días sin pago"
                domain={[0, 'auto']}
                tickFormatter={(value) => `${value}d`}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                type="number" 
                dataKey="deuda_total" 
                name="Deuda"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                stroke="hsl(var(--muted-foreground))"
              />
              <ZAxis 
                type="number" 
                dataKey="ltv" 
                range={[50, 400]}
                name="LTV"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <ReferenceLine 
                x={30} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ value: '30d', position: 'top', fontSize: 10 }}
              />
              <ReferenceLine 
                x={60} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ value: '60d', position: 'top', fontSize: 10 }}
              />
              
              <Scatter 
                name="Bajo Riesgo" 
                data={bajoRiesgo} 
                fill="hsl(142, 76%, 36%)"
              />
              <Scatter 
                name="Medio Riesgo" 
                data={medioRiesgo} 
                fill="hsl(38, 92%, 50%)"
              />
              <Scatter 
                name="Alto Riesgo" 
                data={altoRiesgo} 
                fill="hsl(0, 84%, 60%)"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Bajo (&lt;30d)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Medio (30-60d)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Alto (&gt;60d)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
