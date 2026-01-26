import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinanzasDiario, useFinanzasDeudores, useProfesionales } from '@/hooks/useDashboardData';
import { ErrorState } from '../DashboardStates';
import { FinanzasKPIs } from './FinanzasKPIs';
import { FinanzasFilters } from './FinanzasFilters';
import { EvolucionChart } from './EvolucionChart';
import { MatrizRiesgoChart } from './MatrizRiesgoChart';
import { ProfesionalFinanzasTable } from './ProfesionalFinanzasTable';
import { DeudoresTable } from './DeudoresTable';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export const FinanzasModule = () => {
  const [activeTab, setActiveTab] = useState('evolucion');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // Default: last 12 months
    const now = new Date();
    return {
      from: startOfMonth(subMonths(now, 11)),
      to: endOfMonth(now),
    };
  });
  const [profesionalFilter, setProfesionalFilter] = useState<string>('all');
  const [riesgoFilter, setRiesgoFilter] = useState<string>('all');
  
  // Build date filters
  const fechaDesde = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const fechaHasta = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
  
  const { data: finanzasData, isLoading: finanzasLoading, error: finanzasError, refetch: refetchFinanzas } = useFinanzasDiario({
    fechaDesde,
    fechaHasta,
  });
  const { data: deudoresData, isLoading: deudoresLoading, error: deudoresError, refetch: refetchDeudores } = useFinanzasDeudores();
  const { data: profesionales } = useProfesionales();

  if (finanzasError) {
    return <ErrorState error={finanzasError as Error} retry={refetchFinanzas} />;
  }

  if (deudoresError) {
    return <ErrorState error={deudoresError as Error} retry={refetchDeudores} />;
  }

  // Filter deudores by riesgo if selected
  const filteredDeudores = useMemo(() => {
    if (!deudoresData) return [];
    if (riesgoFilter === 'all') return deudoresData;
    return deudoresData.filter(d => d.segmento_riesgo === riesgoFilter);
  }, [deudoresData, riesgoFilter]);

  // Show risk filter only on matriz/deudores tabs
  const showRiesgoFilter = activeTab === 'matriz';

  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <FinanzasFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        profesional={profesionalFilter}
        onProfesionalChange={setProfesionalFilter}
        riesgo={riesgoFilter}
        onRiesgoChange={setRiesgoFilter}
        profesionales={profesionales || []}
        showRiesgoFilter={showRiesgoFilter}
      />

      {/* KPIs Grid */}
      <FinanzasKPIs 
        finanzasData={finanzasData || []}
        deudoresData={deudoresData || []}
        isLoading={finanzasLoading || deudoresLoading}
      />

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolucion">Evolución</TabsTrigger>
          <TabsTrigger value="matriz">Matriz Riesgo</TabsTrigger>
          <TabsTrigger value="profesional">x Profesional</TabsTrigger>
        </TabsList>

        <TabsContent value="evolucion">
          <EvolucionChart data={finanzasData || []} isLoading={finanzasLoading} />
        </TabsContent>

        <TabsContent value="matriz">
          <MatrizRiesgoChart data={filteredDeudores} isLoading={deudoresLoading} />
        </TabsContent>

        <TabsContent value="profesional">
          <ProfesionalFinanzasTable 
            fechaDesde={fechaDesde} 
            fechaHasta={fechaHasta}
            isLoading={finanzasLoading} 
          />
        </TabsContent>
      </Tabs>

      {/* Deudores Table */}
      <DeudoresTable data={filteredDeudores} isLoading={deudoresLoading} />
    </div>
  );
};
