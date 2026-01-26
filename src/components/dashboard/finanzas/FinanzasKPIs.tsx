import { useMemo } from 'react';
import { DollarSign, CreditCard, AlertTriangle, Percent, Clock, AlertCircle } from 'lucide-react';
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
    if (!finanzasData.length && !deudoresData.length) return null;

    const now = new Date();
    const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const previousMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
    const previousMonthEnd = format(startOfMonth(now), 'yyyy-MM-dd');

    // Current month data
    const currentMonthData = finanzasData.filter(d => d.fecha >= currentMonthStart);
    const previousMonthData = finanzasData.filter(
      d => d.fecha >= previousMonthStart && d.fecha < previousMonthEnd
    );

    // Aggregations - Current Period (using revenue_facturado directly from view)
    const revenueFacturadoActual = currentMonthData.reduce((acc, d) => acc + Number(d.revenue_facturado || 0), 0);
    
    // Cobrado real - usando la proporción real de turnos con revenue vs turnos asistidos
    const turnosAsistidosActual = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_asistidos || 0), 0);
    const turnosConRevenueActual = currentMonthData.reduce((acc, d) => acc + Number(d.turnos_con_revenue || 0), 0);
    
    // Tasa de cobro real basada en datos
    const tasaCobroReal = turnosAsistidosActual > 0 
      ? (turnosConRevenueActual / turnosAsistidosActual) * 100 
      : 0;
    
    // Cobrado estimado basado en tasa real
    const revenueCobradoActual = revenueFacturadoActual * (tasaCobroReal / 100);
    const gapCobroPeriodo = revenueFacturadoActual - revenueCobradoActual;

    // Previous month aggregations
    const revenueFacturadoAnterior = previousMonthData.reduce((acc, d) => acc + Number(d.revenue_facturado || 0), 0);
    const turnosAsistidosAnterior = previousMonthData.reduce((acc, d) => acc + Number(d.turnos_asistidos || 0), 0);
    const turnosConRevenueAnterior = previousMonthData.reduce((acc, d) => acc + Number(d.turnos_con_revenue || 0), 0);
    const tasaCobroAnterior = turnosAsistidosAnterior > 0 
      ? (turnosConRevenueAnterior / turnosAsistidosAnterior) * 100 
      : 0;
    const revenueCobradoAnterior = revenueFacturadoAnterior * (tasaCobroAnterior / 100);
    const gapCobroAnterior = revenueFacturadoAnterior - revenueCobradoAnterior;

    // Deudores metrics - using real data from view
    const deudaHistoricaTotal = deudoresData.reduce((acc, d) => acc + Number(d.deuda_total || 0), 0);
    
    const deudaMayor60 = deudoresData
      .filter(d => (d.dias_desde_ultimo_pago || 0) > 60)
      .reduce((acc, d) => acc + Number(d.deuda_total || 0), 0);

    return {
      revenueFacturado: {
        value: revenueFacturadoActual,
        trend: calculateTrend(revenueFacturadoActual, revenueFacturadoAnterior),
      },
      revenueCobrado: {
        value: revenueCobradoActual,
        trend: calculateTrend(revenueCobradoActual, revenueCobradoAnterior),
      },
      gapCobroPeriodo: {
        value: gapCobroPeriodo,
        trend: calculateTrend(gapCobroPeriodo, gapCobroAnterior),
      },
      tasaCobro: {
        value: tasaCobroReal,
        trend: tasaCobroReal - tasaCobroAnterior, // Diferencia en puntos porcentuales
      },
      deudaHistorica: {
        value: deudaHistoricaTotal,
        trend: 0, // Sin comparación por ahora (datos históricos)
      },
      deudaMayor60: {
        value: deudaMayor60,
        trend: 0, // Sin comparación (crítico)
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        title="Revenue Facturado"
        value={formatCurrency(kpis.revenueFacturado.value)}
        trend={kpis.revenueFacturado.trend}
        icon={<DollarSign className="w-4 h-4" />}
        tooltip={{
          description: "Total facturado en el período seleccionado (mes actual)",
          calculation: "SUM(revenue_facturado) del período"
        }}
      />

      <KPICard
        title="Cobrado Real"
        value={formatCurrency(kpis.revenueCobrado.value)}
        trend={kpis.revenueCobrado.trend}
        icon={<CreditCard className="w-4 h-4" />}
        tooltip={{
          description: "Monto efectivamente cobrado del período",
          calculation: "Revenue × (Turnos con revenue / Turnos asistidos)"
        }}
      />

      <KPICard
        title="Gap Cobro Período"
        value={formatCurrency(kpis.gapCobroPeriodo.value)}
        trend={kpis.gapCobroPeriodo.trend}
        trendInverse={true}
        icon={<AlertTriangle className="w-4 h-4" />}
        colorClass="text-amber-600"
        tooltip={{
          description: "Diferencia entre facturado y cobrado del período actual. No incluye deudas históricas.",
          calculation: "Facturado - Cobrado (período seleccionado)"
        }}
      />

      <KPICard
        title="Tasa Cobro %"
        value={formatPercent(kpis.tasaCobro.value)}
        trend={kpis.tasaCobro.trend}
        trendSuffix="pts"
        icon={<Percent className="w-4 h-4" />}
        colorClass={getTasaColor(kpis.tasaCobro.value)}
        tooltip={{
          description: "Porcentaje de turnos asistidos que fueron cobrados. Objetivo: >80%",
          calculation: "(Turnos con revenue / Turnos asistidos) × 100"
        }}
      />

      <KPICard
        title="Deuda Histórica Total"
        value={formatCurrency(kpis.deudaHistorica.value)}
        icon={<Clock className="w-4 h-4" />}
        colorClass="text-red-600"
        tooltip={{
          description: "Saldo total de deudas acumuladas de todos los tiempos. Incluye deudas antiguas y recientes.",
          calculation: "SUM(deuda_total) de todos los clientes con saldo pendiente"
        }}
      />

      <KPICard
        title="Deuda >60 días (Crítica)"
        value={formatCurrency(kpis.deudaMayor60.value)}
        icon={<AlertCircle className="w-4 h-4" />}
        colorClass="text-red-700"
        tooltip={{
          description: "Deuda de clientes con más de 60 días sin pagar. Requiere atención urgente.",
          calculation: "SUM(deuda) WHERE días_sin_pago > 60"
        }}
      />
    </div>
  );
};
