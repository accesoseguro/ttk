import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  User, Mail, Calendar, Shield, BookOpen, CheckCircle2,
  TrendingUp, Clock, Lock, Edit3, Save, X, ArrowLeft,
  Award, BarChart3, PlayCircle
} from "lucide-react";
import CertificateCard from "@/components/CertificateCard";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric"
  });
}

function formatRelative(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

// Avatar com iniciais
function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const cls = size === "lg"
    ? "w-20 h-20 text-2xl"
    : "w-10 h-10 text-sm";
  return (
    <div className={`${cls} rounded-full bg-primary flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();

  // Edição de nome
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Edição de senha
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const utils = trpc.useUtils();
  const { data: stats, isLoading: statsLoading } = trpc.members.getProfileStats.useQuery();
  const { data: subscription } = trpc.members.getSubscription.useQuery();
  const { data: certificates, isLoading: certsLoading } = trpc.certificates.list.useQuery();

  const updateProfile = trpc.members.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente");
      setEditingName(false);
      setEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      utils.members.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Error al actualizar el perfil");
    },
  });

  const handleSaveName = () => {
    if (!newName.trim()) return;
    updateProfile.mutate({ name: newName.trim() });
  };

  const handleSavePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Completa todos los campos de contraseña");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    updateProfile.mutate({ currentPassword, newPassword });
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/members")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Área de Miembros
          </Button>
          <span className="text-sm font-semibold text-foreground">Mi Perfil</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">

        {/* Hero do perfil */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/30" />
          <CardContent className="pt-0 pb-6 px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
              <div className="ring-4 ring-card rounded-full">
                <Avatar name={user.name ?? user.email ?? "U"} size="lg" />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-xl font-bold text-foreground truncate">{user.name ?? "Sin nombre"}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge className={`flex-shrink-0 ${user.role === "admin"
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-green-900/30 text-green-400 border-green-800/50"
              }`}>
                {user.role === "admin" ? (
                  <><Shield className="w-3 h-3 mr-1" /> Administrador</>
                ) : (
                  <><Award className="w-3 h-3 mr-1" /> Miembro</>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna esquerda: info da conta */}
          <div className="space-y-6">

            {/* Informações da conta */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Información de la Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nome */}
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="bg-background border-border h-8 text-sm"
                        placeholder="Tu nombre"
                        autoFocus
                      />
                      <Button size="sm" className="h-8 w-8 p-0 bg-primary hover:bg-primary/90" onClick={handleSaveName} disabled={updateProfile.isPending}>
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingName(false)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-medium text-foreground">{user.name ?? "Sin nombre"}</p>
                      <Button
                        size="sm" variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => { setNewName(user.name ?? ""); setEditingName(true); }}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="bg-border" />

                {/* Email */}
                <div>
                  <Label className="text-xs text-muted-foreground">Correo Electrónico</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Data de cadastro */}
                <div>
                  <Label className="text-xs text-muted-foreground">Miembro desde</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-foreground">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Último login */}
                <div>
                  <Label className="text-xs text-muted-foreground">Último acceso</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-foreground">{formatDate(user.lastSignedIn)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status da assinatura */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Estado de Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscription ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Estado</span>
                      <Badge className={subscription.status === "active"
                        ? "bg-green-900/30 text-green-400 border-green-800/50"
                        : "bg-red-900/30 text-red-400 border-red-800/50"
                      }>
                        {subscription.status === "active" ? "Activa" : subscription.status}
                      </Badge>
                    </div>
                    {subscription.currentPeriodStart && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Inicio</span>
                        <span className="text-sm text-foreground">{formatDate(subscription.currentPeriodStart)}</span>
                      </div>
                    )}
                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Vencimiento</span>
                        <span className="text-sm text-foreground">{formatDate(subscription.currentPeriodEnd)}</span>
                      </div>
                    )}
                  </>
                ) : user.role === "admin" ? (
                  <div className="text-center py-2">
                    <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Acceso de administrador</p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">Sin suscripción activa</p>
                    <Button
                      size="sm"
                      className="mt-2 bg-primary hover:bg-primary/90 text-white"
                      onClick={() => navigate("/")}
                    >
                      Ver Planes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Segurança */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingPassword ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Contraseña actual</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="bg-background border-border h-8 text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nueva contraseña</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="bg-background border-border h-8 text-sm"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Confirmar nueva contraseña</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="bg-background border-border h-8 text-sm"
                        placeholder="Repite la contraseña"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90 text-white h-8"
                        onClick={handleSavePassword}
                        disabled={updateProfile.isPending}
                      >
                        {updateProfile.isPending ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8"
                        onClick={() => { setEditingPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-border text-foreground hover:bg-accent"
                    onClick={() => setEditingPassword(true)}
                  >
                    <Lock className="w-3 h-3 mr-2" />
                    Cambiar Contraseña
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna direita: progresso e estatísticas */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats gerais */}
            {statsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-card border-border animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-8 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.completedLessons}</p>
                    <p className="text-xs text-muted-foreground">Clases completadas</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalLessons}</p>
                    <p className="text-xs text-muted-foreground">Total de clases</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.progressPercent}%</p>
                    <p className="text-xs text-muted-foreground">Progreso total</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-yellow-900/30 flex items-center justify-center mx-auto mb-2">
                      <BarChart3 className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalModules}</p>
                    <p className="text-xs text-muted-foreground">Módulos</p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Progresso por módulo */}
            {stats && stats.moduleProgress && stats.moduleProgress.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Progreso por Módulo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.moduleProgress.map((mod) => (
                    <div key={mod.moduleId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground truncate pr-4">{mod.moduleTitle}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {mod.completedLessons}/{mod.totalLessons} clases · {mod.percent}%
                        </span>
                      </div>
                      <Progress value={mod.percent} className="h-2 bg-muted" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Atividade recente */}
            {stats && stats.recentActivity && stats.recentActivity.length > 0 ? (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.recentActivity.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <PlayCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.lessonTitle}</p>
                        <p className="text-xs text-muted-foreground">{item.moduleTitle}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <Badge className="bg-green-900/30 text-green-400 border-green-800/50 text-xs">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Completada
                        </Badge>
                        {item.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">{formatRelative(item.completedAt)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : stats && stats.recentActivity && stats.recentActivity.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-10 text-center">
                  <PlayCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium text-foreground">Sin actividad reciente</p>
                  <p className="text-xs text-muted-foreground mt-1">Completa tu primera clase para ver tu progreso aquí</p>
                  <Button
                    size="sm"
                    className="mt-4 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => navigate("/members")}
                  >
                    Ir a los Módulos
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {/* Seção de Certificados */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Mis Certificados
                  {certificates && certificates.length > 0 && (
                    <Badge className="bg-yellow-900/40 text-yellow-400 border-yellow-800/50 text-xs ml-auto">
                      {certificates.length} {certificates.length === 1 ? "certificado" : "certificados"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : certificates && certificates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {certificates.map((cert) => (
                      <CertificateCard key={cert.id} certificate={cert} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-yellow-900/20 border border-yellow-800/30 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-yellow-700" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Aún no tienes certificados</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Completa el 100% de las clases de un módulo para obtener tu certificado oficial
                    </p>
                    <Button
                      size="sm"
                      className="mt-4 bg-primary hover:bg-primary/90 text-white"
                      onClick={() => navigate("/members")}
                    >
                      Ir a los Módulos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
