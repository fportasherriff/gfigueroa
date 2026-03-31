import { useMemo } from 'react';
import { Users, Target, UserCheck, DollarSign, TrendingUp, RefreshCw, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber, formatPercent, formatCurrency } from '@/lib/formatters';
import type { ComercialEmbudo, ComercialCanales } from '@/types/dashboard';

interface ComercialKPIsProps {
  embudoData: ComercialEmbudo[];
  canalesData: ComercialCanales[];
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

      {/* Bottom gradient bar */}
      <div
        className={`h-1 rounded-full mt-4 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
      />
    </CardContent>
  </Card>
);

export const ComercialKPIs = ({ embudoData, canalesData, isLoading }: ComercialKPIsProps) => {
  const kpis = useMemo(() => {
    if (!embudoData.length && !canalesData.length) return null;

    // Aggregate by etapa
    const byEtapa: Record<string, number> = { alta: 0, primera_consulta: 0, primer_pago: 0, recurrente: 0 };
    for (const row of embudoData) {
      const total = Number(row.nuevos || 0) + Number(row.reactivados_dormidos || 0) + Number(row.resucitados || 0);
      if (byEtapa[row.etapa] !== undefined) {
        byEtapa[row.etapa] += total;
      }
    }

    const totalAltas = byEtapa.alta || 0;
    const totalConsulta = byEtapa.primera_consulta || 0;
    const totalPago = byEtapa.primer_pago || 0;
    const totalRecurrentes = byEtapa.recurrente || 0;

    const pctConsulta = totalAltas > 0 ? (totalConsulta / totalAltas) * 100 : 0;
    const pctPago = totalAltas > 0 ? (totalPago / totalAltas) * 100 : 0;
    const pctRecurrente = totalAltas > 0 ? (totalRecurrentes / totalAltas) * 100 : 0;

    const revenueTotal = canalesData.reduce((acc, d) => acc + Number(d.revenue_total || 0), 0);
    const totalClientesCanales = canalesData.reduce((acc, d) => acc + Number(d.total_clientes || 0), 0);
    const revenuePorCliente = totalClientesCanales > 0 ? revenueTotal / totalClientesCanales : 0;

    return {
      totalClientes: totalAltas || totalClientesCanales,
      pctConsulta, totalConsulta,
      pctPago, totalPago,
      revenueTotal, revenuePorCliente,
      totalRecurrentes, pctRecurrente,
    };
  }, [embudoData, canalesData]);

  if (isLoading) return <KPIGridSkeleton count={6} />;
  if (!kpis) return null;

  const consultaColor   = kpis.pctConsulta   >= 60 ? 'text-green-600' : kpis.pctConsulta   >= 40 ? 'text-yellow-600' : 'text-red-600';
  const pagoColor       = kpis.pctPago       >= 18 ? 'text-green-600' : kpis.pctPago       >= 10 ? 'text-yellow-600' : 'text-red-600';
  const recurrenteColor = kpis.pctRecurrente >= 28 ? 'text-green-600' : kpis.pctRecurrente >= 18 ? 'text-yellow-600' : 'text-red-600';
  const revenueColor    = kpis.revenuePorCliente >= 80000 ? 'text-green-600' : kpis.revenuePorCliente >= 50000 ? 'text-yellow-600' : 'text-red-600';

  const gradientForColor = (color: string) => {
    if (color.includes('green'))  return { from: 'from-green-400',  to: 'to-green-600'  };
    if (color.includes('yellow')) return { from: 'from-yellow-400', to: 'to-yellow-600' };
    return { from: 'from-red-400', to: 'to-red-600' };
  };

  const gConsulta   = gradientForColor(consultaColor);
  const gPago       = gradientForColor(pagoColor);
  const gRecurrente = gradientForColor(recurrenteColor);
  const gRevenue    = gradientForColor(revenueColor);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KPICard
        title="Clientes Registrados"
        value={formatNumber(kpis.totalClientes)}
        subtitle="Total dados de alta en el período"
        icon={<Users className="w-4 h-4 text-slate-500" />}
        gradientFrom="from-slate-400" gradientTo="to-slate-600"
        valueColor="text-slate-700"
        tooltip={{
          title: "¿Qué cuenta?",
          content: "Total de clientes dados de alta (etapa 'alta') en el período seleccionado.",
          footer: "📊 Vista: dashboard.comercial_embudo"
        }}
      />
      <KPICard
        title="% Primera Consulta"
        value={formatPercent(kpis.pctConsulta)}
        subtitle={`${formatNumber(kpis.totalConsulta)} de ${formatNumber(kpis.totalClientes)} clientes`}
        icon={<Target className="w-4 h-4 text-blue-500" />}
        gradientFrom={gConsulta.from} gradientTo={gConsulta.to}
        valueColor={consultaColor}
        tooltip={{
          title: "¿Cómo se calcula?",
          content: "% de clientes que tuvieron al menos 1 turno asistido (incluye nuevos, reactivados y resucitados).\nFórmula: primera_consulta / alta × 100",
          footer: "📊 Vista: dashboard.comercial_embudo"
        }}
      />
      <KPICard
        title="% Primer Pago"
        value={formatPercent(kpis.pctPago)}
        subtitle={`${formatNumber(kpis.totalPago)} de ${formatNumber(kpis.totalClientes)} clientes`}
        icon={<UserCheck className="w-4 h-4 text-green-500" />}
        gradientFrom={gPago.from} gradientTo={gPago.to}
        valueColor={pagoColor}
        tooltip={{
          title: "¿Cómo se calcula?",
          content: "% de clientes que tuvieron al menos 1 turno asistido con monto > $0. No se cuentan cortesías ni turnos gratuitos.\nFórmula: primer_pago / alta × 100",
          footer: "📊 Vista: dashboard.comercial_embudo"
        }}
      />
      <KPICard
        title="Facturación Total"
        value={formatCurrency(kpis.revenueTotal)}
        subtitle="Revenue total de todos los canales"
        icon={<DollarSign className="w-4 h-4 text-blue-500" />}
        gradientFrom="from-blue-400" gradientTo="to-blue-600"
        valueColor="text-blue-600"
        tooltip={{
          title: "¿Qué incluye?",
          content: "Suma de todo el revenue generado por turnos asistidos, de todos los canales de origen.",
          footer: "📊 Vista: dashboard.comercial_canales"
        }}
      />
      <KPICard
        title="Facturación Promedio / Cliente"
        value={formatCurrency(kpis.revenuePorCliente)}
        subtitle="Revenue total ÷ total clientes"
        icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        gradientFrom={gRevenue.from} gradientTo={gRevenue.to}
        valueColor={revenueColor}
        tooltip={{
          title: "¿Cómo se calcula?",
          content: "Revenue total dividido entre el total de clientes registrados.\nFórmula: SUM(revenue_total) / SUM(total_clientes)",
          footer: "📊 Vista: dashboard.comercial_canales"
        }}
      />
      <KPICard
        title="Son Recurrentes (3+ turnos)"
        value={`${formatNumber(kpis.totalRecurrentes)} (${formatPercent(kpis.pctRecurrente)})`}
        subtitle="Clientes que alcanzaron 3+ asistencias"
        icon={<RefreshCw className="w-4 h-4 text-purple-500" />}
        gradientFrom={gRecurrente.from} gradientTo={gRecurrente.to}
        valueColor={recurrenteColor}
        tooltip={{
          title: "¿Qué es recurrente?",
          content: "Clientes que alcanzaron 3 o más asistencias históricas acumuladas durante el período. Indicador clave de fidelización.",
          footer: "📊 Vista: dashboard.comercial_embudo"
        }}
      />
    </div>
  );
};
