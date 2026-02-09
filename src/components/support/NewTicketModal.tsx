import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { 
  Ticket, 
  TicketPriority, 
  TicketCategory, 
  priorityConfig, 
  categoryConfig 
} from "@/types/support";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";

interface NewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTicket: (ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "comments">) => void;
}

export function NewTicketModal({
  open,
  onOpenChange,
  onCreateTicket,
}: NewTicketModalProps) {
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const currentProfile = profiles.find((p) => p.user_id === user?.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("media");
  const [category, setCategory] = useState<TicketCategory>("Visualización");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) return;

    onCreateTicket({
      title: title.trim(),
      description: description.trim(),
      status: "abierto",
      priority,
      category,
      assignedTo: null,
      reportedBy: currentProfile?.full_name || user?.email || "Usuario",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setPriority("media");
    setCategory("Visualización");
    setScreenshots([]);
    onOpenChange(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("image/")
    );
    
    if (files.length > 0 && screenshots.length + files.length <= 5) {
      setScreenshots((prev) => [...prev, ...files].slice(0, 5));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        (file) => file.type.startsWith("image/")
      );
      if (files.length > 0 && screenshots.length + files.length <= 5) {
        setScreenshots((prev) => [...prev, ...files].slice(0, 5));
      }
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Ticket de Soporte</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Describe brevemente el problema o solicitud"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el problema en detalle: qué esperabas que pasara, qué pasó realmente, pasos para reproducir..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Screenshots Section */}
          <div className="space-y-2">
            <Label>Capturas de Pantalla</Label>
            
            <div className="flex items-center gap-3 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={screenshots.length >= 5}
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir Imágenes
              </Button>
              <span className="text-sm text-muted-foreground">
                {screenshots.length}/5 imágenes
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Preview uploaded images */}
            {screenshots.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {screenshots.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
                }
                ${screenshots.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Arrastra o haz clic para subir capturas de pantalla
              </p>
            </div>

            {/* Current page info */}
            <p className="text-xs text-muted-foreground mt-2">
              Página actual: <span className="font-mono">/support</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Ticket</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
