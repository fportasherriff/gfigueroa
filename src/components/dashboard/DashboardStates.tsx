import { Loader2, AlertCircle, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Loading skeleton for KPI cards
export const KPICardSkeleton = () => (
  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <Skeleton className="h-8 w-32 mb-2" />
    <Skeleton className="h-4 w-20" />
  </div>
);

// Loading skeleton grid
export const KPIGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <KPICardSkeleton key={i} />
    ))}
  </div>
);

// Loading skeleton for charts
export const ChartSkeleton = () => (
  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
    <Skeleton className="h-6 w-40 mb-4" />
    <div className="h-64 flex items-end justify-around gap-2 pt-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="flex-1 rounded-t" 
          style={{ height: `${Math.random() * 60 + 20}%` }} 
        />
      ))}
    </div>
    <div className="flex justify-center gap-4 mt-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

// Loading skeleton for tables
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
    <div className="p-4 border-b border-border">
      <Skeleton className="h-6 w-48" />
    </div>
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-t border-border/50">
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Full page loading state
export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
    <p className="text-muted-foreground">Cargando datos del dashboard...</p>
  </div>
);

// Empty state
export const EmptyState = ({ 
  title = "No hay datos disponibles", 
  description = "Cargá los archivos CSV para ver las métricas del dashboard.",
  action 
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
      <FileX className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground max-w-md mb-4">{description}</p>
    {action}
  </div>
);

// Error state
export const ErrorState = ({ 
  error, 
  retry 
}: { 
  error: Error; 
  retry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
      <AlertCircle className="w-8 h-8 text-destructive" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar datos</h3>
    <p className="text-muted-foreground max-w-md mb-4">{error.message}</p>
    <Button onClick={retry} variant="outline">
      <Loader2 className="w-4 h-4 mr-2" />
      Reintentar
    </Button>
  </div>
);
