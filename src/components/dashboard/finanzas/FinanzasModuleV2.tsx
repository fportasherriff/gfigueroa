import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Info, CalendarIcon, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Hooks
import {
  useFinanzasDiarioV2,
  useFinanzasRecuperoMaster,
  useFinanzasDeudaAging,
  useFinanzasPrioridades,
  useFinanzasPorProfesional,
  useFinanzasPorProcedimiento,
  useFinanzasKPIs,
} from "@/hooks/useFinanzasData";
import { useSucursales } from "@/hooks/useDashboardData";

// Components
import { FinanzasKPIsV2 } from "./FinanzasKPIsV2";
import { EvolucionCobranzaChart } from "./EvolucionCobranzaChart";
import { ComposicionDeudaChart } from "./ComposicionDeudaChart";
import { MatrizRiesgoChart } from "./MatrizRiesgoChart";
import { PrioridadCards } from "./PrioridadCards";
import { MatrizRiesgoCards } from "./MatrizRiesgoCards";
import { ClientesRecuperoTable } from "./ClientesRecuperoTable";
import { ProfesionalRendimiento } from "./ProfesionalRendimiento";
import { TopProcedimientos } from "./TopProcedimientos";

import type { DateRange } from "@/types/dashboard";

const DATE_PRESETS = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 3 meses', days: 90 },
  { label: 'Últimos 6 meses', days: 180 },
  { label: 'Últimos 12 meses', days: 365 },
];

export const FinanzasModuleV2 = () => {
  const now = new Date();
  const defaultFrom = new Date(2025, 0, 1);
  const defaultTo = endOfMonth(new Date());
  const [dateFrom, setDateFrom] = useState<Date>(defaultFrom);
  const [dateTo, setDateTo] = useState<Date>(defaultTo);
  const [sucursal, setSucursal] = useState<string>("all");
  const [bannerOpen, setBannerOpen] = useState(false);

  // Format dates for queries
  const filters = {
    fechaDesde: format(dateFrom, "yyyy-MM-dd"),
    fechaHasta: format(dateTo, "yyyy-MM-dd"),
    sucursal: sucursal !== "all" ? sucursal : undefined,
  };

  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateFrom(from);
    setDateTo(to);
  };

  // Data hooks
  const { kpis, anteriorKpis, isLoading: kpisLoading, diarioData } = useFinanzasKPIs(filters);
  const { data: recuperoData, isLoading: recuperoLoading } = useFinanzasRecuperoMaster();
  const { data: agingData, isLoading: agingLoading } = useFinanzasDeudaAging();
  const { data: prioridadesData, isLoading: prioridadesLoading } = useFinanzasPrioridades();
  const { data: profesionalesData, isLoading: profesionalesLoading } = useFinanzasPorProfesional();
  const { data: procedimientosData, isLoading: procedimientosLoading } = useFinanzasPorProcedimiento();
  const { data: sucursales } = useSucursales();

  return (
    <div className="space-y-6">
      {/* Collapsible Info Banner */}
      <Collapsible open={bannerOpen} onOpenChange={setBannerOpen}>
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full p-3 flex items-center justify-between text-left hover:bg-blue-100/50 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-blue-800"> Guía Rápida del Dashboard</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-blue-600 transition-transform", bannerOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-0 text-sm text-blue-800 space-y-3 border-t border-blue-200">
              <p className="pt-3">Este dashboard analiza la facturación y recupero de deuda del centro médico.</p>

              <div>
                <p className="font-medium">📊 Cómo usar:</p>
                <ul className="list-disc list-inside ml-2 text-blue-700 space-y-1">
                  <li>Pasa el mouse sobre los íconos ℹ️ para ver explicaciones detalladas</li>
                  <li>Haz click en las cards de prioridad/segmentos para ver listados de clientes</li>
                  <li>Usa los botones de WhatsApp para enviar mensajes pre-escritos</li>
                  <li>Exporta tablas a CSV con los botones de descarga</li>
                </ul>
              </div>

              <div>
                <p className="font-medium">💰 Sobre la Deuda:</p>
                <ul className="list-disc list-inside ml-2 text-blue-700 space-y-1">
                  <li>
                    Deuda Total = Procedimientos TQP ({kpis ? `$${(kpis.deudaTQP / 1000000).toFixed(1)}M` : "..."}) +
                    Extras ({kpis ? `$${((kpis.deudaTotal - kpis.deudaTQP) / 1000000).toFixed(1)}M` : "..."})
                  </li>
                  <li>TQP = "Tiene Que Pagar" - Procedimientos médicos registrados en turnos</li>
                  <li>Extras = Productos, paquetes y servicios no registrados en el sistema de turnos</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Global Filters */}
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
              {format(dateFrom, 'dd MMM yyyy', { locale: es })} - {format(dateTo, 'dd MMM yyyy', { locale: es })}
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
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => date && setDateFrom(date)}
                  locale={es}
                  className="pointer-events-auto"
                />
              </div>
              <div className="p-3 border-l">
                <p className="text-sm font-medium mb-2">Hasta</p>
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => date && setDateTo(date)}
                  locale={es}
                  className="pointer-events-auto"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sucursal Filter */}
        <Select value={sucursal} onValueChange={setSucursal}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las sucursales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {sucursales?.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period indicator */}
      <div className="text-sm text-muted-foreground">
        Período seleccionado: <span className="font-medium text-foreground">{format(dateFrom, 'dd MMM yyyy', { locale: es })} - {format(dateTo, 'dd MMM yyyy', { locale: es })}</span>
      </div>

      {/* KPIs Grid - 6 cards minimalistas */}
      <FinanzasKPIsV2 kpis={kpis} anteriorKpis={anteriorKpis} isLoading={kpisLoading} />

      {/* Evolution Chart - Tabs Revenue/Ticket */}
      <EvolucionCobranzaChart data={diarioData || []} isLoading={kpisLoading} />

      {/* Debt Composition - 3 columns */}
      <ComposicionDeudaChart
        deudaTQP={kpis?.deudaTQP || 0}
        deudaExtras={(kpis?.deudaTotal || 0) - (kpis?.deudaTQP || 0)}
        clientesTQP={kpis?.clientesTQP || 0}
        clientesTotal={kpis?.clientesConDeuda || 0}
        agingData={agingData}
        isLoading={kpisLoading || agingLoading}
      />

      {/* Scatter Plot - LTV vs Deuda */}
      <MatrizRiesgoChart data={recuperoData || []} isLoading={recuperoLoading} />

      {/* Recovery Tabs - Por Antigüedad / Por Cliente */}
      <Tabs defaultValue="antiguedad" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="antiguedad">🎯 Por Antigüedad</TabsTrigger>
          <TabsTrigger value="cliente">👥 Por Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="antiguedad" className="space-y-6">
          {/* Priority Cards with Donut */}
          <PrioridadCards
            data={prioridadesData || []}
            clientesData={recuperoData || []}
            isLoading={prioridadesLoading}
          />
        </TabsContent>

        <TabsContent value="cliente" className="space-y-6">
          {/* Risk Matrix Cards */}
          <MatrizRiesgoCards data={recuperoData || []} isLoading={recuperoLoading} />

          {/* Clients Table */}
          <ClientesRecuperoTable data={recuperoData || []} isLoading={recuperoLoading} />
        </TabsContent>
      </Tabs>

      {/* Professional Performance - Tabs */}
      <ProfesionalRendimiento
        data={profesionalesData || []}
        clientesData={recuperoData || []}
        isLoading={profesionalesLoading}
      />

      {/* Top Procedures - Table with cumulative */}
      <TopProcedimientos data={procedimientosData || []} isLoading={procedimientosLoading} />
    </div>
  );
};
