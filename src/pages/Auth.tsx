import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "La contraseña debe tener al menos 6 caracteres");

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Check for recovery/invite token in URL hash
  useEffect(() => {
    const checkTokenInHash = async () => {
      const hash = window.location.hash;
      
      // Supabase puts tokens in the hash: #access_token=...&type=recovery/invite
      if (hash && (hash.includes("type=recovery") || hash.includes("type=invite") || hash.includes("type=signup"))) {
        // Let Supabase handle the token exchange
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session from token:", error);
          setError("El enlace ha expirado o es inválido. Solicita uno nuevo.");
          setIsCheckingToken(false);
          return;
        }
        
        if (data.session) {
          // User is now authenticated via token, show password setting form
          setIsSettingPassword(true);
          setEmail(data.session.user.email || "");
        }
      }
      
      setIsCheckingToken(false);
    };
    
    checkTokenInHash();
  }, []);

  // Redirect if user is logged in AND not setting password
  useEffect(() => {
    if (user && !loading && !isSettingPassword && !isCheckingToken) {
      navigate("/");
    }
  }, [user, loading, isSettingPassword, isCheckingToken, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch {
      setError("Email o contraseña inválidos");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Email o contraseña incorrectos");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Por favor confirma tu email antes de iniciar sesión");
      } else {
        setError(error.message);
      }
    } else {
      navigate("/");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      emailSchema.parse(email);
    } catch {
      setError("Por favor ingresa un email válido");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setIsSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Te enviamos un email con instrucciones para restablecer tu contraseña.");
      setShowResetPassword(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      passwordSchema.parse(password);
    } catch {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("¡Contraseña creada exitosamente!");
      // Clear hash and redirect
      window.location.hash = "";
      setTimeout(() => navigate("/"), 1500);
    }
  };

  if (loading || isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary shadow-lg">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Ghigifigueroa Analytics</CardTitle>
            <CardDescription className="text-muted-foreground">
              {isSettingPassword 
                ? "Creá tu contraseña para acceder"
                : showResetPassword 
                  ? "Recupera tu contraseña" 
                  : "Accede a tu panel de control"
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-success/50 bg-success/10 text-success">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {isSettingPassword ? (
            // Password creation form for invited users
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Crear contraseña y entrar
              </Button>
            </form>
          ) : showResetPassword ? (
            // Password reset request form
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Enviar instrucciones
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowResetPassword(false);
                  setError("");
                  setSuccess("");
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </Button>
            </form>
          ) : (
            // Login form only (no registration)
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Iniciar Sesión
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setShowResetPassword(true);
                  setError("");
                  setSuccess("");
                }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
