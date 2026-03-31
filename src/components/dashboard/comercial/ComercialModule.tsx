import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useComercialEmbudo, useComercialCanales, useOrigenes } from '@/hooks/useDashboardData';
import { ErrorState } from '../DashboardStates';
import { ComercialKPIs } from './ComercialKPIs';
import { EmbudoChart } from './EmbudoChart';
import { CanalesTable } from './CanalesTable';

const DATE_PRESETS = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 3 meses', days: 90 },
  { label: 'Últimos 6 meses', days: 180 },
  { label: 'Últimos 12 meses', days: 365 },
];

export const ComercialModule = () => {
  const [origenFilter, setOrigenFilter] = useState<string>('all');

  const defaultFrom = new Date(2025, 0, 1);
  const defaultTo = endOfMonth(new Date());
  const [dateFrom, setDateFrom] = useState<Date>(defaultFrom);
  const [dateTo, setDateTo] = useState<Date>(defaultTo);

  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateFrom(from);
    setDateTo(to);
  };

  const fechaDesde = format(dateFrom, 'yyyy-MM-dd');
  const fechaHasta = format(dateTo, 'yyyy-MM-dd');

  const { data: embudoData, isLoading: embudoLoading, error: embudoError, refetch: refetchEmbudo } = useComercialEmbudo({
    origen: origenFilter === 'all' ? undefined : origenFilter,
    fechaDesde,
    fechaHasta,
  });
  const { data: canalesData, isLoading: canalesLoading, error: canalesError, refetch: refetchCanales } = useComercialCanales();
  const { data: origenes } = useOrigenes();

  const periodLabel = `${format(dateFrom, 'dd MMM yyyy', { locale: es })} - ${format(dateTo, 'dd MMM yyyy', { locale: es })}`;

  if (embudoError) {
    return <ErrorState error={embudoError as Error} retry={refetchEmbudo} />;
  }

  if (canalesError) {
    return <ErrorState error={canalesError as Error} retry={refetchCanales} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters — identical to Finanzas */}
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

        <Select value={origenFilter} onValueChange={setOrigenFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los canales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            {origenes?.map(o => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
