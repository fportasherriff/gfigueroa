import { LayoutDashboard, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
          <LayoutDashboard className="w-7 h-7 text-primary" />
          Tablero Principal
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualización de métricas y KPIs de la clínica
        </p>
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
