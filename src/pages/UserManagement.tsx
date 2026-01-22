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
  is_active: boolean;
  created_at: string;
  role: "admin" | "user";
  email?: string;
}

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
  const [newPassword, setNewPassword] = useState("");
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
      
      // Get profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserProfile[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "user",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    setFormError("");

    if (!newEmail || !newPassword) {
      setFormError("Email y contraseña son requeridos");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: newFullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update role if admin was selected (trigger creates user role by default)
        if (newRole === "admin") {
          const { error: roleError } = await supabase
            .from("user_roles")
            .update({ role: "admin" })
            .eq("user_id", authData.user.id);

          if (roleError) throw roleError;
        }

        toast.success("Usuario creado exitosamente");
        setIsAddDialogOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message?.includes("already registered")) {
        setFormError("Este email ya está registrado");
      } else {
        setFormError(error.message || "Error al crear usuario");
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
    setNewPassword("");
    setNewFullName("");
    setNewRole("user");
    setFormError("");
  };

  const filteredUsers = users.filter((u) => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Label htmlFor="new-password">Contraseña *</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
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
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de registro</TableHead>
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
                      <div>
                        <p className="font-medium">
                          {userProfile.full_name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {userProfile.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={userProfile.role === "admin" ? "default" : "secondary"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {userProfile.role === "admin" ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <Shield className="w-3 h-3" />
                        )}
                        {userProfile.role === "admin" ? "Admin" : "Usuario"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={userProfile.is_active}
                          onCheckedChange={() => handleToggleActive(userProfile)}
                          disabled={userProfile.user_id === user?.id}
                        />
                        <span className={userProfile.is_active ? "text-success" : "text-muted-foreground"}>
                          {userProfile.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(userProfile.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(userProfile);
                              setIsEditDialogOpen(true);
                            }}
                            disabled={userProfile.user_id === user?.id}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Cambiar rol
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(userProfile)}
                            disabled={userProfile.user_id === user?.id}
                          >
                            {userProfile.is_active ? (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
