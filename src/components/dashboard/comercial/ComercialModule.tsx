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
