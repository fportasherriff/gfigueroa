import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency, formatMonthYear, getMonthKey } from '@/lib/formatters';
import type { OperacionesDiario, OperacionesCapacidad } from '@/types/dashboard';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface OperacionesEvolucionProps {
  data: OperacionesDiario[];
  capacidadData: OperacionesCapacidad[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  
  const uniquePayload = payload.filter((p: any, i: number, arr: any[]) => 
    arr.findIndex((item: any) => item.dataKey === p.dataKey) === i
  );
  
  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium text-sm mb-2">{label}</p>
      {uniquePayload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

export const OperacionesEvolucion = ({ data, capacidadData, isLoading }: OperacionesEvolucionProps) => {
  const monthlyData = useMemo(() => {
    if (!data.length) return [];

    // Aggregate operaciones by month
    const byMonth: Record<string, {
      turnos_agendados: number;
      turnos_asistidos: number;
      turnos_cancelados: number;
      turnos_inasistidos: number;
      revenue: number;
    }> = {};

    data.forEach(d => {
      // Use local date parsing to avoid timezone shift
      const monthKey = getMonthKey(d.fecha);
      
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          turnos_agendados: 0,
          turnos_asistidos: 0,
          turnos_cancelados: 0,
          turnos_inasistidos: 0,
          revenue: 0,
        };
      }
      
      byMonth[monthKey].turnos_agendados += Number(d.turnos_agendados || 0);
      byMonth[monthKey].turnos_asistidos += Number(d.turnos_asistidos || 0);
      byMonth[monthKey].turnos_cancelados += Number(d.turnos_cancelados || 0);
      byMonth[monthKey].turnos_inasistidos += Number(d.turnos_inasistidos || 0);
      byMonth[monthKey].revenue += Number(d.revenue || 0);
    });

    // Aggregate capacidad by month for ocupacion
    const capacidadByMonth: Record<string, { total: number; count: number }> = {};
    capacidadData.forEach(c => {
      // Use local date parsing to avoid timezone shift
      const monthKey = getMonthKey(c.periodo_mes);
      if (!capacidadByMonth[monthKey]) {
        capacidadByMonth[monthKey] = { total: 0, count: 0 };
      }
      capacidadByMonth[monthKey].total += Number(c.ocupacion_estimada_pct || 0);
      capacidadByMonth[monthKey].count += 1;
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => {
        const tasaAsistencia = values.turnos_agendados > 0 
          ? (values.turnos_asistidos / values.turnos_agendados) * 100 
          : 0;
        const tasaCancelacion = values.turnos_agendados > 0 
          ? (values.turnos_cancelados / values.turnos_agendados) * 100 
          : 0;
        const tasaInasistencia = values.turnos_agendados > 0 
          ? (values.turnos_inasistidos / values.turnos_agendados) * 100 
          : 0;
        const revenuePorTurno = values.turnos_asistidos > 0 
          ? values.revenue / values.turnos_asistidos 
          : 0;
        
        // Ocupación promedio del mes
        const capacidadMes = capacidadByMonth[month];
        const ocupacionReal = capacidadMes && capacidadMes.count > 0
          ? capacidadMes.total / capacidadMes.count
          : 0;

        return {
          mes: formatMonthYear(month + '-01'),
          mesKey: month,
          turnosAgendados: values.turnos_agendados,
          tasaAsistencia,
          tasaCancelacion,
          tasaInasistencia,
          revenuePorTurno,
          ocupacionReal,
        };
      });
  }, [data, capacidadData]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!monthlyData.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de evolución"
            description="No hay datos suficientes para mostrar la evolución."
          />
        </CardContent>
      </Card>
    );
  }

  const tabConfigs = [
    {
      id: 'turnos',
      label: '📅 Turnos',
      dataKey: 'turnosAgendados',
      title: 'Evolución de Turnos Agendados',
      description: 'Cantidad total de turnos agendados por mes.',
      source: 'dashboard.operaciones_diario',
      calculation: 'SUM(turnos_agendados) por mes',
      color: 'hsl(221, 83%, 53%)',
      formatter: formatNumber,
      yAxisFormatter: (v: number) => formatNumber(v),
    },
    {
      id: 'asistencia',
      label: '✓ Asistencia',
      dataKey: 'tasaAsistencia',
      title: 'Evolución de Tasa de Asistencia',
      description: 'Porcentaje de turnos que se realizaron efectivamente.',
      source: 'dashboard.operaciones_diario',
      calculation: '(SUM(turnos_asistidos) / SUM(turnos_agendados)) × 100',
      color: 'hsl(142, 76%, 36%)',
      formatter: (v: number) => formatPercent(v),
      yAxisFormatter: (v: number) => `${v}%`,
    },
    {
      id: 'cancelacion',
      label: '✗ Cancelación',
      dataKey: 'tasaCancelacion',
      title: 'Evolución de Tasa de Cancelación',
      description: 'Porcentaje de turnos cancelados por mes.',
      source: 'dashboard.operaciones_diario',
      calculation: '(SUM(turnos_cancelados) / SUM(turnos_agendados)) × 100',
      color: 'hsl(0, 84%, 60%)',
      formatter: (v: number) => formatPercent(v),
      yAxisFormatter: (v: number) => `${v}%`,
    },
    {
      id: 'inasistencia',
      label: '👤 Inasistencia',
      dataKey: 'tasaInasistencia',
      title: 'Evolución de Tasa de Inasistencia',
      description: 'Porcentaje de turnos donde el paciente no asistió.',
      source: 'dashboard.operaciones_diario',
      calculation: '(SUM(turnos_inasistidos) / SUM(turnos_agendados)) × 100',
      color: 'hsl(25, 95%, 53%)',
      formatter: (v: number) => formatPercent(v),
      yAxisFormatter: (v: number) => `${v}%`,
    },
    {
      id: 'ocupacion',
      label: '🕐 Ocupación',
      dataKey: 'ocupacionReal',
      title: 'Evolución de Ocupación Real',
      description: 'Porcentaje de capacidad utilizada por mes. Óptimo: 50-80%',
      source: 'dashboard.operaciones_capacidad',
      calculation: 'AVG(ocupacion_estimada_pct) por mes',
      color: 'hsl(262, 83%, 58%)',
      formatter: (v: number) => formatPercent(v),
      yAxisFormatter: (v: number) => `${v}%`,
    },
    {
      id: 'ticket',
      label: '🎫 Ticket/Turno',
      dataKey: 'revenuePorTurno',
      title: 'Evolución de Facturación por Turno',
      description: 'Ingreso promedio por turno asistido.',
      source: 'dashboard.operaciones_diario',
      calculation: 'SUM(revenue) / SUM(turnos_asistidos)',
      color: 'hsl(173, 80%, 40%)',
      formatter: formatCurrency,
      yAxisFormatter: (v: number) => formatCurrency(v),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolución de Métricas</CardTitle>
        <CardDescription>
          Visualización temporal de los indicadores operativos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="turnos" className="space-y-4">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            {tabConfigs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabConfigs.map(tab => (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">{tab.title}</h4>
                  <p className="text-sm text-muted-foreground">{tab.description}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-1">{tab.title}</p>
                    <p className="text-xs text-muted-foreground">{tab.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-1 rounded">
                      {tab.calculation}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-mono">
                      📊 {tab.source}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData}>
                  <defs>
                    <linearGradient id={`gradient-${tab.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tab.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={tab.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={tab.yAxisFormatter}
                  />
                  <RechartsTooltip 
                    content={<CustomTooltip formatter={tab.formatter} />}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey={tab.dataKey}
                    name={tab.title.replace('Evolución de ', '')}
                    stroke={tab.color}
                    fill={`url(#gradient-${tab.id})`}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey={tab.dataKey}
                    name={tab.title.replace('Evolución de ', '')}
                    stroke={tab.color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: tab.color }}
                    activeDot={{ r: 6 }}
                    legendType="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
