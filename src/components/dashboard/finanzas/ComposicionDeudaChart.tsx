import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ChartSkeleton } from '../DashboardStates';
import { formatCurrency } from '@/lib/formatters';

interface ComposicionDeudaChartProps {
  deudaTQP: number;
  deudaExtras: number;
  clientesTQP: number;
  clientesTotal: number;
  isLoading: boolean;
}

export const ComposicionDeudaChart = ({ 
  deudaTQP, 
  deudaExtras, 
  clientesTQP, 
  clientesTotal,
  isLoading 
}: ComposicionDeudaChartProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  const deudaTotal = deudaTQP + deudaExtras;
  const pctTQP = deudaTotal > 0 ? ((deudaTQP / deudaTotal) * 100).toFixed(1) : '0';
  const pctExtras = deudaTotal > 0 ? ((deudaExtras / deudaTotal) * 100).toFixed(1) : '0';

  const chartData = [
    { name: 'Procedimientos (TQP)', value: deudaTQP, color: '#F59E0B' },
    { name: 'Extras', value: deudaExtras, color: '#FDE047' }
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Donut Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Composición Deuda Total</CardTitle>
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
                    <p>🟠 Procedimientos: Lo registrado en turnos</p>
                    <p>🟡 Extras: Productos, paquetes, servicios</p>
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
          <div className="h-64">
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
                  label={({ name, percent }) => 
                    `${name.split(' ')[0]}: ${(percent * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Explanatory Cards */}
      <div className="space-y-4">
        <Card className="border-l-4 border-orange-500 bg-orange-50/50">
          <CardContent className="p-4">
            <h4 className="font-semibold text-orange-800 mb-1">💰 Deuda Procedimientos</h4>
            <p className="text-2xl font-bold text-orange-600 mb-2">{formatCurrency(deudaTQP)}</p>
            <p className="text-sm text-orange-700">
              Lo que rastreamos en turnos (TQP)
            </p>
            <p className="text-xs text-orange-600 mt-2">
              {pctTQP}% del total • {clientesTQP} clientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500 bg-yellow-50/50">
          <CardContent className="p-4">
            <h4 className="font-semibold text-yellow-800 mb-1">📦 Deuda Extras</h4>
            <p className="text-2xl font-bold text-yellow-600 mb-2">{formatCurrency(deudaExtras)}</p>
            <p className="text-sm text-yellow-700">
              Productos, paquetes, servicios no registrados en turnos
            </p>
            <p className="text-xs text-yellow-600 mt-2">
              {pctExtras}% del total • {clientesTotal} clientes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
