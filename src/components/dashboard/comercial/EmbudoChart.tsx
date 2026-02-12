import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, ChevronDown } from 'lucide-react';
import { ChartSkeleton, EmptyState } from '../DashboardStates';
import { formatNumber, formatPercent } from '@/lib/formatters';
import type { ComercialEmbudo } from '@/types/dashboard';

interface EmbudoChartProps {
  data: ComercialEmbudo[];
  isLoading: boolean;
}

const ETAPA_COLORS: Record<string, string> = {
  'Lead': 'bg-blue-500',
  'Consulta': 'bg-green-500',
  'Tratamiento': 'bg-yellow-500',
  'Recurrente': 'bg-purple-500',
};

export const EmbudoChart = ({ data, isLoading }: EmbudoChartProps) => {
  const funnelData = useMemo(() => {
    if (!data.length) return null;

    // Aggregate by etapa
    const etapas: Record<string, number> = {};
    data.forEach(d => {
      if (!etapas[d.etapa]) {
        etapas[d.etapa] = 0;
      }
      etapas[d.etapa] += Number(d.cantidad || 0);
    });

    const stages = [
      { name: 'Lead', value: etapas['Lead'] || 0, color: ETAPA_COLORS['Lead'] },
      { name: 'Consulta', value: etapas['Consulta'] || 0, color: ETAPA_COLORS['Consulta'] },
      { name: 'Tratamiento', value: etapas['Tratamiento'] || 0, color: ETAPA_COLORS['Tratamiento'] },
      { name: 'Recurrente', value: etapas['Recurrente'] || 0, color: ETAPA_COLORS['Recurrente'] },
    ].filter(s => s.value > 0);

    // Calculate conversions
    const totalLeads = stages[0]?.value || 1;
    
    return stages.map((stage, idx) => ({
      ...stage,
      percentage: (stage.value / totalLeads) * 100,
      conversion: idx > 0 && stages[idx - 1].value > 0 
        ? (stage.value / stages[idx - 1].value) * 100 
        : null,
      loss: idx > 0 ? stages[idx - 1].value - stage.value : 0,
    }));
  }, [data]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!funnelData || funnelData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState 
            title="Sin datos de embudo"
            description="No hay datos de conversión disponibles para el período seleccionado."
          />
        </CardContent>
      </Card>
    );
  }

  const maxValue = funnelData[0]?.value || 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Embudo de Conversión</CardTitle>
            <CardDescription>
              Flujo de leads a clientes recurrentes
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-semibold mb-2">¿Para qué sirve?</p>
              <p className="text-xs text-muted-foreground">
                Visualiza el funnel de ventas desde Lead hasta Cliente Recurrente para identificar en qué etapa se pierden más prospectos.
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-1 rounded">
                Conversión = (cantidad_etapa_actual / cantidad_etapa_anterior) × 100
              </p>
              <p className="text-xs text-blue-600 mt-2 font-mono">
                📊 dashboard.comercial_embudo
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel visualization */}
        <div className="space-y-4">
          {funnelData.map((stage, idx) => {
            const widthPercentage = Math.max((stage.value / maxValue) * 100, 20);
            const isGoodConversion = stage.conversion === null || stage.conversion >= 70;
            
            return (
              <div key={stage.name} className="space-y-2">
                {/* Stage header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span className="font-medium">{stage.name}</span>
                    <span className="text-lg font-bold">{formatNumber(stage.value)}</span>
                  </div>
                  
                  {stage.conversion !== null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                          isGoodConversion ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {formatPercent(stage.conversion)} conversión
                          <Info className="w-3 h-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tasa de conversión desde {funnelData[idx - 1].name}</p>
                        <p className="text-xs text-muted-foreground">Objetivo: &gt;70%</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Bar */}
                <div 
                  className="h-10 rounded-lg overflow-hidden bg-muted/30 transition-all duration-500"
                  style={{ width: `${widthPercentage}%` }}
                >
                  <div className={`h-full ${stage.color} flex items-center justify-end pr-3`}>
                    <span className="text-xs font-medium text-white">
                      {formatPercent(stage.percentage)} del total
                    </span>
                  </div>
                </div>

                {/* Conversion arrow */}
                {idx < funnelData.length - 1 && (
                  <div className="flex items-center justify-center py-1">
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    {stage.loss > 0 && (
                      <span className="text-xs text-red-500 ml-2">
                        -{formatNumber(stage.loss)} perdidos
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loss summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Análisis de Pérdidas:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {funnelData.slice(1).map((stage, idx) => (
              <li key={stage.name} className="flex items-center gap-2">
                📉 {funnelData[idx].name} → {stage.name}: 
                <span className="font-medium text-foreground">
                  {formatNumber(funnelData[idx].value - stage.value)} perdidos
                </span>
                <span className="text-red-500">
                  ({formatPercent(100 - (stage.conversion || 0))} pérdida)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
