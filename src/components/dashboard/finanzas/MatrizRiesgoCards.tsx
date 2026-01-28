import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import type { FinanzasRecuperoMaster } from '@/types/dashboard';

interface MatrizRiesgoCardsProps {
  data: FinanzasRecuperoMaster[];
  isLoading: boolean;
}

interface SegmentData {
  cantidad: number;
  deudaTotal: number;
  deudaPromedio: number;
}

export const MatrizRiesgoCards = ({ data, isLoading }: MatrizRiesgoCardsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Segment clients into risk matrix
  const segmentos = {
    premiumActivos: data.filter(c => 
      Number(c.ltv) >= 1000000 && c.dias_desde_ultima_visita <= 30
    ),
    premiumRiesgo: data.filter(c => 
      Number(c.ltv) >= 1000000 && c.dias_desde_ultima_visita > 30 && c.dias_desde_ultima_visita <= 90
    ),
    mediosActivos: data.filter(c => 
      Number(c.ltv) >= 200000 && Number(c.ltv) < 1000000 && c.dias_desde_ultima_visita <= 60
    ),
    criticosInactivos: data.filter(c => 
      c.dias_desde_ultima_visita > 90
    )
  };

  const calcSegmentData = (clients: FinanzasRecuperoMaster[]): SegmentData => ({
    cantidad: clients.length,
    deudaTotal: clients.reduce((sum, c) => sum + Number(c.saldo_total), 0),
    deudaPromedio: clients.length > 0 
      ? clients.reduce((sum, c) => sum + Number(c.saldo_total), 0) / clients.length 
      : 0
  });

  const segmentosData = {
    premiumActivos: calcSegmentData(segmentos.premiumActivos),
    premiumRiesgo: calcSegmentData(segmentos.premiumRiesgo),
    mediosActivos: calcSegmentData(segmentos.mediosActivos),
    criticosInactivos: calcSegmentData(segmentos.criticosInactivos)
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Matriz de Riesgo</CardTitle>
            <CardDescription>Segmentación por LTV y actividad</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-semibold mb-2">¿Cómo interpretar?</p>
                <div className="space-y-1 text-xs">
                  <p>🟢 Premium Activos: Proteger y fidelizar</p>
                  <p>🟡 Premium Riesgo: Recuperar urgente</p>
                  <p>🔵 Medios Activos: Mantener engagement</p>
                  <p>🔴 Críticos Inactivos: Acción inmediata</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  Vista: finanzas_recupero_master
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Premium Activos */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-green-800">
                🟢 Premium Activos
              </CardTitle>
              <CardDescription className="text-xs text-green-700">
                LTV ≥$1M • Última visita ≤30 días
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-green-700">
                  {segmentosData.premiumActivos.cantidad}
                </span>
                <span className="text-sm text-green-600">clientes</span>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Deuda Total:</span>
                  <span className="font-medium">{formatCurrency(segmentosData.premiumActivos.deudaTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Promedio:</span>
                  <span className="font-medium">{formatCurrency(segmentosData.premiumActivos.deudaPromedio)}</span>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-3 pt-2 border-t border-green-200">
                ✓ Alto valor • Buen engagement • Proteger relación
              </p>
            </CardContent>
          </Card>

          {/* Premium Riesgo */}
          <Card className="border-2 border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-yellow-800">
                🟡 Premium En Riesgo
              </CardTitle>
              <CardDescription className="text-xs text-yellow-700">
                LTV ≥$1M • Última visita 31-90 días
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-yellow-700">
                  {segmentosData.premiumRiesgo.cantidad}
                </span>
                <span className="text-sm text-yellow-600">clientes</span>
              </div>
              <div className="space-y-1 text-sm text-yellow-700">
                <div className="flex justify-between">
                  <span>Deuda Total:</span>
                  <span className="font-medium">{formatCurrency(segmentosData.premiumRiesgo.deudaTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Promedio:</span>
                  <span className="font-medium">{formatCurrency(segmentosData.premiumRiesgo.deudaPromedio)}</span>
                </div>
              </div>
              <p className="text-xs text-yellow-600 mt-3 pt-2 border-t border-yellow-200">
                ⚠️ Alto valor • Inactividad creciente • Contactar esta semana
              </p>
            </CardContent>
          </Card>

          {/* Medios Activos */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-blue-800">
                🔵 Medios Activos
              </CardTitle>
              <CardDescription className="text-xs text-blue-700">
                LTV $200K-$1M • Última visita ≤60 días
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-blue-700">
                  {segmentosData.mediosActivos.cantidad}
                </span>
                <span className="text-sm text-blue-600">clientes</span>
              </div>
              <div className="space-y-1 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Deuda Total:</span>
                  <span className="font-medium">{formatCurrency(segmentosData.mediosActivos.deudaTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Promedio:</span>
                  <span className="font-medium">{formatCurrency(segmentosData.mediosActivos.deudaPromedio)}</span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-3 pt-2 border-t border-blue-200">
                ℹ️ Valor medio • Buen engagement • Seguimiento normal
              </p>
            </CardContent>
          </Card>

          {/* Críticos Inactivos */}
          <Card className="border-2 border-red-300 bg-red-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-800">
                🔴 Críticos Inactivos
              </CardTitle>
              <CardDescription className="text-xs text-red-700">
                Cualquier LTV • Última visita &gt;90 días
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-red-700">
                  {segmentosData.criticosInactivos.cantidad}
                </span>
                <span className="text-sm text-red-600">clientes</span>
              </div>
              <div className="space-y-1 text-sm text-red-700">
                <div className="flex justify-between">
                  <span>Deuda Total:</span>
                  <span className="font-medium">{formatCurrency(segmentosData.criticosInactivos.deudaTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Promedio:</span>
                  <span className="font-medium">{formatCurrency(segmentosData.criticosInactivos.deudaPromedio)}</span>
                </div>
              </div>
              <p className="text-xs text-red-600 mt-3 pt-2 border-t border-red-200">
                🔥 ALTO RIESGO • Contactar HOY • Recupero difícil
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
