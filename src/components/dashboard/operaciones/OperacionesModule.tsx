import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOperacionesDiario, useOperacionesHeatmap, useOperacionesCapacidad, useSucursales, useProfesionales } from '@/hooks/useDashboardData';
import { ErrorState } from '../DashboardStates';
import { OperacionesKPIs } from './OperacionesKPIs';
import { HeatmapChart } from './HeatmapChart';
import { CapacidadChart } from './CapacidadChart';

export const OperacionesModule = () => {
  const [sucursalFilter, setSucursalFilter] = useState<string>('all');
  const [profesionalFilter, setProfesionalFilter] = useState<string>('all');
  
  const { data: operacionesData, isLoading: operacionesLoading, error: operacionesError, refetch: refetchOperaciones } = useOperacionesDiario({
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

  if (operacionesError) {
    return <ErrorState error={operacionesError as Error} retry={refetchOperaciones} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
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

      {/* KPIs Grid */}
      <OperacionesKPIs 
        operacionesData={operacionesData || []}
        capacidadData={capacidadData || []}
        isLoading={operacionesLoading || capacidadLoading}
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
