import { useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, UserX, DollarSign, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency, getMonthKey } from '@/lib/formatters';
import type { OperacionesDiario } from '@/types/dashboard';

interface OperacionesKPIsProps {
  operacionesData: OperacionesDiario[];
  isLoading: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  valueColor: string;
  tooltip: { title: string; content: string; footer?: string };
}

const KPICard = ({ title, value, subtitle, icon, gradientFrom, gradientTo, valueColor, tooltip }: KPICardProps) => (
  <Card className="border-none shadow-sm hover:shadow-md transition-shadow h-full">
    <CardContent className="p-4 flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-semibold mb-1">{tooltip.title}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{tooltip.content}</p>
              {tooltip.footer && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  {tooltip.footer}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      <div className="flex-1">
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {/* Bottom gradient bar - always at bottom */}
      <div
        className={`h-1 rounded-full mt-4 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
      />
    </CardContent>
  </Card>
);

export const OperacionesKPIs = ({ operacionesData, isLoading }: OperacionesKPIsProps) => {
  const kpis = useMemo(() => {
    if (!operacionesData.length) return null;

    const currentMonthData = operacionesData;

    const turnosAgendados = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_agendados || 0), 0);
    const turnosAsistidos = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_asistidos || 0), 0);
    const turnosCancelados = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_cancelados || 0), 0);
    const turnosInasistidos = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_inasistidos || 0), 0);
    const revenue = currentMonthData.reduce((acc, d) => acc + Number(d.revenue || 0), 0);

    const tasaAsistencia = turnosAgendados > 0 ? (turnosAsistidos / turnosAgendados) * 100 : 0;
    const tasaCancelacion = turnosAgendados > 0 ? (turnosCancelados / turnosAgendados) * 100 : 0;
    const tasaInasistencia = turnosAgendados > 0 ? (turnosInasistidos / turnosAgendados) * 100 : 0;
    const revenuePorTurno = turnosAsistidos > 0 ? revenue / turnosAsistidos : 0;

    return {
      turnosAgendados,
      tasaAsistencia,
      tasaCancelacion,
      tasaInasistencia,
      revenuePorTurno,
    };
  }, [operacionesData]);

  if (isLoading) {
    return <KPIGridSkeleton count={5} />;
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

  const gradientForColor = (color: string) => {
    if (color.includes('green'))  return { from: 'from-green-400',  to: 'to-green-600'  };
    if (color.includes('yellow')) return { from: 'from-yellow-400', to: 'to-yellow-600' };
    return { from: 'from-red-400', to: 'to-red-600' };
  };

  const asistenciaColor = getAsistenciaColor(kpis.tasaAsistencia);
  const cancelacionColor = getCancelacionColor(kpis.tasaCancelacion);
  const inasistenciaColor = getCancelacionColor(kpis.tasaInasistencia);

  const gAsistencia = gradientForColor(asistenciaColor);
  const gCancelacion = gradientForColor(cancelacionColor);
  const gInasistencia = gradientForColor(inasistenciaColor);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        title="Turnos Agendados"
        value={formatNumber(kpis.turnosAgendados)}
        subtitle="Total en el período seleccionado"
        icon={<Calendar className="w-4 h-4 text-slate-500" />}
        gradientFrom="from-slate-400"
        gradientTo="to-slate-600"
        valueColor="text-slate-700"
        tooltip={{
          title: "¿Qué cuenta?",
          content: "Total de turnos agendados en el período seleccionado, independientemente de su estado final.",
          footer: "📊 Vista: dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Tasa Asistencia"
        value={formatPercent(kpis.tasaAsistencia)}
        subtitle="Meta: ≥70%"
        icon={<CheckCircle className={`w-4 h-4 ${asistenciaColor}`} />}
        gradientFrom={gAsistencia.from}
        gradientTo={gAsistencia.to}
        valueColor={asistenciaColor}
        tooltip={{
          title: "¿Cómo se calcula?",
          content: "Porcentaje de turnos que efectivamente se realizaron.\nFórmula: SUM(turnos_asistidos) / SUM(turnos_agendados) × 100",
          footer: "📊 Vista: dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Tasa Cancelación"
        value={formatPercent(kpis.tasaCancelacion)}
        subtitle="Meta: <15%"
        icon={<XCircle className={`w-4 h-4 ${cancelacionColor}`} />}
        gradientFrom={gCancelacion.from}
        gradientTo={gCancelacion.to}
        valueColor={cancelacionColor}
        tooltip={{
          title: "¿Cómo se calcula?",
          content: "Porcentaje de turnos cancelados sobre el total agendado.\nFórmula: SUM(turnos_cancelados) / SUM(turnos_agendados) × 100",
          footer: "📊 Vista: dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Tasa Inasistencia"
        value={formatPercent(kpis.tasaInasistencia)}
        subtitle="Meta: <10%"
        icon={<UserX className={`w-4 h-4 ${inasistenciaColor}`} />}
        gradientFrom={gInasistencia.from}
        gradientTo={gInasistencia.to}
        valueColor={inasistenciaColor}
        tooltip={{
          title: "¿Cómo se calcula?",
          content: "Porcentaje de turnos donde el paciente no asistió.\nFórmula: SUM(turnos_inasistidos) / SUM(turnos_agendados) × 100",
          footer: "📊 Vista: dashboard.operaciones_diario"
        }}
      />

      <KPICard
        title="Facturación / Turno"
        value={formatCurrency(kpis.revenuePorTurno)}
        subtitle="Ingreso promedio por turno asistido"
        icon={<DollarSign className="w-4 h-4 text-blue-500" />}
        gradientFrom="from-blue-400"
        gradientTo="to-blue-600"
        valueColor="text-blue-600"
        tooltip={{
          title: "¿Cómo se calcula?",
          content: "Ingreso promedio generado por cada turno asistido.\nFórmula: SUM(revenue) / SUM(turnos_asistidos)",
          footer: "📊 Vista: dashboard.operaciones_diario"
        }}
      />
    </div>
  );
};
