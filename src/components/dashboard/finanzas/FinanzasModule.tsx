import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanzasDiario, useFinanzasDeudores, useSucursales } from '@/hooks/useDashboardData';
import { ErrorState } from '../DashboardStates';
import { FinanzasKPIs } from './FinanzasKPIs';
import { EvolucionChart } from './EvolucionChart';
import { MatrizRiesgoChart } from './MatrizRiesgoChart';
import { ProfesionalTable } from './ProfesionalTable';
import { DeudoresTable } from './DeudoresTable';

export const FinanzasModule = () => {
  const [sucursalFilter, setSucursalFilter] = useState<string>('all');
  
  const { data: finanzasData, isLoading: finanzasLoading, error: finanzasError, refetch: refetchFinanzas } = useFinanzasDiario();
  const { data: deudoresData, isLoading: deudoresLoading, error: deudoresError, refetch: refetchDeudores } = useFinanzasDeudores();
  const { data: sucursales } = useSucursales();

  if (finanzasError) {
    return <ErrorState error={finanzasError as Error} retry={refetchFinanzas} />;
  }

  if (deudoresError) {
    return <ErrorState error={deudoresError as Error} retry={refetchDeudores} />;
  }

  // Filter data by sucursal if selected
  const filteredFinanzas = sucursalFilter === 'all' 
    ? finanzasData || []
    : (finanzasData || []).filter(d => d.sucursal === sucursalFilter);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
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
      </div>

      {/* KPIs Grid */}
      <FinanzasKPIs 
        finanzasData={filteredFinanzas}
        deudoresData={deudoresData || []}
        isLoading={finanzasLoading || deudoresLoading}
      />

      {/* Tabs Section */}
      <Tabs defaultValue="evolucion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolucion">Evolución</TabsTrigger>
          <TabsTrigger value="matriz">Matriz Riesgo</TabsTrigger>
          <TabsTrigger value="profesional">x Sucursal</TabsTrigger>
        </TabsList>

        <TabsContent value="evolucion">
          <EvolucionChart data={filteredFinanzas} isLoading={finanzasLoading} />
        </TabsContent>

        <TabsContent value="matriz">
          <MatrizRiesgoChart data={deudoresData || []} isLoading={deudoresLoading} />
        </TabsContent>

        <TabsContent value="profesional">
          <ProfesionalTable data={filteredFinanzas} isLoading={finanzasLoading} />
        </TabsContent>
      </Tabs>

      {/* Deudores Table */}
      <DeudoresTable data={deudoresData || []} isLoading={deudoresLoading} />
    </div>
  );
};
