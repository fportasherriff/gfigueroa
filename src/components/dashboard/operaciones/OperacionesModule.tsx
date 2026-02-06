import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOperacionesDiario, useOperacionesHeatmap, useOperacionesCapacidad, useSucursales, useProfesionales } from '@/hooks/useDashboardData';
import { ErrorState } from '../DashboardStates';
import { OperacionesKPIs } from './OperacionesKPIs';
import { OperacionesEvolucion } from './OperacionesEvolucion';
import { HeatmapChart } from './HeatmapChart';
import { CapacidadChart } from './CapacidadChart';

const DATE_PRESETS = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 3 meses', days: 90 },
  { label: 'Últimos 6 meses', days: 180 },
  { label: 'Últimos 12 meses', days: 365 },
];

export const OperacionesModule = () => {
  const [sucursalFilter, setSucursalFilter] = useState<string>('all');
  const [profesionalFilter, setProfesionalFilter] = useState<string>('all');
  
  // Date range filter - default to January 2025 through current date
  const defaultFrom = new Date(2025, 0, 1); // January 1, 2025
  const defaultTo = endOfMonth(new Date());
  const [dateFrom, setDateFrom] = useState<Date>(defaultFrom);
  const [dateTo, setDateTo] = useState<Date>(defaultTo);
  
  const { data: operacionesData, isLoading: operacionesLoading, error: operacionesError, refetch: refetchOperaciones } = useOperacionesDiario({
    fechaDesde: format(dateFrom, 'yyyy-MM-dd'),
    fechaHasta: format(dateTo, 'yyyy-MM-dd'),
    sucursal: sucursalFilter === 'all' ? undefined : sucursalFilter,
    profesional: profesionalFilter === 'all' ? undefined : profesionalFilter,
  });
  const { data: heatmapData, isLoading: heatmapLoading } = useOperacionesHeatmap({
    sucursal: sucursalFilter === 'all' ? undefined : sucursalFilter,
    profesional: profesionalFilter === 'all' ? undefined : profesionalFilter,
  });
  const { data: capacidadData, isLoading: capacidadLoading } = useOperacionesCapacidad();
  const { data: sucursales } = useSucursales();
  const { data: profesionales } = useProfesionales();

  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateFrom(from);
    setDateTo(to);
  };

  if (operacionesError) {
    return <ErrorState error={operacionesError as Error} retry={refetchOperaciones} />;
  }

  // Calculate period label
  const periodLabel = `${format(dateFrom, 'dd MMM yyyy', { locale: es })} - ${format(dateTo, 'dd MMM yyyy', { locale: es })}`;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-72 justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {periodLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex flex-wrap gap-2">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.days}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(preset.days)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex">
              <div className="p-3">
                <p className="text-sm font-medium mb-2">Desde</p>
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => date && setDateFrom(date)}
                  locale={es}
                />
              </div>
              <div className="p-3 border-l">
                <p className="text-sm font-medium mb-2">Hasta</p>
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => date && setDateTo(date)}
                  locale={es}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sucursalFilter} onValueChange={setSucursalFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las sucursales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {sucursales?.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={profesionalFilter} onValueChange={setProfesionalFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los profesionales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los profesionales</SelectItem>
            {profesionales?.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period indicator */}
      <div className="text-sm text-muted-foreground">
        Período seleccionado: <span className="font-medium text-foreground">{periodLabel}</span>
      </div>

      {/* KPIs Grid */}
      <OperacionesKPIs 
        operacionesData={operacionesData || []}
        isLoading={operacionesLoading}
      />

      {/* Evolution Charts */}
      <OperacionesEvolucion 
        data={operacionesData || []}
        isLoading={operacionesLoading}
      />

      {/* Tabs Section */}
      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="capacidad">Capacidad</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          <HeatmapChart data={heatmapData || []} isLoading={heatmapLoading} />
        </TabsContent>

        <TabsContent value="capacidad">
          <CapacidadChart data={capacidadData || []} isLoading={capacidadLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
