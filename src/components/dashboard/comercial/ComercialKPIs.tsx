import { useMemo } from 'react';
import { Users, Target, UserCheck, RefreshCw, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatNumber } from '@/lib/formatters';
import type { ComercialEmbudo } from '@/types/dashboard';

interface ComercialKPIsProps {
  embudoData: ComercialEmbudo[];
  isLoading: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  tooltip: {
    description: string;
    calculation: string;
    source: string;
  };
}

const KPICard = ({ title, value, subtitle, icon, gradientFrom, gradientTo, tooltip }: KPICardProps) => (
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
              <p className="font-semibold mb-1">¿Para qué sirve?</p>
              <p className="text-xs text-muted-foreground mb-2">{tooltip.description}</p>
              <p className="font-semibold mb-1">¿Cómo se calcula?</p>
              <p className="text-xs text-muted-foreground mb-2">{tooltip.calculation}</p>
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border font-mono">
                📊 Vista: {tooltip.source}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div data-validation={`dashboard.comercial_embudo.nuevos.SUM`}>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className={`h-1 rounded-full mt-4 bg-gradient-to-r ${gradientFrom} ${gradientTo}`} />
    </CardContent>
  </Card>
);

export const ComercialKPIs = ({ embudoData, isLoading }: ComercialKPIsProps) => {
  const kpis = useMemo(() => {
    if (!embudoData.length) return null;

    const byEtapa: Record<string, number> = { alta: 0, primera_consulta: 0, primer_pago: 0, recurrente: 0 };
    for (const row of embudoData) {
      const etapa = row.etapa;
      if (byEtapa[etapa] === undefined) continue;
      if (etapa === 'alta') {
        byEtapa[etapa] += Number(row.nuevos || 0);
      } else {
        byEtapa[etapa] += Number(row.nuevos || 0) + Number(row.reactivados_dormidos || 0) + Number(row.resucitados || 0);
      }
    }

    return {
      altas: byEtapa.alta,
      consultas: byEtapa.primera_consulta,
      pagos: byEtapa.primer_pago,
      recurrentes: byEtapa.recurrente,
    };
  }, [embudoData]);

  if (isLoading) return <KPIGridSkeleton count={4} />;
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Altas en el Período"
        value={formatNumber(kpis.altas)}
        subtitle="Clientes dados de alta"
        icon={<Users className="w-4 h-4 text-slate-500" />}
        gradientFrom="from-slate-400" gradientTo="to-slate-600"
        tooltip={{
          description: "Total de clientes dados de alta en el período seleccionado.",
          calculation: "SUM(nuevos) WHERE etapa = 'alta'",
          source: "dashboard.comercial_embudo",
        }}
      />
      <KPICard
        title="Primeras Consultas"
        value={formatNumber(kpis.consultas)}
        subtitle="Asistieron por primera vez"
        icon={<Target className="w-4 h-4 text-blue-500" />}
        gradientFrom="from-blue-400" gradientTo="to-blue-600"
        tooltip={{
          description: "Clientes cuya primera visita histórica ocurrió en el período.",
          calculation: "SUM(nuevos + reactivados_dormidos + resucitados) WHERE etapa = 'primera_consulta'",
          source: "dashboard.comercial_embudo",
        }}
      />
      <KPICard
        title="Primeros Pagos"
        value={formatNumber(kpis.pagos)}
        subtitle="Pagaron por primera vez"
        icon={<UserCheck className="w-4 h-4 text-green-500" />}
        gradientFrom="from-green-400" gradientTo="to-green-600"
        tooltip={{
          description: "Primer turno asistido con monto > $0 en toda la historia del cliente.",
          calculation: "SUM(nuevos + reactivados_dormidos + resucitados) WHERE etapa = 'primer_pago'. No se cuentan cortesías ni turnos gratuitos (monto = $0).",
          source: "dashboard.comercial_embudo",
        }}
      />
      <KPICard
        title="Recurrentes (3+ turnos)"
        value={formatNumber(kpis.recurrentes)}
        subtitle="Alcanzaron 3+ asistencias"
        icon={<RefreshCw className="w-4 h-4 text-purple-500" />}
        gradientFrom="from-purple-400" gradientTo="to-purple-600"
        tooltip={{
          description: "Clientes que alcanzaron 3 o más asistencias históricas acumuladas durante el período.",
          calculation: "SUM(nuevos + reactivados_dormidos + resucitados) WHERE etapa = 'recurrente'",
          source: "dashboard.comercial_embudo",
        }}
      />
    </div>
  );
};
