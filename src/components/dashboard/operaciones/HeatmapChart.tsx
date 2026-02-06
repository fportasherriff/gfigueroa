import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber, formatPercent } from '@/lib/formatters';
import type { OperacionesHeatmap } from '@/types/dashboard';

interface HeatmapChartProps {
  data: OperacionesHeatmap[];
  isLoading: boolean;
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const HeatmapChart = ({ data, isLoading }: HeatmapChartProps) => {
  const heatmapData = useMemo(() => {
    if (!data.length) return null;

    // Aggregate by day and hour - sum turnos and calculate tasa correctly
    const matrix: Record<string, Record<number, { turnos: number; asistidos: number; revenue: number }>> = {};

    data.forEach(d => {
      const day = d.dia_semana_num;
      const hour = d.hora;
      
      if (!matrix[day]) {
        matrix[day] = {};
      }
      if (!matrix[day][hour]) {
        matrix[day][hour] = { turnos: 0, asistidos: 0, revenue: 0 };
      }
      
      matrix[day][hour].turnos += Number(d.turnos_agendados || 0);
      matrix[day][hour].asistidos += Number(d.turnos_asistidos || 0);
      matrix[day][hour].revenue += Number(d.revenue || 0);
    });

    // Calculate tasa as asistidos/agendados (correct way, not averaging percentages)
    const result: Record<string, Record<number, { turnos: number; tasa: number; revenue: number }>> = {};
    
    Object.keys(matrix).forEach(day => {
      result[day] = {};
      Object.keys(matrix[day]).forEach(hour => {
        const h = Number(hour);
        const cell = matrix[day][h];
        const tasa = cell.turnos > 0 ? (cell.asistidos / cell.turnos) * 100 : 0;
        result[day][h] = {
          turnos: cell.turnos,
          tasa: tasa,
          revenue: cell.revenue
        };
      });
    });

    return result;
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!heatmapData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de heatmap"
            description="No hay datos de turnos por hora/día disponibles."
          />
        </CardContent>
      </Card>
    );
  }

  const getColor = (tasa: number) => {
    if (tasa >= 70) return 'bg-green-100 hover:bg-green-200 text-green-800';
    if (tasa >= 50) return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800';
    if (tasa > 0) return 'bg-red-100 hover:bg-red-200 text-red-800';
    return 'bg-gray-50 text-gray-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Mapa de Calor - Asistencia</CardTitle>
            <CardDescription>
              Distribución de turnos y tasa de asistencia por día y hora
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-medium mb-1">Mapa de Calor</p>
              <p className="text-xs text-muted-foreground">
                Muestra la distribución de turnos agendados y la tasa de asistencia para cada combinación de día de la semana y hora del día.
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-1 rounded">
                Tasa = (SUM(asistidos) / SUM(agendados)) × 100
              </p>
              <p className="text-xs text-blue-600 mt-2 font-mono">
                📊 dashboard.operaciones_heatmap
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header - Hours */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${HOURS.length}, 1fr)` }}>
              <div />
              {HOURS.map(hour => (
                <div key={hour} className="text-center text-xs text-muted-foreground py-2">
                  {hour}h
                </div>
              ))}
            </div>

            {/* Rows - Days */}
            {DAYS.map((day, dayIndex) => (
              <div 
                key={day} 
                className="grid gap-1 mt-1"
                style={{ gridTemplateColumns: `80px repeat(${HOURS.length}, 1fr)` }}
              >
                <div className="text-sm font-medium text-muted-foreground flex items-center">
                  {day}
                </div>
                {HOURS.map(hour => {
                  const cell = heatmapData[dayIndex + 1]?.[hour];
                  const tasa = cell?.tasa || 0;
                  const turnos = cell?.turnos || 0;

                  return (
                    <Tooltip key={hour}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`rounded p-2 text-center cursor-pointer transition-colors ${getColor(tasa)}`}
                        >
                          <div className="text-xs font-medium">{turnos > 0 ? turnos : '-'}</div>
                          {turnos > 0 && (
                            <div className="text-[10px] opacity-75">
                              {formatPercent(tasa, 0)}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{day} {hour}:00</p>
                        <p className="text-xs">Turnos: {formatNumber(turnos)}</p>
                        <p className="text-xs">Asistencia: {formatPercent(tasa)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
            <span>Alta (&gt;70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
            <span>Media (50-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
            <span>Baja (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" />
            <span>Sin datos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
