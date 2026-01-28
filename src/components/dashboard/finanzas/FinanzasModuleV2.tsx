import { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Info, Calendar, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Hooks
import {
  useFinanzasDiarioV2,
  useFinanzasRecuperoMaster,
  useFinanzasDeudaAging,
  useFinanzasPrioridades,
  useFinanzasPorProfesional,
  useFinanzasPorProcedimiento,
  useFinanzasKPIs,
} from '@/hooks/useFinanzasData';
import { useSucursales } from '@/hooks/useDashboardData';

// Components
import { FinanzasKPIsV2 } from './FinanzasKPIsV2';
import { EvolucionCobranzaChart } from './EvolucionCobranzaChart';
import { ComposicionDeudaChart } from './ComposicionDeudaChart';
import { AgingAnalysisChart } from './AgingAnalysisChart';
import { PrioridadCards } from './PrioridadCards';
import { MatrizRiesgoCards } from './MatrizRiesgoCards';
import { ClientesRecuperoTable } from './ClientesRecuperoTable';
import { ProfesionalRendimiento } from './ProfesionalRendimiento';
import { TopProcedimientos } from './TopProcedimientos';

import type { DateRange } from '@/types/dashboard';

export const FinanzasModuleV2 = () => {
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(now, 11)),
    to: endOfMonth(now),
  });
  const [sucursal, setSucursal] = useState<string>('all');

  // Format dates for queries
  const filters = {
    fechaDesde: format(dateRange.from, 'yyyy-MM-dd'),
    fechaHasta: format(dateRange.to, 'yyyy-MM-dd'),
    sucursal: sucursal !== 'all' ? sucursal : undefined,
  };

  // Data hooks
  const { kpis, isLoading: kpisLoading, diarioData } = useFinanzasKPIs(filters);
  const { data: recuperoData, isLoading: recuperoLoading } = useFinanzasRecuperoMaster();
  const { data: agingData, isLoading: agingLoading } = useFinanzasDeudaAging();
  const { data: prioridadesData, isLoading: prioridadesLoading } = useFinanzasPrioridades();
  const { data: profesionalesData, isLoading: profesionalesLoading } = useFinanzasPorProfesional();
  const { data: procedimientosData, isLoading: procedimientosLoading } = useFinanzasPorProcedimiento();
  const { data: sucursales } = useSucursales();

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Este dashboard mide procedimientos médicos + deuda total.</p>
              <p className="text-blue-700">
                Deuda Total = Procedimientos TQP ({kpis ? `$${(kpis.deudaTQP / 1000000).toFixed(1)}M` : '...'}) + 
                Extras ({kpis ? `$${((kpis.deudaTotal - kpis.deudaTQP) / 1000000).toFixed(1)}M` : '...'})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card border rounded-lg">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal min-w-[240px]",
                  !dateRange && "text-muted-foreground"
                )}
              >
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy")
                  )
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Sucursal Filter */}
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <Select value={sucursal} onValueChange={setSucursal}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {sucursales?.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Date Presets */}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange({
              from: startOfMonth(now),
              to: endOfMonth(now),
            })}
          >
            Este mes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange({
              from: startOfMonth(subMonths(now, 2)),
              to: endOfMonth(now),
            })}
          >
            3 meses
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange({
              from: startOfMonth(subMonths(now, 11)),
              to: endOfMonth(now),
            })}
          >
            12 meses
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <FinanzasKPIsV2 kpis={kpis} isLoading={kpisLoading} />

      {/* Evolution Chart */}
      <EvolucionCobranzaChart 
        data={diarioData || []} 
        isLoading={kpisLoading} 
      />

      {/* Debt Composition */}
      <ComposicionDeudaChart
        deudaTQP={kpis?.deudaTQP || 0}
        deudaExtras={(kpis?.deudaTotal || 0) - (kpis?.deudaTQP || 0)}
        clientesTQP={kpis?.clientesTQP || 0}
        clientesTotal={kpis?.clientesConDeuda || 0}
        isLoading={kpisLoading}
      />

      {/* Recovery Tabs */}
      <Tabs defaultValue="antiguedad" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="antiguedad">🎯 Por Antigüedad</TabsTrigger>
          <TabsTrigger value="cliente">👥 Por Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="antiguedad" className="space-y-6">
          <AgingAnalysisChart data={agingData || []} isLoading={agingLoading} />
          <PrioridadCards data={prioridadesData || []} isLoading={prioridadesLoading} />
        </TabsContent>

        <TabsContent value="cliente" className="space-y-6">
          <MatrizRiesgoCards data={recuperoData || []} isLoading={recuperoLoading} />
          <ClientesRecuperoTable data={recuperoData || []} isLoading={recuperoLoading} />
        </TabsContent>
      </Tabs>

      {/* Professional Performance */}
      <ProfesionalRendimiento 
        data={profesionalesData || []} 
        isLoading={profesionalesLoading} 
      />

      {/* Top Procedures */}
      <TopProcedimientos 
        data={procedimientosData || []} 
        isLoading={procedimientosLoading} 
      />
    </div>
  );
};
