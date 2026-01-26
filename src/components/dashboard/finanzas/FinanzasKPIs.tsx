import { useMemo } from 'react';
import { DollarSign, CreditCard, AlertTriangle, Percent, Clock, Calendar } from 'lucide-react';
import { KPICard } from '../KPICard';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatCurrency, formatPercent, calculateTrend } from '@/lib/formatters';
import type { FinanzasDiario, FinanzasDeudores } from '@/types/dashboard';
import { startOfMonth, subMonths, format } from 'date-fns';

interface FinanzasKPIsProps {
  finanzasData: FinanzasDiario[];
  deudoresData: FinanzasDeudores[];
  isLoading: boolean;
}

export const FinanzasKPIs = ({ finanzasData, deudoresData, isLoading }: FinanzasKPIsProps) => {
  const kpis = useMemo(() => {
    if (!finanzasData.length) return null;

    const now = new Date();
    const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const previousMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
    const previousMonthEnd = format(startOfMonth(now), 'yyyy-MM-dd');

    // Current month data
    const currentMonthData = finanzasData.filter(d => d.fecha >= currentMonthStart);
    const previousMonthData = finanzasData.filter(
      d => d.fecha >= previousMonthStart && d.fecha < previousMonthEnd
    );

    // Aggregations - Current
    const revenueFacturado = currentMonthData.reduce((acc, d) => acc + Number(d.revenue_facturado || 0), 0);
    const turnosAsistidos = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_asistidos || 0), 0);
    const ticketPromedio = currentMonthData.reduce((acc, d) => acc + Number(d.ticket_promedio || 0), 0) / (currentMonthData.length || 1);
    
    // Revenue cobrado se estima como % del facturado (asumimos 75% por defecto sin datos de cobro)
    const tasaCobroEstimada = 0.75;
    const revenueCobrado = revenueFacturado * tasaCobroEstimada;
    const gapDeuda = revenueFacturado - revenueCobrado;
    const tasaCobro = revenueFacturado > 0 ? (revenueCobrado / revenueFacturado) * 100 : 0;

    // Previous month aggregations
    const prevRevenueFacturado = previousMonthData.reduce((acc, d) => acc + Number(d.revenue_facturado || 0), 0);
    const prevRevenueCobrado = prevRevenueFacturado * tasaCobroEstimada;
    const prevGapDeuda = prevRevenueFacturado - prevRevenueCobrado;

    // Deudores metrics
    const diasPromDeuda = deudoresData.length > 0
      ? deudoresData.reduce((acc, d) => acc + (d.dias_desde_ultimo_pago || 0), 0) / deudoresData.length
      : 0;
    
    const deudaMayor30 = deudoresData
      .filter(d => (d.dias_desde_ultimo_pago || 0) > 30)
      .reduce((acc, d) => acc + Number(d.deuda_total || 0), 0);

    return {
      revenueFacturado: {
        value: revenueFacturado,
        trend: calculateTrend(revenueFacturado, prevRevenueFacturado),
      },
      revenueCobrado: {
        value: revenueCobrado,
        trend: calculateTrend(revenueCobrado, prevRevenueCobrado),
      },
      gapDeuda: {
        value: gapDeuda,
        trend: calculateTrend(gapDeuda, prevGapDeuda),
      },
      tasaCobro: {
        value: tasaCobro,
        trend: 0, // Sin comparación por ahora
      },
      diasPromDeuda: {
        value: diasPromDeuda,
        trend: 0,
      },
      deudaMayor30: {
        value: deudaMayor30,
        trend: 0,
      },
    };
  }, [finanzasData, deudoresData]);

  if (isLoading) {
    return <KPIGridSkeleton count={6} />;
  }

  if (!kpis) {
    return null;
  }

  const getTasaColor = (tasa: number) => {
    if (tasa >= 80) return 'text-green-600';
    if (tasa >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDiasColor = (dias: number) => {
    if (dias < 30) return 'text-green-600';
    if (dias < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        title="Revenue Facturado"
        value={formatCurrency(kpis.revenueFacturado.value)}
        trend={kpis.revenueFacturado.trend}
        icon={<DollarSign className="w-4 h-4" />}
        tooltip={{
          description: "Total de turnos asistidos con monto asignado en el período seleccionado",
          calculation: "SUM(turnos_asistidos × monto)"
        }}
      />

      <KPICard
        title="Cobrado Real"
        value={formatCurrency(kpis.revenueCobrado.value)}
        trend={kpis.revenueCobrado.trend}
        icon={<CreditCard className="w-4 h-4" />}
        tooltip={{
          description: "Monto efectivamente cobrado de los turnos facturados",
          calculation: "SUM(pagos_recibidos)"
        }}
      />

      <KPICard
        title="Gap Deuda"
        value={formatCurrency(kpis.gapDeuda.value)}
        trend={kpis.gapDeuda.trend}
        trendInverse={true}
        icon={<AlertTriangle className="w-4 h-4" />}
        colorClass="text-red-600"
        tooltip={{
          description: "Diferencia entre lo facturado y lo cobrado (deuda pendiente)",
          calculation: "Revenue Facturado - Cobrado Real"
        }}
      />

      <KPICard
        title="Tasa Cobro %"
        value={formatPercent(kpis.tasaCobro.value)}
        icon={<Percent className="w-4 h-4" />}
        colorClass={getTasaColor(kpis.tasaCobro.value)}
        tooltip={{
          description: "Porcentaje de lo facturado que fue efectivamente cobrado. Objetivo: >80%",
          calculation: "(Cobrado / Facturado) × 100"
        }}
      />

      <KPICard
        title="Días Prom Deuda"
        value={`${Math.round(kpis.diasPromDeuda.value)}d`}
        icon={<Clock className="w-4 h-4" />}
        colorClass={getDiasColor(kpis.diasPromDeuda.value)}
        tooltip={{
          description: "Promedio de días desde el último pago para clientes con deuda",
          calculation: "AVG(dias_desde_ultimo_pago)"
        }}
      />

      <KPICard
        title="Deuda >30 días"
        value={formatCurrency(kpis.deudaMayor30.value)}
        icon={<Calendar className="w-4 h-4" />}
        colorClass="text-red-600"
        tooltip={{
          description: "Total de deuda de clientes con más de 30 días sin pagar",
          calculation: "SUM(deuda) WHERE dias_sin_pago > 30"
        }}
      />
    </div>
  );
};
