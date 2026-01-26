import { useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, UserX, Clock, DollarSign } from 'lucide-react';
import { KPICard } from '../KPICard';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency, calculateTrend } from '@/lib/formatters';
import type { OperacionesDiario, OperacionesCapacidad } from '@/types/dashboard';
import { startOfMonth, subMonths, format } from 'date-fns';

interface OperacionesKPIsProps {
  operacionesData: OperacionesDiario[];
  capacidadData: OperacionesCapacidad[];
  isLoading: boolean;
}

export const OperacionesKPIs = ({ operacionesData, capacidadData, isLoading }: OperacionesKPIsProps) => {
  const kpis = useMemo(() => {
    if (!operacionesData.length) return null;

    const now = new Date();
    const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const previousMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
    const previousMonthEnd = format(startOfMonth(now), 'yyyy-MM-dd');

    // Current month data
    const currentMonthData = operacionesData.filter(d => d.fecha >= currentMonthStart);
    const previousMonthData = operacionesData.filter(
      d => d.fecha >= previousMonthStart && d.fecha < previousMonthEnd
    );

    // Aggregations - Current
    const turnosAgendados = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_agendados || 0), 0);
    const turnosAsistidos = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_asistidos || 0), 0);
    const turnosCancelados = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_cancelados || 0), 0);
    const turnosInasistidos = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_inasistidos || 0), 0);
    const revenue = currentMonthData.reduce((acc, d) => acc + Number(d.revenue || 0), 0);

    const tasaAsistencia = turnosAgendados > 0 ? (turnosAsistidos / turnosAgendados) * 100 : 0;
    const tasaCancelacion = turnosAgendados > 0 ? (turnosCancelados / turnosAgendados) * 100 : 0;
    const tasaInasistencia = turnosAgendados > 0 ? (turnosInasistidos / turnosAgendados) * 100 : 0;
    const revenuePorTurno = turnosAsistidos > 0 ? revenue / turnosAsistidos : 0;

    // Previous month aggregations for trends
    const prevTurnosAgendados = previousMonthData.reduce((acc, d) => acc + Number(d.turnos_agendados || 0), 0);
    const prevTurnosAsistidos = previousMonthData.reduce((acc, d) => acc + Number(d.turnos_asistidos || 0), 0);

    // Capacidad promedio
    const ocupacionPromedio = capacidadData.length > 0
      ? capacidadData.reduce((acc, d) => acc + Number(d.ocupacion_estimada_pct || 0), 0) / capacidadData.length
      : 0;

    return {
      turnosAgendados: {
        value: turnosAgendados,
        trend: calculateTrend(turnosAgendados, prevTurnosAgendados),
      },
      tasaAsistencia: {
        value: tasaAsistencia,
        trend: 0,
      },
      tasaCancelacion: {
        value: tasaCancelacion,
        trend: 0,
      },
      tasaInasistencia: {
        value: tasaInasistencia,
        trend: 0,
      },
      ocupacionReal: {
        value: ocupacionPromedio,
        trend: 0,
      },
      revenuePorTurno: {
        value: revenuePorTurno,
        trend: 0,
      },
    };
  }, [operacionesData, capacidadData]);

  if (isLoading) {
    return <KPIGridSkeleton count={6} />;
  }

  if (!kpis) {
    return null;
  }

  const getAsistenciaColor = (tasa: number) => {
    if (tasa >= 70) return 'text-green-600';
    if (tasa >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCancelacionColor = (tasa: number) => {
    if (tasa < 15) return 'text-green-600';
    if (tasa < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOcupacionColor = (tasa: number) => {
    if (tasa >= 50 && tasa <= 80) return 'text-green-600';
    if (tasa >= 80 && tasa <= 90) return 'text-yellow-600';
    if (tasa > 90) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        title="Turnos Agendados"
        value={formatNumber(kpis.turnosAgendados.value)}
        trend={kpis.turnosAgendados.trend}
        icon={<Calendar className="w-4 h-4" />}
        tooltip={{
          description: "Total de turnos agendados en el período seleccionado",
          calculation: "COUNT(turnos)"
        }}
      />

      <KPICard
        title="Tasa Asistencia"
        value={formatPercent(kpis.tasaAsistencia.value)}
        icon={<CheckCircle className="w-4 h-4" />}
        colorClass={getAsistenciaColor(kpis.tasaAsistencia.value)}
        tooltip={{
          description: "Porcentaje de turnos que efectivamente se realizaron. Objetivo: >70%",
          calculation: "(Turnos asistidos / Turnos agendados) × 100"
        }}
      />

      <KPICard
        title="Tasa Cancelación"
        value={formatPercent(kpis.tasaCancelacion.value)}
        icon={<XCircle className="w-4 h-4" />}
        colorClass={getCancelacionColor(kpis.tasaCancelacion.value)}
        tooltip={{
          description: "Porcentaje de turnos cancelados. Objetivo: <15%",
          calculation: "(Turnos cancelados / Turnos agendados) × 100"
        }}
      />

      <KPICard
        title="Tasa Inasistencia"
        value={formatPercent(kpis.tasaInasistencia.value)}
        icon={<UserX className="w-4 h-4" />}
        colorClass={getCancelacionColor(kpis.tasaInasistencia.value)}
        tooltip={{
          description: "Porcentaje de turnos donde el paciente no asistió. Objetivo: <10%",
          calculation: "(Turnos inasistidos / Turnos agendados) × 100"
        }}
      />

      <KPICard
        title="Ocupación Real"
        value={formatPercent(kpis.ocupacionReal.value)}
        icon={<Clock className="w-4 h-4" />}
        colorClass={getOcupacionColor(kpis.ocupacionReal.value)}
        tooltip={{
          description: "Porcentaje de capacidad utilizada. Óptimo: 50-80%",
          calculation: "AVG(ocupacion_estimada_pct)"
        }}
      />

      <KPICard
        title="Revenue/Turno"
        value={formatCurrency(kpis.revenuePorTurno.value)}
        icon={<DollarSign className="w-4 h-4" />}
        tooltip={{
          description: "Ingreso promedio por turno asistido",
          calculation: "SUM(revenue) / COUNT(turnos_asistidos)"
        }}
      />
    </div>
  );
};
