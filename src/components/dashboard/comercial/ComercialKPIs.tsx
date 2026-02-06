import { useMemo } from 'react';
import { Users, TrendingUp, Target, DollarSign, UserCheck, ShoppingCart } from 'lucide-react';
import { KPICard } from '../KPICard';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency, calculateTrend } from '@/lib/formatters';
import type { ComercialEmbudo, ComercialCanales } from '@/types/dashboard';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';

interface ComercialKPIsProps {
  embudoData: ComercialEmbudo[];
  canalesData: ComercialCanales[];
  isLoading: boolean;
}

export const ComercialKPIs = ({ embudoData, canalesData, isLoading }: ComercialKPIsProps) => {
  const kpis = useMemo(() => {
    if (!embudoData.length && !canalesData.length) return null;

    // Find last month with data instead of calendar current month
    let lastMonth = format(startOfMonth(new Date()), 'yyyy-MM');
    
    if (canalesData.length > 0) {
      const sortedMeses = canalesData.map(d => d.mes).filter(Boolean).sort();
      lastMonth = sortedMeses[sortedMeses.length - 1]?.substring(0, 7) || lastMonth;
    }
    
    const previousMonth = format(subMonths(parseISO(lastMonth + '-01'), 1), 'yyyy-MM');

    // Current month canales data
    const currentCanales = canalesData.filter(d => d.mes?.startsWith(lastMonth));
    const previousCanales = canalesData.filter(d => d.mes?.startsWith(previousMonth));
    
    // Aggregations from canales - Current
    const totalLeads = currentCanales.reduce((acc, d) => acc + Number(d.leads_generados || 0), 0);
    const totalConvertidos = currentCanales.reduce((acc, d) => acc + Number(d.clientes_convertidos || 0), 0);
    const totalRevenue = currentCanales.reduce((acc, d) => acc + Number(d.revenue_generado || 0), 0);
    const totalClientesActivos = currentCanales.reduce((acc, d) => acc + Number(d.clientes_activos_mes || 0), 0);
    
    // Previous month
    const prevLeads = previousCanales.reduce((acc, d) => acc + Number(d.leads_generados || 0), 0);
    const prevConvertidos = previousCanales.reduce((acc, d) => acc + Number(d.clientes_convertidos || 0), 0);
    const prevRevenue = previousCanales.reduce((acc, d) => acc + Number(d.revenue_generado || 0), 0);
    
    const tasaConversion = totalLeads > 0 ? (totalConvertidos / totalLeads) * 100 : 0;
    const prevTasaConversion = prevLeads > 0 ? (prevConvertidos / prevLeads) * 100 : 0;
    const revenuePorLead = totalLeads > 0 ? totalRevenue / totalLeads : 0;
    const prevRevenuePorLead = prevLeads > 0 ? prevRevenue / prevLeads : 0;

    // Embudo aggregations
    const leadCount = embudoData.filter(d => d.etapa === 'Lead').reduce((acc, d) => acc + Number(d.cantidad || 0), 0);
    const consultaCount = embudoData.filter(d => d.etapa === 'Consulta').reduce((acc, d) => acc + Number(d.cantidad || 0), 0);
    const tratamientoCount = embudoData.filter(d => d.etapa === 'Tratamiento').reduce((acc, d) => acc + Number(d.cantidad || 0), 0);

    return {
      totalLeads: {
        value: totalLeads || leadCount,
        trend: calculateTrend(totalLeads, prevLeads),
      },
      tasaConversion: {
        value: tasaConversion || (leadCount > 0 ? (consultaCount / leadCount) * 100 : 0),
        trend: calculateTrend(tasaConversion, prevTasaConversion),
      },
      clientesConvertidos: {
        value: totalConvertidos || consultaCount,
        trend: calculateTrend(totalConvertidos, prevConvertidos),
      },
      revenueTotal: {
        value: totalRevenue,
        trend: calculateTrend(totalRevenue, prevRevenue),
      },
      revenuePorLead: {
        value: revenuePorLead,
        trend: calculateTrend(revenuePorLead, prevRevenuePorLead),
      },
      clientesActivos: {
        value: totalClientesActivos || tratamientoCount,
        trend: 0,
      },
    };
  }, [embudoData, canalesData]);

  if (isLoading) {
    return <KPIGridSkeleton count={6} />;
  }

  if (!kpis) {
    return null;
  }

  const getTasaColor = (tasa: number) => {
    if (tasa >= 30) return 'text-green-600';
    if (tasa >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        title="Total Leads"
        value={formatNumber(kpis.totalLeads.value)}
        trend={kpis.totalLeads.trend}
        icon={<Users className="w-4 h-4" />}
        tooltip={{
          description: "Total de leads generados en el último mes con datos.",
          calculation: "SUM(leads_generados)",
          source: "dashboard.comercial_canales"
        }}
      />

      <KPICard
        title="Tasa Conversión"
        value={formatPercent(kpis.tasaConversion.value)}
        trend={kpis.tasaConversion.trend}
        icon={<Target className="w-4 h-4" />}
        colorClass={getTasaColor(kpis.tasaConversion.value)}
        tooltip={{
          description: "Porcentaje de leads que se convirtieron en clientes. Objetivo: >30%",
          calculation: "(SUM(clientes_convertidos) / SUM(leads_generados)) × 100",
          source: "dashboard.comercial_canales"
        }}
      />

      <KPICard
        title="Clientes Convertidos"
        value={formatNumber(kpis.clientesConvertidos.value)}
        trend={kpis.clientesConvertidos.trend}
        icon={<UserCheck className="w-4 h-4" />}
        tooltip={{
          description: "Leads que se convirtieron en clientes con consulta.",
          calculation: "SUM(clientes_convertidos)",
          source: "dashboard.comercial_canales"
        }}
      />

      <KPICard
        title="Facturación Total"
        value={formatCurrency(kpis.revenueTotal.value)}
        trend={kpis.revenueTotal.trend}
        icon={<DollarSign className="w-4 h-4" />}
        tooltip={{
          description: "Ingresos totales generados por los leads convertidos.",
          calculation: "SUM(revenue_generado)",
          source: "dashboard.comercial_canales"
        }}
      />

      <KPICard
        title="Facturación/Lead"
        value={formatCurrency(kpis.revenuePorLead.value)}
        trend={kpis.revenuePorLead.trend}
        icon={<TrendingUp className="w-4 h-4" />}
        tooltip={{
          description: "Ingreso promedio generado por cada lead (incluye no convertidos).",
          calculation: "SUM(revenue_generado) / SUM(leads_generados)",
          source: "dashboard.comercial_canales"
        }}
      />

      <KPICard
        title="Clientes Activos"
        value={formatNumber(kpis.clientesActivos.value)}
        trend={kpis.clientesActivos.trend}
        icon={<ShoppingCart className="w-4 h-4" />}
        tooltip={{
          description: "Clientes con actividad en el período actual.",
          calculation: "SUM(clientes_activos_mes)",
          source: "dashboard.comercial_canales"
        }}
      />
    </div>
  );
};
