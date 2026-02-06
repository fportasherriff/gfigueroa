import { useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, UserX, Clock, DollarSign } from 'lucide-react';
import { KPICard } from '../KPICard';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency, getMonthKey } from '@/lib/formatters';
import type { OperacionesDiario, OperacionesCapacidad } from '@/types/dashboard';

interface OperacionesKPIsProps {
  operacionesData: OperacionesDiario[];
  capacidadData: OperacionesCapacidad[];
  isLoading: boolean;
}

export const OperacionesKPIs = ({ operacionesData, capacidadData, isLoading }: OperacionesKPIsProps) => {
  const kpis = useMemo(() => {
    if (!operacionesData.length) return null;

    // Use all data in the filtered range (filters are applied in the hook)
    const sortedDates = operacionesData.map(d => d.fecha).sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    // Use local date parsing - get month key directly from string
    const currentMonthKey = getMonthKey(lastDate);
    const currentMonthStart = `${currentMonthKey}-01`;

    // Use all filtered data for aggregation
    const currentMonthData = operacionesData;

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

    // Capacidad del período filtrado
    const lastMonthCapacidad = capacidadData.filter(d => d.periodo_mes >= currentMonthStart);
    const ocupacionPromedio = lastMonthCapacidad.length > 0
      ? lastMonthCapacidad.reduce((acc, d) => acc + Number(d.ocupacion_estimada_pct || 0), 0) / lastMonthCapacidad.length
      : 0;

    return {
      turnosAgendados: {
        value: turnosAgendados,
      },
      tasaAsistencia: {
        value: tasaAsistencia,
      },
      tasaCancelacion: {
        value: tasaCancelacion,
      },
      tasaInasistencia: {
        value: tasaInasistencia,
      },
      ocupacionReal: {
        value: ocupacionPromedio,
      },
      revenuePorTurno: {
        value: revenuePorTurno,
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
        icon={<Calendar className="w-4 h-4" />}
        tooltip={{
          description: "Total de turnos agendados en el período seleccionado.",
          calculation: "SUM(turnos_agendados)",
          source: "dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Tasa Asistencia"
        value={formatPercent(kpis.tasaAsistencia.value)}
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
        icon={<Clock className="w-4 h-4" />}
        colorClass={getOcupacionColor(kpis.ocupacionReal.value)}
        tooltip={{
          description: "Porcentaje de capacidad utilizada. Óptimo: 50-80%",
          calculation: "AVG(ocupacion_estimada_pct) del período",
          source: "dashboard.operaciones_capacidad"
        }}
      />

      <KPICard
        title="Facturación/Turno"
        value={formatCurrency(kpis.revenuePorTurno.value)}
        icon={<DollarSign className="w-4 h-4" />}
        tooltip={{
          description: "Ingreso promedio por turno asistido.",
          calculation: "SUM(revenue) / SUM(turnos_asistidos)",
          source: "dashboard.operaciones_diario"
        }}
      />
    </div>
  );
};
