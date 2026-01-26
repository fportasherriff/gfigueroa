import { useMemo } from 'react';
import { Users, TrendingUp, Target, DollarSign, UserCheck, ShoppingCart } from 'lucide-react';
import { KPICard } from '../KPICard';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency, calculateTrend } from '@/lib/formatters';
import type { ComercialEmbudo, ComercialCanales } from '@/types/dashboard';
import { startOfMonth, subMonths, format } from 'date-fns';

interface ComercialKPIsProps {
  embudoData: ComercialEmbudo[];
  canalesData: ComercialCanales[];
  isLoading: boolean;
}

export const ComercialKPIs = ({ embudoData, canalesData, isLoading }: ComercialKPIsProps) => {
  const kpis = useMemo(() => {
    if (!embudoData.length && !canalesData.length) return null;

    const now = new Date();
    const currentMonthStart = format(startOfMonth(now), 'yyyy-MM');

    // Current month canales data
    const currentCanales = canalesData.filter(d => d.mes?.startsWith(currentMonthStart));
    
    // Aggregations from canales
    const totalLeads = currentCanales.reduce((acc, d) => acc + Number(d.leads_generados || 0), 0);
    const totalConvertidos = currentCanales.reduce((acc, d) => acc + Number(d.clientes_convertidos || 0), 0);
    const totalRevenue = currentCanales.reduce((acc, d) => acc + Number(d.revenue_generado || 0), 0);
    const totalClientesActivos = currentCanales.reduce((acc, d) => acc + Number(d.clientes_activos_mes || 0), 0);
    
    const tasaConversion = totalLeads > 0 ? (totalConvertidos / totalLeads) * 100 : 0;
    const revenuePorLead = totalLeads > 0 ? totalRevenue / totalLeads : 0;
    const revenuePorCliente = totalConvertidos > 0 ? totalRevenue / totalConvertidos : 0;

    // Embudo aggregations
    const leadCount = embudoData.filter(d => d.etapa === 'Lead').reduce((acc, d) => acc + Number(d.cantidad || 0), 0);
    const consultaCount = embudoData.filter(d => d.etapa === 'Consulta').reduce((acc, d) => acc + Number(d.cantidad || 0), 0);
    const tratamientoCount = embudoData.filter(d => d.etapa === 'Tratamiento').reduce((acc, d) => acc + Number(d.cantidad || 0), 0);
    const recurrenteCount = embudoData.filter(d => d.etapa === 'Recurrente').reduce((acc, d) => acc + Number(d.cantidad || 0), 0);

    return {
      totalLeads: {
        value: totalLeads || leadCount,
        trend: 0,
      },
      tasaConversion: {
        value: tasaConversion || (leadCount > 0 ? (consultaCount / leadCount) * 100 : 0),
        trend: 0,
      },
      clientesConvertidos: {
        value: totalConvertidos || consultaCount,
        trend: 0,
      },
      revenueTotal: {
        value: totalRevenue,
        trend: 0,
      },
      revenuePorLead: {
        value: revenuePorLead,
        trend: 0,
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
        icon={<Users className="w-4 h-4" />}
        tooltip={{
          description: "Total de leads generados en el período",
          calculation: "COUNT(leads)"
        }}
      />

      <KPICard
        title="Tasa Conversión"
        value={formatPercent(kpis.tasaConversion.value)}
        icon={<Target className="w-4 h-4" />}
        colorClass={getTasaColor(kpis.tasaConversion.value)}
        tooltip={{
          description: "Porcentaje de leads que realizaron al menos una consulta. Objetivo: >30%",
          calculation: "(Clientes convertidos / Leads) × 100"
        }}
      />

      <KPICard
        title="Clientes Convertidos"
        value={formatNumber(kpis.clientesConvertidos.value)}
        icon={<UserCheck className="w-4 h-4" />}
        tooltip={{
          description: "Leads que se convirtieron en clientes con consulta",
          calculation: "COUNT(clientes con consulta)"
        }}
      />

      <KPICard
        title="Revenue Total"
        value={formatCurrency(kpis.revenueTotal.value)}
        icon={<DollarSign className="w-4 h-4" />}
        tooltip={{
          description: "Ingresos totales generados por los leads convertidos",
          calculation: "SUM(revenue_generado)"
        }}
      />

      <KPICard
        title="Revenue/Lead"
        value={formatCurrency(kpis.revenuePorLead.value)}
        icon={<TrendingUp className="w-4 h-4" />}
        tooltip={{
          description: "Ingreso promedio generado por cada lead (incluye no convertidos)",
          calculation: "Revenue Total / Total Leads"
        }}
      />

      <KPICard
        title="Clientes Activos"
        value={formatNumber(kpis.clientesActivos.value)}
        icon={<ShoppingCart className="w-4 h-4" />}
        tooltip={{
          description: "Clientes con actividad en el período actual",
          calculation: "COUNT(clientes con tratamiento)"
        }}
      />
    </div>
  );
};
