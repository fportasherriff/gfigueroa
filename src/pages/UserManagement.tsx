import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Loader2, 
  Search,
  MoreHorizontal,
  Trash2,
  Edit
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
  role: "admin" | "user";
}

// Helper to get initials from name
const getInitials = (name: string | null, email: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

// Helper to generate consistent color from string
const getAvatarColor = (str: string): string => {
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
    "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-cyan-500"
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function UserManagement() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && !isAdmin) {
      navigate("/");
      toast.error("No tienes permisos para acceder a esta página");
      return;
    }

    if (isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users via edge function (includes emails from auth.users)
      const { data, error } = await supabase.functions.invoke("list-users");

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Error al cargar usuarios");

      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    setFormError("");

    if (!newEmail) {
      setFormError("El email es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      // Invite user via edge function (uses admin API)
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: newEmail,
          fullName: newFullName,
          role: newRole,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Error al invitar usuario");

      toast.success("Invitación enviada exitosamente");
      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      if (error.message?.includes("already registered") || error.message?.includes("already been registered")) {
        setFormError("Este email ya está registrado");
      } else {
        setFormError(error.message || "Error al invitar usuario");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (userProfile: UserProfile) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !userProfile.is_active })
        .eq("id", userProfile.id);

      if (error) throw error;

      setUsers(users.map((u) => 
        u.id === userProfile.id 
          ? { ...u, is_active: !u.is_active }
          : u
      ));

      toast.success(
        userProfile.is_active 
          ? "Usuario desactivado" 
          : "Usuario activado"
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Error al actualizar estado del usuario");
    }
  };

  const handleUpdateRole = async (userProfile: UserProfile, newRole: "admin" | "user") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userProfile.user_id);

      if (error) throw error;

      setUsers(users.map((u) => 
        u.id === userProfile.id 
          ? { ...u, role: newRole }
          : u
      ));

      toast.success(`Rol actualizado a ${newRole}`);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    }
  };

  const resetForm = () => {
    setNewEmail("");
    setNewFullName("");
    setNewRole("user");
    setFormError("");
  };

  const filteredUsers = users.filter((u) => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Accesos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de usuarios y permisos del sistema
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invitar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Envía una invitación por email para acceder al sistema
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Nombre completo</Label>
                <Input
                  id="new-name"
                  placeholder="Juan Pérez"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-role">Rol</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "user")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Usuario
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddUser} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Crear Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userProfile) => (
                  <TableRow key={userProfile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(userProfile.email)} flex items-center justify-center text-white font-medium text-sm`}>
                          {getInitials(userProfile.full_name, userProfile.email)}
                        </div>
                        <span className="font-medium">
                          {userProfile.full_name || "Sin nombre"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {userProfile.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userProfile.role}
                        onValueChange={(v) => handleUpdateRole(userProfile, v as "admin" | "user")}
                        disabled={userProfile.user_id === user?.id}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuario</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={userProfile.is_active}
                          onCheckedChange={() => handleToggleActive(userProfile)}
                          disabled={userProfile.user_id === user?.id}
                        />
                        <span className={userProfile.is_active ? "text-green-600" : "text-orange-500"}>
                          {userProfile.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(userProfile);
                          setIsEditDialogOpen(true);
                        }}
                        disabled={userProfile.user_id === user?.id}
                        className="text-primary hover:text-primary/80"
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Actualiza el rol de {selectedUser?.full_name || "este usuario"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nuevo rol</Label>
              <Select
                value={selectedUser?.role}
                onValueChange={(v) => {
                  if (selectedUser) {
                    handleUpdateRole(selectedUser, v as "admin" | "user");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Usuario
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Administrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
