import { useMemo } from 'react';
import { Users, TrendingUp, Target, DollarSign, UserCheck, RefreshCw } from 'lucide-react';
import { KPICard } from '../KPICard';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency } from '@/lib/formatters';
import type { ComercialEmbudo, ComercialCanales } from '@/types/dashboard';

interface ComercialKPIsProps {
  embudoData: ComercialEmbudo[];
  canalesData: ComercialCanales[];
  isLoading: boolean;
}

export const ComercialKPIs = ({ embudoData, canalesData, isLoading }: ComercialKPIsProps) => {
  const kpis = useMemo(() => {
    if (!embudoData.length && !canalesData.length) return null;

    const totalClientes = embudoData.reduce((acc, d) => acc + Number(d.clientes_nuevos || 0), 0);
    const totalConsulta = embudoData.reduce((acc, d) => acc + Number(d.con_primera_consulta || 0), 0);
    const totalRecurrentes = embudoData.reduce((acc, d) => acc + Number(d.recurrentes || 0), 0);

    const pctConsulta = totalClientes > 0 ? (totalConsulta / totalClientes) * 100 : 0;
    const pctRecurrentes = totalClientes > 0 ? (totalRecurrentes / totalClientes) * 100 : 0;

    const revenueTotal = canalesData.reduce((acc, d) => acc + Number(d.revenue_total || 0), 0);
    const totalClientesCanales = canalesData.reduce((acc, d) => acc + Number(d.total_clientes || 0), 0);

    return {
      totalClientes: totalClientes || totalClientesCanales,
      pctConsulta,
      totalConsulta,
      revenueTotal,
      revenuePorCliente: totalClientesCanales > 0 ? revenueTotal / totalClientesCanales : 0,
      totalRecurrentes,
      pctRecurrentes,
    };
  }, [embudoData, canalesData]);

  if (isLoading) {
    return <KPIGridSkeleton count={6} />;
  }

  if (!kpis) {
    return null;
  }

  const getConsultaColor = (pct: number) => {
    if (pct >= 60) return 'text-green-600';
    if (pct >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRevenueColor = (rev: number) => {
    if (rev >= 80000) return 'text-green-600';
    if (rev >= 50000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecurrenteColor = (pct: number) => {
    if (pct >= 25) return 'text-green-600';
    if (pct >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        title="Clientes Registrados"
        value={formatNumber(kpis.totalClientes)}
        icon={<Users className="w-4 h-4" />}
        tooltip={{
          description: "Total de clientes dados de alta en el período.",
          calculation: "SUM(clientes_nuevos)",
          source: "dashboard.comercial_embudo"
        }}
      />

      <KPICard
        title="% Primera Consulta"
        value={formatPercent(kpis.pctConsulta)}
        icon={<Target className="w-4 h-4" />}
        colorClass={getConsultaColor(kpis.pctConsulta)}
        tooltip={{
          description: "Porcentaje de clientes que tuvieron al menos 1 consulta.",
          calculation: "SUM(con_primera_consulta) / SUM(clientes_nuevos) × 100",
          source: "dashboard.comercial_embudo"
        }}
      />

      <KPICard
        title="Llegaron a Consulta"
        value={formatNumber(kpis.totalConsulta)}
        icon={<UserCheck className="w-4 h-4" />}
        tooltip={{
          description: "Clientes que asistieron a al menos 1 turno.",
          calculation: "SUM(con_primera_consulta)",
          source: "dashboard.comercial_embudo"
        }}
      />

      <KPICard
        title="Facturación Total"
        value={formatCurrency(kpis.revenueTotal)}
        icon={<DollarSign className="w-4 h-4" />}
        tooltip={{
          description: "Revenue total generado por todos los canales.",
          calculation: "SUM(revenue_total)",
          source: "dashboard.comercial_canales"
        }}
      />

      <KPICard
        title="Facturación Promedio por Cliente"
        value={formatCurrency(kpis.revenuePorCliente)}
        icon={<TrendingUp className="w-4 h-4" />}
        colorClass={getRevenueColor(kpis.revenuePorCliente)}
        tooltip={{
          description: "Revenue promedio por cliente.",
          calculation: "SUM(revenue_total) / SUM(total_clientes)",
          source: "dashboard.comercial_canales"
        }}
      />

      <KPICard
        title="Son Recurrentes (3+ turnos)"
        value={formatNumber(kpis.totalRecurrentes)}
        icon={<RefreshCw className="w-4 h-4" />}
        colorClass={getRecurrenteColor(kpis.pctRecurrentes)}
        trendLabel={`${formatPercent(kpis.pctRecurrentes)} del total`}
        tooltip={{
          description: "Clientes con 3 o más turnos asistidos.",
          calculation: "SUM(recurrentes) — % = SUM(recurrentes) / SUM(clientes_nuevos) × 100",
          source: "dashboard.comercial_embudo"
        }}
      />
    </div>
  );
};
