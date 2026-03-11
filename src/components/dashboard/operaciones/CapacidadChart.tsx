import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Capacidad por Profesional</CardTitle>
            <CardDescription>
              Nivel de ocupación y alertas por profesional
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-1">
              ⚠️ Esta vista muestra el mes completo de cada período — los datos no se filtran 
              por rango de días exacto. El filtro de fecha determina qué mes se incluye.
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-semibold mb-2">¿Para qué sirve?</p>
              <p className="text-xs text-muted-foreground">
                Muestra el nivel de ocupación estimado de cada profesional para detectar sobrecarga o subutilización de agenda.
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-1 rounded">
                Ocupación = (turnos_agendados / capacidad_estimada) × 100
              </p>
              <p className="text-xs text-blue-600 mt-2 font-mono">
                📊 Vista: dashboard.operaciones_capacidad
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4" data-validation="dashboard.operaciones_capacidad.COUNT">
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
              {ocupacion <= 100 ? (
                <div className={`h-6 rounded-full ${getOcupacionBgColor(ocupacion)} overflow-hidden`}>
                  <div 
                    className={`h-full rounded-full ${getOcupacionColor(ocupacion)} flex items-center justify-end pr-2 transition-all duration-500`}
                    style={{ width: `${ocupacion}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {formatPercent(ocupacion)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`h-6 rounded-full bg-red-100 overflow-hidden flex-1`}>
                    <div 
                      className="h-full rounded-full bg-red-500 transition-all duration-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <span className="text-sm font-bold text-red-600 whitespace-nowrap">
                    {formatPercent(ocupacion)}
                  </span>
                </div>
              )}

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
        <div className="mt-6 space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-amber-800">
              ⚙️ ¿Cómo se calcula la ocupación?
            </p>
            <p className="text-xs text-amber-700">
              <strong>Ocupación (%) = turnos agendados ÷ (días con actividad × 8) × 100</strong>
            </p>
            <p className="text-xs text-amber-700">
              El <strong>8</strong> representa la capacidad máxima estimada de turnos por día 
              por profesional. Es un valor de referencia definido durante el desarrollo — 
              no ha sido validado con el centro todavía.
            </p>
            <p className="text-xs text-amber-700 font-medium">
              → Pendiente confirmar con el centro: ¿cuántos turnos máximos atiende 
              cada profesional por día?
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Referencia visual (base: 8 turnos/día):
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>⚪ Menos de 50% — Agenda con baja utilización</li>
              <li>🟢 50–80% — Carga manejable, zona óptima</li>
              <li>🟡 80–100% — Agenda cargada, monitorear</li>
              <li>🔴 Más de 100% — Supera la capacidad estimada (revisar con el centro)</li>
            </ul>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Criterio de alertas:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>⚠️ <strong>Sobrecarga</strong> — promedio de turnos por día supera 10</li>
              <li>⚠️ <strong>Alta cancelación</strong> — tasa de cancelación supera el 30%</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
