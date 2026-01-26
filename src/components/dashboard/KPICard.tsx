import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface KPICardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  trendInverse?: boolean; // If true, negative trend is good (e.g., for "Deuda")
  tooltip?: {
    description: string;
    calculation?: string;
  };
  icon?: React.ReactNode;
  colorClass?: string;
}

export const KPICard = ({
  title,
  value,
  trend,
  trendLabel = 'vs mes anterior',
  trendInverse = false,
  tooltip,
  icon,
  colorClass,
}: KPICardProps) => {
  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'text-muted-foreground';
    const isPositive = trendInverse ? trend < 0 : trend > 0;
    if (trend === 0) return 'text-muted-foreground';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium mb-1">{title}</p>
              <p className="text-xs text-muted-foreground">{tooltip.description}</p>
              {tooltip.calculation && (
                <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-1 rounded">
                  {tooltip.calculation}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className={cn('text-2xl font-bold mb-2', colorClass || 'text-foreground')}>
        {value}
      </div>

      {trend !== undefined && trend !== null && (
        <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
          {getTrendIcon()}
          <span>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}% {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
};

// Compact version for secondary metrics
export const KPICardCompact = ({
  title,
  value,
  subtitle,
  colorClass,
}: {
  title: string;
  value: string;
  subtitle?: string;
  colorClass?: string;
}) => (
  <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
    <span className="text-xs font-medium text-muted-foreground">{title}</span>
    <div className={cn('text-lg font-bold mt-1', colorClass || 'text-foreground')}>
      {value}
    </div>
    {subtitle && (
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    )}
  </div>
);
