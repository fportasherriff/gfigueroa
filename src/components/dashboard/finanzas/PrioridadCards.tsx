import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import type { FinanzasPrioridad } from '@/types/dashboard';

interface PrioridadCardsProps {
  data: FinanzasPrioridad[];
  isLoading: boolean;
}

const PRIORIDAD_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  subtitle: string;
  criteria: string[];
  action: string;
}> = {
  'Crítica': {
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    emoji: '🔴',
    subtitle: 'Contactar HOY',
    criteria: ['+90 días sin visita Y deuda >$500K'],
    action: '⚠️ Contactar HOY'
  },
  'Alta': {
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    emoji: '🟠',
    subtitle: 'Esta semana',
    criteria: ['+60 días sin visita', 'O deuda >$1M'],
    action: 'Contactar esta semana'
  },
  'Media': {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    emoji: '🟡',
    subtitle: 'Este mes',
    criteria: ['+30 días sin visita', 'O deuda >$300K'],
    action: 'Contactar este mes'
  },
  'Baja': {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-400',
    emoji: '🟢',
    subtitle: 'Seguimiento',
    criteria: ['Deuda menor', 'Actividad reciente'],
    action: 'Seguimiento normal'
  }
};

export const PrioridadCards = ({ data, isLoading }: PrioridadCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-l-4 border-gray-200">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter to show only Crítica, Alta, Media
  const prioritiesToShow = ['Crítica', 'Alta', 'Media'];
  const filteredData = data.filter(p => prioritiesToShow.includes(p.prioridad));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {filteredData.map((prioridad) => {
        const config = PRIORIDAD_CONFIG[prioridad.prioridad];
        if (!config) return null;

        return (
          <Card 
            key={prioridad.prioridad} 
            className={`border-l-4 ${config.borderColor} ${config.bgColor}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className={`text-sm font-semibold ${config.color}`}>
                  {config.emoji} {prioridad.prioridad.toUpperCase()}
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={`${config.color} opacity-70 hover:opacity-100 transition-opacity`}>
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-semibold mb-2">Criterios:</p>
                      <ul className="text-xs space-y-1">
                        {config.criteria.map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                        {config.action}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription className={config.color}>
                {config.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <p className={`text-4xl font-bold ${config.color}`}>
                {prioridad.cantidad_clientes}
              </p>
              <p className={`text-sm ${config.color} opacity-80 mt-1`}>
                Deuda: {formatCurrency(prioridad.deuda_total)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
