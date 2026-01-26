import { useState } from 'react';
import { format, subDays, subMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface FinanzasFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  profesional: string;
  onProfesionalChange: (value: string) => void;
  riesgo: string;
  onRiesgoChange: (value: string) => void;
  profesionales: string[];
  showRiesgoFilter?: boolean;
}

const datePresets = [
  { label: 'Últimos 7 días', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Últimos 30 días', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Últimos 3 meses', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: 'Últimos 12 meses', getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
  { label: 'Este año', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

export const FinanzasFilters = ({
  dateRange,
  onDateRangeChange,
  profesional,
  onProfesionalChange,
  riesgo,
  onRiesgoChange,
  profesionales,
  showRiesgoFilter = false,
}: FinanzasFiltersProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const hasActiveFilters = 
    dateRange?.from || 
    profesional !== 'all' || 
    riesgo !== 'all';

  const activeFiltersCount = [
    dateRange?.from ? 1 : 0,
    profesional !== 'all' ? 1 : 0,
    riesgo !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const resetFilters = () => {
    onDateRangeChange(undefined);
    onProfesionalChange('all');
    onRiesgoChange('all');
  };

  const applyPreset = (preset: typeof datePresets[0]) => {
    onDateRangeChange(preset.getValue());
    setIsCalendarOpen(false);
  };

  return (
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
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                  locale={es}
                  className="pointer-events-auto"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Profesional Filter */}
        <div className="w-48">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Profesional</Label>
          <Select value={profesional} onValueChange={onProfesionalChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {profesionales.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Riesgo Filter (conditional) */}
        {showRiesgoFilter && (
          <div className="w-40">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Riesgo</Label>
            <Select value={riesgo} onValueChange={onRiesgoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Alto">🔴 Alto</SelectItem>
                <SelectItem value="Medio">🟡 Medio</SelectItem>
                <SelectItem value="Bajo">🟢 Bajo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}

        {/* Active Filters Badge */}
        {hasActiveFilters && (
          <Badge variant="secondary" className="h-6">
            <Filter className="h-3 w-3 mr-1" />
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </div>
  );
};
