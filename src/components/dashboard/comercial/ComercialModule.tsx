import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useComercialEmbudo, useComercialCanales, useOrigenes } from '@/hooks/useDashboardData';
import { ErrorState } from '../DashboardStates';
import { ComercialKPIs } from './ComercialKPIs';
import { EmbudoChart } from './EmbudoChart';
import { CanalesTable } from './CanalesTable';

export const ComercialModule = () => {
  const [origenFilter, setOrigenFilter] = useState<string>('all');
  
  const { data: embudoData, isLoading: embudoLoading, error: embudoError, refetch: refetchEmbudo } = useComercialEmbudo({
    origen: origenFilter === 'all' ? undefined : origenFilter,
  });
  const { data: canalesData, isLoading: canalesLoading, error: canalesError, refetch: refetchCanales } = useComercialCanales();
  const { data: origenes } = useOrigenes();

  if (embudoError) {
    return <ErrorState error={embudoError as Error} retry={refetchEmbudo} />;
  }

  if (canalesError) {
    return <ErrorState error={canalesError as Error} retry={refetchCanales} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={origenFilter} onValueChange={setOrigenFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los orígenes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
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
