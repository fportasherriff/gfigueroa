import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { useComercialEmbudo, useComercialCanales, useOrigenes } from '@/hooks/useDashboardData';
import { ErrorState } from '../DashboardStates';
import { ComercialKPIs } from './ComercialKPIs';
import { EmbudoChart } from './EmbudoChart';
import { CanalesTable } from './CanalesTable';

const datePresets = [
  { label: 'Últimos 7 días', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Últimos 30 días', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Últimos 3 meses', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: 'Últimos 12 meses', getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
  { label: 'Este año', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

export const ComercialModule = () => {
  const [origenFilter, setOrigenFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const applyPreset = (preset: typeof datePresets[0]) => {
    setDateRange(preset.getValue());
    setIsCalendarOpen(false);
  };

  const fechaDesde = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const fechaHasta = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const { data: embudoData, isLoading: embudoLoading, error: embudoError, refetch: refetchEmbudo } = useComercialEmbudo({
    origen: origenFilter === 'all' ? undefined : origenFilter,
    fechaDesde,
    fechaHasta,
  });
  const { data: canalesData, isLoading: canalesLoading, error: canalesError, refetch: refetchCanales } = useComercialCanales();
  const { data: origenes } = useOrigenes();

  const hasActiveFilters = dateRange?.from || origenFilter !== 'all';
  const activeFiltersCount = [
    dateRange?.from ? 1 : 0,
    origenFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const resetFilters = () => {
    setDateRange(undefined);
    setOrigenFilter('all');
  };

  if (embudoError) {
    return <ErrorState error={embudoError as Error} retry={refetchEmbudo} />;
  }

  if (canalesError) {
    return <ErrorState error={canalesError as Error} retry={refetchCanales} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters — same style as Finanzas */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 mb-6 -mx-4 sm:-mx-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Date Range Filter */}
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Período</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yy", { locale: es })} -{" "}
                        {format(dateRange.to, "dd MMM yy", { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: es })
                    )
                  ) : (
                    <span>Todos los períodos</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <div className="border-r border-border p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Presets</p>
                    {datePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                    className="pointer-events-auto"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Origen Filter */}
          <div className="w-48">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Canal / Origen</Label>
            <Select value={origenFilter} onValueChange={setOrigenFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {origenes?.map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}

          {hasActiveFilters && (
            <Badge variant="secondary" className="h-6">
              <Filter className="h-3 w-3 mr-1" />
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Context block */}
      <div className="bg-muted/40 rounded-lg px-4 py-4 border border-border/50 space-y-2">
        <p className="text-sm font-semibold text-foreground">
          📊 Panel Comercial — ¿Cuántos clientes realmente se activan?
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Este panel muestra el recorrido real de cada cliente: cuántos se registraron, cuántos vinieron a atenderse, cuántos pagaron y cuántos volvieron más de dos veces.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Los <span className="font-medium text-green-600">números en verde</span> están dentro de lo esperado.{" "}
          Los <span className="font-medium text-yellow-600">amarillos</span> requieren atención.{" "}
          Los <span className="font-medium text-red-600">rojos</span> indican una oportunidad concreta de mejora.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Usá el filtro de canal para ver cómo rinde cada fuente de captación — Instagram, Facebook, referidos — y decidir dónde enfocar el esfuerzo comercial.
        </p>
      </div>

      {/* KPIs Grid */}
      <ComercialKPIs 
        embudoData={embudoData || []}
        canalesData={canalesData || []}
        isLoading={embudoLoading || canalesLoading}
      />

      {/* Tabs Section */}
      <Tabs defaultValue="embudo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="embudo">Embudo</TabsTrigger>
          <TabsTrigger value="canales">x Canal</TabsTrigger>
        </TabsList>

        <TabsContent value="embudo">
          <EmbudoChart data={embudoData || []} isLoading={embudoLoading} />
        </TabsContent>

        <TabsContent value="canales">
          <CanalesTable data={canalesData || []} isLoading={canalesLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
