import { useState } from 'react';
import { LayoutDashboard, DollarSign, Calendar, TrendingUp, RefreshCw, FileX } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FinanzasModule } from '@/components/dashboard/finanzas/FinanzasModule';
import { OperacionesModule } from '@/components/dashboard/operaciones/OperacionesModule';
import { ComercialModule } from '@/components/dashboard/comercial/ComercialModule';
import { useFinanzasDiario } from '@/hooks/useDashboardData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Check if we have data
  const { data: finanzasData, isLoading } = useFinanzasDiario();
  const hasData = (finanzasData?.length ?? 0) > 0;

  const handleRefreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-dashboard');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success('Dashboard actualizado correctamente');
        // Invalidate all dashboard queries to refetch
        queryClient.invalidateQueries({ queryKey: ['finanzas-diario'] });
        queryClient.invalidateQueries({ queryKey: ['finanzas-deudores'] });
        queryClient.invalidateQueries({ queryKey: ['operaciones-diario'] });
        queryClient.invalidateQueries({ queryKey: ['operaciones-heatmap'] });
        queryClient.invalidateQueries({ queryKey: ['operaciones-capacidad'] });
        queryClient.invalidateQueries({ queryKey: ['comercial-embudo'] });
        queryClient.invalidateQueries({ queryKey: ['comercial-canales'] });
      } else {
        throw new Error(data?.error || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Error al actualizar el dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Empty state when no data
  if (!isLoading && !hasData) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
              <LayoutDashboard className="w-7 h-7 text-primary" />
              Tablero Principal
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualización de métricas y KPIs
            </p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <FileX className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Sin datos disponibles
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Para ver las métricas, primero cargá los 5 archivos CSV en la sección de "Carga de CSV" 
              y luego presioná "Actualizar Dashboard".
            </p>
            <Button onClick={handleRefreshDashboard} disabled={isRefreshing}>
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualizar Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-primary" />
            Tablero Principal
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualización de métricas y KPIs
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleRefreshDashboard}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Actualizar Dashboard
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="finanzas" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="finanzas" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Finanzas & Recupero</span>
            <span className="sm:hidden">Finanzas</span>
          </TabsTrigger>
          <TabsTrigger value="operaciones" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Operaciones</span>
            <span className="sm:hidden">Ops</span>
          </TabsTrigger>
          <TabsTrigger value="comercial" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Comercial</span>
            <span className="sm:hidden">Mkt</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="finanzas">
          <FinanzasModule />
        </TabsContent>

        <TabsContent value="operaciones">
          <OperacionesModule />
        </TabsContent>

        <TabsContent value="comercial">
          <ComercialModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}
