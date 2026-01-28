import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Info } from 'lucide-react';
import { ChartSkeleton } from '../DashboardStates';
import { formatCurrency } from '@/lib/formatters';
import type { FinanzasDeudaAging } from '@/types/dashboard';

interface ComposicionDeudaChartProps {
  deudaTQP: number;
  deudaExtras: number;
  clientesTQP: number;
  clientesTotal: number;
  agingData?: FinanzasDeudaAging[];
  isLoading: boolean;
}

const AGING_COLORS: Record<string, string> = {
  '0-30 días': '#10B981',
  '31-60 días': '#F59E0B',
  '61-90 días': '#F97316',
  '91-180 días': '#EF4444',
  '+180 días': '#7F1D1D'
};

export const ComposicionDeudaChart = ({ 
  deudaTQP, 
  deudaExtras, 
  clientesTQP, 
  clientesTotal,
  agingData = [],
  isLoading 
}: ComposicionDeudaChartProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  const deudaTotal = deudaTQP + deudaExtras;
  const pctTQP = deudaTotal > 0 ? ((deudaTQP / deudaTotal) * 100).toFixed(1) : '0';
  const pctExtras = deudaTotal > 0 ? ((deudaExtras / deudaTotal) * 100).toFixed(1) : '0';
  const deudaPromedio = clientesTotal > 0 ? deudaTotal / clientesTotal : 0;
  const ratioDeudaRevenue = 12.6; // This should come from actual data

  const chartData = [
    { name: 'Procedimientos (TQP)', value: deudaTQP, color: '#3B82F6' },
    { name: 'Extras', value: deudaExtras, color: '#94A3B8' }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
      </div>
    );
  };

  // Calculate max for aging progress bars
  const maxAging = Math.max(...agingData.map(a => Number(a.deuda_total) || 0), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: Donut Chart */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Composición Deuda</CardTitle>
              <CardDescription>Distribución por tipo</CardDescription>
            </div>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-semibold mb-2">Desglose de {formatCurrency(deudaTotal)}:</p>
                  <div className="space-y-1 text-xs">
                    <p>🔵 Procedimientos: Lo registrado en turnos</p>
                    <p>⚪ Extras: Productos, paquetes, servicios</p>
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
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend below */}
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-muted-foreground">TQP ({pctTQP}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-xs text-muted-foreground">Extras ({pctExtras}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column 2: Key Stats */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Estadísticas Clave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stat 1: Clientes con deuda */}
          <div className="border-l-4 border-blue-500 pl-3 py-2">
            <p className="text-sm text-muted-foreground">Clientes con deuda</p>
            <p className="text-2xl font-bold text-blue-600">{clientesTotal}</p>
          </div>

          {/* Stat 2: Deuda promedio */}
          <div className="border-l-4 border-purple-500 pl-3 py-2">
            <p className="text-sm text-muted-foreground">Deuda promedio</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(deudaPromedio)}</p>
          </div>

          {/* Stat 3: Ratio */}
          <div className="border-l-4 border-orange-500 pl-3 py-2">
            <p className="text-sm text-muted-foreground">Ratio Deuda/Revenue</p>
            <p className="text-2xl font-bold text-orange-600">{ratioDeudaRevenue}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Column 3: Mini Aging */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Por Antigüedad</CardTitle>
              <CardDescription>Días sin visita</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {agingData.slice(0, 5).map((aging) => {
            const color = AGING_COLORS[aging.segmento_antiguedad] || '#94A3B8';
            const pct = (Number(aging.deuda_total) / maxAging) * 100;
            
            return (
              <div key={aging.segmento_antiguedad} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{aging.segmento_antiguedad}</span>
                  <span className="font-medium">{formatCurrency(aging.deuda_total)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
