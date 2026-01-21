import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  PlusCircle, 
  Clock, 
  MessageSquare, 
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  Archive,
  Lightbulb,
  CheckCheck
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface HowItWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const workflowSteps = [
  {
    icon: PlusCircle,
    title: "1. Crear un ticket",
    description: "Haz clic en \"Nuevo Ticket\" y describe el problema o solicitud con el mayor detalle posible. Incluye capturas de pantalla si es necesario.",
    color: "text-primary",
  },
  {
    icon: Clock,
    title: "2. En progreso",
    description: "Un miembro del equipo tomará tu ticket y comenzará a trabajar en la solución. Puedes ver el progreso en tiempo real.",
    color: "text-warning",
  },
  {
    icon: MessageSquare,
    title: "3. Colabora con comentarios",
    description: "Usa la sección de comentarios para agregar información adicional. Puedes mencionar a otros usuarios con @ y adjuntar imágenes.",
    color: "text-accent",
  },
  {
    icon: CheckCircle2,
    title: "4. Revisión y validación",
    description: "Cuando el ticket esté \"En revisión\", debes verificar que la solución sea correcta y confirmar o rechazar.",
    color: "text-purple-500",
  },
  {
    icon: CheckCheck,
    title: "5. Resuelto",
    description: "Una vez validado, el ticket se marca como resuelto. ¡Problema solucionado!",
    color: "text-success",
  },
];

const statusDescriptions = [
  { icon: Circle, label: "Abierto", description: "Ticket nuevo esperando atención", color: "text-info" },
  { icon: Clock, label: "En progreso", description: "Se está trabajando en el ticket", color: "text-warning" },
  { icon: CheckCircle2, label: "En revisión", description: "Solución aplicada, esperando tu validación", color: "text-purple-500" },
  { icon: CheckCheck, label: "Resuelto", description: "Validado y cerrado exitosamente", color: "text-success" },
  { icon: AlertCircle, label: "Bloqueado", description: "Requiere acción externa para continuar", color: "text-destructive" },
  { icon: XCircle, label: "Rechazado", description: "La solución no fue aceptada", color: "text-red-600" },
  { icon: Archive, label: "Cerrado", description: "Ticket archivado", color: "text-muted-foreground" },
];

const tips = [
  "Describe el problema con detalle: qué esperabas que pasara vs qué pasó realmente.",
  "Adjunta capturas de pantalla siempre que sea posible.",
  "Incluye pasos para reproducir el problema.",
  "Indica la prioridad correcta para una mejor atención.",
];

export function HowItWorksModal({ open, onOpenChange }: HowItWorksModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Flujo de trabajo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {workflowSteps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full bg-muted ${step.color}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div>
          <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            ⚙️ Estados del ticket
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {statusDescriptions.map((status, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-muted/30"
              >
                <status.icon className={`w-4 h-4 mt-0.5 ${status.color}`} />
                <div>
                  <p className="font-medium text-sm">{status.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {status.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        <div>
          <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-warning" />
            Consejos útiles
          </h4>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
