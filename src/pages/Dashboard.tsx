import { LayoutDashboard, Construction, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-dashboard');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(data.message || 'Dashboard actualizado correctamente');
      } else {
        const failedViews = data?.results?.filter((r: any) => !r.success) || [];
        if (failedViews.length > 0) {
          toast.warning(`Algunas vistas no se actualizaron: ${failedViews.map((v: any) => v.view).join(', ')}`);
        } else {
          toast.error('Error al actualizar el dashboard');
        }
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-primary" />
            Tablero Principal
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualización de métricas y KPIs de la clínica
          </p>
        </div>
        <Button 
          onClick={handleRefreshDashboard}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar Dashboard'}
        </Button>
      </div>

      {/* In Progress State */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Construction className="w-8 h-8 text-primary animate-pulse-soft" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Tablero en Construcción
          </h2>
          <p className="text-muted-foreground max-w-md">
            Este módulo está conectándose a las vistas materializadas del proyecto Supabase. 
            Pronto podrás ver todas las métricas y análisis de tu clínica estética aquí.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span>Conectando con base de datos...</span>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 opacity-50">
        {["Pacientes Atendidos", "Ingresos del Mes", "Tratamientos", "Satisfacción"].map(
          (title) => (
            <Card key={title} className="bg-muted/30">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{title}</p>
                <div className="h-8 bg-muted rounded mt-2 animate-pulse" />
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
