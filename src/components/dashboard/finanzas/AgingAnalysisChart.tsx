import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatCurrency } from '@/lib/formatters';
import type { FinanzasDeudaAging } from '@/types/dashboard';

interface AgingAnalysisChartProps {
  data: FinanzasDeudaAging[];
  isLoading: boolean;
}

const AGING_COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444', '#7F1D1D'];

export const AgingAnalysisChart = ({ data, isLoading }: AgingAnalysisChartProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de antigüedad"
            description="No hay información de aging disponible."
          />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="font-medium text-foreground mb-2">{d.segmento_antiguedad}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deuda:</span>
            <span className="font-medium">{formatCurrency(d.deuda_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clientes:</span>
            <span>{d.cantidad_clientes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Promedio:</span>
            <span>{formatCurrency(d.deuda_promedio)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Antigüedad de Deuda</CardTitle>
            <CardDescription>Aging Analysis por días sin visita</CardDescription>
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
                  Distribuye la deuda según los días transcurridos desde la última visita del cliente. A mayor antigüedad, mayor riesgo de incobrabilidad.
                </p>
                <p className="text-xs font-medium mt-2 mb-1">¿Cómo se interpreta?</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>🟢 0-30 días: Reciente, bajo riesgo</p>
                  <p>🟡 31-60 días: Requiere seguimiento</p>
                  <p>🟠 61-90 días: Riesgo medio, contactar</p>
                  <p>🔴 91-180 días: Alto riesgo, acción necesaria</p>
                  <p>⚫ +180 días: Crítico, recupero difícil</p>
                </div>
                <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-border font-mono">
                  📊 Vista: dashboard.finanzas_deuda_aging
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%" data-validation="dashboard.finanzas_deuda_aging.deuda_total.SUM">
            <BarChart 
              data={data} 
              layout="vertical"
              margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="segmento_antiguedad"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="deuda_total" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={AGING_COLORS[index] || AGING_COLORS[4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
