import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';

interface FunnelStage {
  label: string;
  value: number;
  tooltip: string;
}

interface FunnelSVGProps {
  title: string;
  description: string;
  stages: FunnelStage[];
  colorStart: string;
  colorEnd: string;
  tooltipInfo: {
    description: string;
    calculation: string;
    source: string;
  };
}

const FUNNEL_HEIGHT = 56;
const FUNNEL_GAP = 6;
const SVG_WIDTH = 400;
const LABEL_WIDTH = 160;
const DROP_WIDTH = 100;
const BAR_START = LABEL_WIDTH;
const BAR_MAX_WIDTH = SVG_WIDTH - LABEL_WIDTH - DROP_WIDTH;

export const FunnelSVG = ({ title, description, stages, colorStart, colorEnd, tooltipInfo }: FunnelSVGProps) => {
  const maxValue = useMemo(() => Math.max(...stages.map(s => s.value), 1), [stages]);
  const totalHeight = stages.length * (FUNNEL_HEIGHT + FUNNEL_GAP) - FUNNEL_GAP + 20;

  if (stages.every(s => s.value === 0)) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos para el período seleccionado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-semibold mb-1">¿Para qué sirve?</p>
                <p className="text-xs text-muted-foreground mb-2">{tooltipInfo.description}</p>
                <p className="font-semibold mb-1">¿Cómo se calcula?</p>
                <p className="text-xs text-muted-foreground mb-2">{tooltipInfo.calculation}</p>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border font-mono">
                  📊 Vista: {tooltipInfo.source}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
          className="w-full"
          style={{ maxHeight: totalHeight }}
        >
          <defs>
            <linearGradient id={`grad-${title.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorStart} />
              <stop offset="100%" stopColor={colorEnd} />
            </linearGradient>
          </defs>
          {stages.map((stage, i) => {
            const topWidth = i === 0
              ? BAR_MAX_WIDTH
              : (stages[i - 1].value / maxValue) * BAR_MAX_WIDTH;
            const bottomWidth = (stage.value / maxValue) * BAR_MAX_WIDTH;
            const y = i * (FUNNEL_HEIGHT + FUNNEL_GAP);
            const centerX = BAR_START + BAR_MAX_WIDTH / 2;

            // Trapezoid points
            const topLeft = centerX - topWidth / 2;
            const topRight = centerX + topWidth / 2;
            const bottomLeft = centerX - bottomWidth / 2;
            const bottomRight = centerX + bottomWidth / 2;

            const points = `${topLeft},${y} ${topRight},${y} ${bottomRight},${y + FUNNEL_HEIGHT} ${bottomLeft},${y + FUNNEL_HEIGHT}`;

            // Drop calculation
            const prevValue = i > 0 ? stages[i - 1].value : stage.value;
            const drop = prevValue > 0 ? ((prevValue - stage.value) / prevValue) * 100 : 0;

            // Color opacity based on position
            const opacity = 1 - (i * 0.15);

            return (
              <g key={stage.label}>
                {/* Stage label */}
                <text
                  x={BAR_START - 8}
                  y={y + FUNNEL_HEIGHT / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  className="fill-foreground"
                  fontSize="11"
                  fontWeight="500"
                >
                  {stage.label}
                </text>

                {/* Trapezoid */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <polygon
                        points={points}
                        fill={colorStart}
                        opacity={opacity}
                        rx="4"
                        className="transition-all duration-500 cursor-pointer hover:opacity-80"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{stage.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Value inside trapezoid */}
                <text
                  x={centerX}
                  y={y + FUNNEL_HEIGHT / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                >
                  {formatNumber(stage.value)}
                </text>

                {/* Drop label to the right */}
                {i > 0 && drop > 0 && (
                  <text
                    x={SVG_WIDTH - DROP_WIDTH + 10}
                    y={y + FUNNEL_HEIGHT / 2}
                    dominantBaseline="central"
                    fill="#ef4444"
                    fontSize="11"
                    fontWeight="600"
                  >
                    ▼ {drop.toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
};
