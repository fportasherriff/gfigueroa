import { DollarSign, TrendingUp, Receipt, AlertCircle, AlertTriangle, Flame, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KPIGridSkeleton } from '../DashboardStates';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface FinanzasKPIsV2Props {
  kpis: {
    revenueTotal: number;
    tasaCobro: number;
    ticketPromedio: number;
    deudaTQP: number;
    deudaTotal: number;
    deudaCritica: number;
    clientesConDeuda: number;
    clientesTQP: number;
    clientesCriticos: number;
  };
  isLoading: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  borderColor: string;
  valueColor: string;
  tooltip: {
    title: string;
    content: string;
    footer?: string;
  };
}

const KPICard = ({ title, value, subtitle, icon, borderColor, valueColor, tooltip }: KPICardProps) => (
  <Card className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow`}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-muted">{icon}</div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
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
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

export const FinanzasKPIsV2 = ({ kpis, isLoading }: FinanzasKPIsV2Props) => {
  if (isLoading) {
    return <KPIGridSkeleton count={6} />;
  }

  const getTasaCobroColor = (tasa: number) => {
    if (tasa >= 90) return 'text-green-600';
    if (tasa >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTasaCobroBorder = (tasa: number) => {
    if (tasa >= 90) return 'border-green-500';
    if (tasa >= 80) return 'border-yellow-500';
    return 'border-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Row 1 */}
      <KPICard
        title="Revenue Procedimientos"
        value={formatCurrency(kpis.revenueTotal)}
        icon={<DollarSign className="h-4 w-4 text-blue-600" />}
        borderColor="border-blue-500"
        valueColor="text-blue-600"
        tooltip={{
          title: "¿Qué es?",
          content: "Total facturado en procedimientos médicos registrados en turnos con estado 'Asistido'",
          footer: "Vista: finanzas_diario"
        }}
      />

      <KPICard
        title="Tasa de Cobro"
        value={formatPercent(kpis.tasaCobro)}
        subtitle="Meta: ≥90%"
        icon={<TrendingUp className={`h-4 w-4 ${getTasaCobroColor(kpis.tasaCobro)}`} />}
        borderColor={getTasaCobroBorder(kpis.tasaCobro)}
        valueColor={getTasaCobroColor(kpis.tasaCobro)}
        tooltip={{
          title: "¿Cómo se calcula?",
          content: "Fórmula: ((Revenue - Deuda TQP) / Revenue) × 100",
          footer: "Mide el % efectivamente cobrado del total facturado"
        }}
      />

      <KPICard
        title="Ticket Promedio"
        value={formatCurrency(kpis.ticketPromedio)}
        subtitle="Por turno facturado"
        icon={<Receipt className="h-4 w-4 text-purple-600" />}
        borderColor="border-purple-500"
        valueColor="text-purple-600"
        tooltip={{
          title: "¿Qué representa?",
          content: "Valor promedio facturado por turno. Solo considera turnos con revenue > 0",
          footer: "Vista: finanzas_diario"
        }}
      />

      {/* Row 2 */}
      <KPICard
        title="Deuda Procedimientos (TQP)"
        value={formatCurrency(kpis.deudaTQP)}
        subtitle={`${kpis.clientesTQP} clientes`}
        icon={<AlertCircle className="h-4 w-4 text-orange-600" />}
        borderColor="border-orange-500"
        valueColor="text-orange-600"
        tooltip={{
          title: "¿Qué es TQP?",
          content: "Procedimientos médicos facturados pendientes de cobro.\nTQP = 'Tiene Que Pagar' - Lo que rastreamos en el sistema de turnos",
          footer: "Vista: finanzas_recupero_master"
        }}
      />

      <KPICard
        title="Deuda TOTAL"
        value={formatCurrency(kpis.deudaTotal)}
        subtitle={`${kpis.clientesConDeuda} clientes`}
        icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        borderColor="border-red-500"
        valueColor="text-red-600"
        tooltip={{
          title: "¿Qué incluye?",
          content: `Deuda Total = Procedimientos + Extras\n• Procedimientos (TQP): ${formatCurrency(kpis.deudaTQP)}\n• Extras: ${formatCurrency(kpis.deudaTotal - kpis.deudaTQP)} (productos, paquetes, servicios)\n\nLos "extras" son items vendidos que no se registran en el sistema de turnos médicos.`,
          footer: "Vista: finanzas_recupero_master"
        }}
      />

      <KPICard
        title="Deuda Crítica (+60 días)"
        value={formatCurrency(kpis.deudaCritica)}
        subtitle={`⚡ ${kpis.clientesCriticos} clientes - Acción inmediata`}
        icon={<Flame className="h-4 w-4 text-red-700" />}
        borderColor="border-red-700"
        valueColor="text-red-700"
        tooltip={{
          title: "¿Por qué es crítica?",
          content: "Clientes sin visita hace más de 60 días tienen alto riesgo de pérdida. Requieren contacto URGENTE para recuperación.",
          footer: "Vista: finanzas_recupero_master"
        }}
      />
    </div>
  );
};
