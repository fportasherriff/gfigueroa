import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency } from '@/lib/formatters';
import type { OperacionesCapacidad } from '@/types/dashboard';

interface CapacidadChartProps {
  data: OperacionesCapacidad[];
  isLoading: boolean;
}

export const CapacidadChart = ({ data, isLoading }: CapacidadChartProps) => {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de capacidad"
            description="No hay datos de capacidad por profesional disponibles."
          />
        </CardContent>
      </Card>
    );
  }

  const getOcupacionColor = (ocupacion: number) => {
    if (ocupacion >= 90) return 'bg-red-500';
    if (ocupacion >= 80) return 'bg-yellow-500';
    if (ocupacion >= 50) return 'bg-green-500';
    return 'bg-gray-300';
  };

  const getOcupacionBgColor = (ocupacion: number) => {
    if (ocupacion >= 90) return 'bg-red-100';
    if (ocupacion >= 80) return 'bg-yellow-100';
    if (ocupacion >= 50) return 'bg-green-100';
    return 'bg-gray-100';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Capacidad por Profesional</CardTitle>
        <CardDescription>
          Nivel de ocupación y alertas por profesional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.slice(0, 10).map((profesional) => {
          const ocupacion = Number(profesional.ocupacion_estimada_pct || 0);
          
          return (
            <div key={profesional.profesional} className="space-y-2">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {profesional.profesional}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(profesional.turnos_agendados)} turnos en {profesional.dias_activos} días
                  </p>
                </div>
                
                {/* Alerts */}
                <div className="flex items-center gap-2 ml-4">
                  {profesional.alerta_sobrecarga && (
                    <Badge variant="destructive" className="text-xs">
                      ⚠️ Sobrecarga
                    </Badge>
                  )}
                  {profesional.alerta_alta_cancelacion && (
                    <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 bg-yellow-50">
                      ⚠️ Alta cancelación
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className={`h-6 rounded-full ${getOcupacionBgColor(ocupacion)} overflow-hidden`}>
                <div 
                  className={`h-full rounded-full ${getOcupacionColor(ocupacion)} flex items-center justify-end pr-2 transition-all duration-500`}
                  style={{ width: `${Math.min(ocupacion, 100)}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    {formatPercent(ocupacion)}
                  </span>
                </div>
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>Prom/día:</span>
                  <span className="font-medium text-foreground">
                    {Number(profesional.turnos_promedio_dia || 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Asistencia:</span>
                  <span className="font-medium text-foreground">
                    {formatPercent(Number(profesional.tasa_asistencia_pct || 0))}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Revenue:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(Number(profesional.revenue_total || 0))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Reference guide */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Interpretación de Ocupación:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              50-80%: Óptimo - Buena utilización sin sobrecarga
            </li>
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              80-90%: Alto - Considerar redistribuir carga
            </li>
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              &gt;90%: Crítico - Riesgo de burnout
            </li>
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              &lt;50%: Subutilizado - Oportunidad de optimización
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
