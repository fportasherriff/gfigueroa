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
  gradientFrom: string;
  gradientTo: string;
  valueColor: string;
  tooltip: {
    title: string;
    content: string;
    footer?: string;
  };
}

const KPICard = ({ title, value, subtitle, icon, gradientFrom, gradientTo, valueColor, tooltip }: KPICardProps) => (
  <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
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
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      
      {/* Bottom gradient bar */}
      <div 
        className={`h-1 rounded-full mt-4 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
      />
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

  const getTasaCobroGradient = (tasa: number) => {
    if (tasa >= 90) return { from: 'from-green-400', to: 'to-green-600' };
    if (tasa >= 80) return { from: 'from-yellow-400', to: 'to-yellow-600' };
    return { from: 'from-red-400', to: 'to-red-600' };
  };

  const tasaGradient = getTasaCobroGradient(kpis.tasaCobro);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Row 1 */}
      <KPICard
        title="Revenue Procedimientos"
        value={formatCurrency(kpis.revenueTotal)}
        icon={<DollarSign className="h-4 w-4 text-blue-600" />}
        gradientFrom="from-blue-400"
        gradientTo="to-blue-600"
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
        gradientFrom={tasaGradient.from}
        gradientTo={tasaGradient.to}
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
        gradientFrom="from-purple-400"
        gradientTo="to-purple-600"
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
        gradientFrom="from-orange-400"
        gradientTo="to-orange-600"
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
        gradientFrom="from-red-400"
        gradientTo="to-red-600"
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
        gradientFrom="from-red-600"
        gradientTo="to-red-800"
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
