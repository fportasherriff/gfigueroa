import { useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, UserX, Clock, DollarSign } from 'lucide-react';
import { KPICard } from '../KPICard';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency, calculateTrend } from '@/lib/formatters';
import type { OperacionesDiario, OperacionesCapacidad } from '@/types/dashboard';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';

interface OperacionesKPIsProps {
  operacionesData: OperacionesDiario[];
  capacidadData: OperacionesCapacidad[];
  isLoading: boolean;
}

export const OperacionesKPIs = ({ operacionesData, capacidadData, isLoading }: OperacionesKPIsProps) => {
  const kpis = useMemo(() => {
    if (!operacionesData.length) return null;

    // Find the last month with data instead of using calendar current month
    const sortedDates = operacionesData.map(d => d.fecha).sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    const lastDateParsed = parseISO(lastDate);
    
    const currentMonthStart = format(startOfMonth(lastDateParsed), 'yyyy-MM-dd');
    const previousMonthStart = format(startOfMonth(subMonths(lastDateParsed, 1)), 'yyyy-MM-dd');
    const previousMonthEnd = currentMonthStart;

    // Current month data (last month with data)
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
    const prevTurnosCancelados = previousMonthData.reduce((acc, d) => acc + Number(d.turnos_cancelados || 0), 0);
    const prevTurnosInasistidos = previousMonthData.reduce((acc, d) => acc + Number(d.turnos_inasistidos || 0), 0);
    const prevRevenue = previousMonthData.reduce((acc, d) => acc + Number(d.revenue || 0), 0);
    
    const prevTasaAsistencia = prevTurnosAgendados > 0 ? (prevTurnosAsistidos / prevTurnosAgendados) * 100 : 0;
    const prevTasaCancelacion = prevTurnosAgendados > 0 ? (prevTurnosCancelados / prevTurnosAgendados) * 100 : 0;
    const prevTasaInasistencia = prevTurnosAgendados > 0 ? (prevTurnosInasistidos / prevTurnosAgendados) * 100 : 0;
    const prevRevenuePorTurno = prevTurnosAsistidos > 0 ? prevRevenue / prevTurnosAsistidos : 0;

    // Capacidad del último mes
    const lastMonthCapacidad = capacidadData.filter(d => d.periodo_mes >= currentMonthStart);
    const ocupacionPromedio = lastMonthCapacidad.length > 0
      ? lastMonthCapacidad.reduce((acc, d) => acc + Number(d.ocupacion_estimada_pct || 0), 0) / lastMonthCapacidad.length
      : 0;

    return {
      turnosAgendados: {
        value: turnosAgendados,
        trend: calculateTrend(turnosAgendados, prevTurnosAgendados),
      },
      tasaAsistencia: {
        value: tasaAsistencia,
        trend: calculateTrend(tasaAsistencia, prevTasaAsistencia),
      },
      tasaCancelacion: {
        value: tasaCancelacion,
        trend: calculateTrend(tasaCancelacion, prevTasaCancelacion),
      },
      tasaInasistencia: {
        value: tasaInasistencia,
        trend: calculateTrend(tasaInasistencia, prevTasaInasistencia),
      },
      ocupacionReal: {
        value: ocupacionPromedio,
        trend: 0,
      },
      revenuePorTurno: {
        value: revenuePorTurno,
        trend: calculateTrend(revenuePorTurno, prevRevenuePorTurno),
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
          description: "Total de turnos agendados en el último mes con datos.",
          calculation: "SUM(turnos_agendados)",
          source: "dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Tasa Asistencia"
        value={formatPercent(kpis.tasaAsistencia.value)}
        trend={kpis.tasaAsistencia.trend}
        icon={<CheckCircle className="w-4 h-4" />}
        colorClass={getAsistenciaColor(kpis.tasaAsistencia.value)}
        tooltip={{
          description: "Porcentaje de turnos que efectivamente se realizaron. Objetivo: >70%",
          calculation: "(SUM(turnos_asistidos) / SUM(turnos_agendados)) × 100",
          source: "dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Tasa Cancelación"
        value={formatPercent(kpis.tasaCancelacion.value)}
        trend={kpis.tasaCancelacion.trend}
        icon={<XCircle className="w-4 h-4" />}
        colorClass={getCancelacionColor(kpis.tasaCancelacion.value)}
        tooltip={{
          description: "Porcentaje de turnos cancelados. Objetivo: <15%",
          calculation: "(SUM(turnos_cancelados) / SUM(turnos_agendados)) × 100",
          source: "dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Tasa Inasistencia"
        value={formatPercent(kpis.tasaInasistencia.value)}
        trend={kpis.tasaInasistencia.trend}
        icon={<UserX className="w-4 h-4" />}
        colorClass={getCancelacionColor(kpis.tasaInasistencia.value)}
        tooltip={{
          description: "Porcentaje de turnos donde el paciente no asistió. Objetivo: <10%",
          calculation: "(SUM(turnos_inasistidos) / SUM(turnos_agendados)) × 100",
          source: "dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Ocupación Real"
        value={formatPercent(kpis.ocupacionReal.value)}
        trend={kpis.ocupacionReal.trend}
        icon={<Clock className="w-4 h-4" />}
        colorClass={getOcupacionColor(kpis.ocupacionReal.value)}
        tooltip={{
          description: "Porcentaje de capacidad utilizada del último mes. Óptimo: 50-80%",
          calculation: "AVG(ocupacion_estimada_pct) del período",
          source: "dashboard.operaciones_capacidad"
        }}
      />

      <KPICard
        title="Facturación/Turno"
        value={formatCurrency(kpis.revenuePorTurno.value)}
        trend={kpis.revenuePorTurno.trend}
        icon={<DollarSign className="w-4 h-4" />}
        tooltip={{
          description: "Ingreso promedio por turno asistido en el último mes.",
          calculation: "SUM(revenue) / SUM(turnos_asistidos)",
          source: "dashboard.operaciones_diario"
        }}
      />
    </div>
  );
};
