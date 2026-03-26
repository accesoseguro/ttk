import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, CheckCircle2, Lock, Clock, LayoutDashboard, Calendar, Zap, User } from "lucide-react";
import { useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import ChatWidget from "@/components/ChatWidget";
import DripSchedule from "@/components/DripSchedule";
import NotificationBell from "@/components/NotificationBell";

type ReleaseMode = "immediate" | "days" | "date";

// Helper: calcula se módulo está bloqueado e quantos dias/horas restam
function getModuleLockInfo(
  mod: { releaseMode?: ReleaseMode; releaseDaysAfterPurchase?: number | null; releaseDate?: Date | null },
  purchaseDate: Date | null,
  isAdmin: boolean
): { isLocked: boolean; unlockDate: Date | null; daysLeft: number | null; label: string } {
  if (isAdmin) return { isLocked: false, unlockDate: null, daysLeft: null, label: "" };

  const mode = mod.releaseMode ?? "immediate";
  const now = new Date();

  if (mode === "immediate") {
    return { isLocked: false, unlockDate: null, daysLeft: null, label: "⚡ Acceso inmediato" };
  }

  if (mode === "date") {
    const releaseDate = mod.releaseDate ? new Date(mod.releaseDate) : null;
    if (!releaseDate) return { isLocked: false, unlockDate: null, daysLeft: null, label: "" };
    if (now >= releaseDate) return { isLocked: false, unlockDate: releaseDate, daysLeft: null, label: "✓ Desbloqueado" };
    const diffDays = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      isLocked: true,
      unlockDate: releaseDate,
      daysLeft: diffDays,
      label: diffDays === 1 ? "Disponible mañana" : `En ${diffDays} días`,
    };
  }

  if (mode === "days") {
    if (!mod.releaseDaysAfterPurchase || mod.releaseDaysAfterPurchase <= 0) {
      return { isLocked: false, unlockDate: null, daysLeft: null, label: "⚡ Acceso inmediato" };
    }
    if (!purchaseDate) {
      return { isLocked: true, unlockDate: null, daysLeft: mod.releaseDaysAfterPurchase, label: `Día ${mod.releaseDaysAfterPurchase} tras compra` };
    }
    const unlockDate = new Date(purchaseDate.getTime() + mod.releaseDaysAfterPurchase * 24 * 60 * 60 * 1000);
    if (now >= unlockDate) return { isLocked: false, unlockDate, daysLeft: null, label: "✓ Desbloqueado" };
    const diffDays = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      isLocked: true,
      unlockDate,
      daysLeft: diffDays,
      label: diffDays === 1 ? "Disponible mañana" : `En ${diffDays} días`,
    };
  }

  return { isLocked: false, unlockDate: null, daysLeft: null, label: "" };
}

// Componente de lista de aulas dentro de um módulo
function ModuleLessons({
  moduleId,
  isLocked,
  onSelectLesson,
}: {
  moduleId: number;
  isLocked: boolean;
  onSelectLesson: (id: number) => void;
}) {
  const { data: lessons, isLoading } = trpc.modules.listLessons.useQuery({ moduleId });
  const { data: progressList } = trpc.members.getProgress.useQuery();

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  if (!lessons || lessons.length === 0) return <p className="text-sm text-muted-foreground py-2">No hay clases en este módulo aún.</p>;

  const progressMap = new Map((progressList ?? []).map((p: any) => [p.lessonId, p]));
  const completed = lessons.filter((l: any) => progressMap.get(l.id)?.isCompleted).length;
  const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {completed > 0 && (
        <div className="flex items-center gap-3 mb-2">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{completed}/{lessons.length} completadas</span>
        </div>
      )}
      {lessons.map((lesson: any) => {
        const prog = progressMap.get(lesson.id);
        const isDone = prog?.isCompleted;
        return (
          <button
            key={lesson.id}
            onClick={() => !isLocked && onSelectLesson(lesson.id)}
            disabled={isLocked}
            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 group ${
              isLocked
                ? "border-border opacity-50 cursor-not-allowed"
                : isDone
                ? "border-green-800 bg-green-950/20 hover:bg-green-950/40"
                : "border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDone ? "bg-green-900" : isLocked ? "bg-gray-800" : "bg-red-900/50 group-hover:bg-red-900"
            }`}>
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : isLocked ? (
                <Lock className="w-4 h-4 text-gray-500" />
              ) : (
                <Play className="w-4 h-4 text-red-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDone ? "text-green-300" : "text-foreground"}`}>
                {lesson.title}
              </p>
              {lesson.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{lesson.description}</p>
              )}
            </div>
            {lesson.duration && (
              <span className="text-xs text-muted-foreground flex-shrink-0">{lesson.duration}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function MembersArea() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const { data: modulesList, isLoading: modulesLoading } = trpc.modules.list.useQuery();
  const { data: subscription, isLoading: subscriptionLoading } = trpc.members.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const toggleModule = (id: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading || (isAuthenticated && subscriptionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Acceso Requerido</CardTitle>
            <CardDescription>Debes iniciar sesión para acceder al área de miembros</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")} className="w-full bg-red-600 hover:bg-red-700">Iniciar Sesión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const hasAccess = isAdmin || (subscription && subscription.status === "active");

  if (!hasAccess && subscription !== undefined) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header mesmo sem acesso */}
        <header className="border-b border-border bg-card sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PM</span>
                </div>
                <h1 className="text-lg font-bold text-foreground">POSICIONES MATADORAS</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
                <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
                  Salir
                </Button>
              </div>
            </div>
          </div>
        </header>
        {/* Conteúdo bloqueado */}
        <div className="flex items-center justify-center py-24 px-4">
          <Card className="w-full max-w-md border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Acceso No Activado</CardTitle>
              <CardDescription className="text-base mt-2">
                Aún no tienes acceso al contenido. Adquiere el curso con un único pago y obtén acceso vitalicio. Si ya realizaste tu pago, contacta al soporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate("/")} className="w-full bg-red-600 hover:bg-red-700">
                Obtener Acceso Ahora
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                ¿Ya compraste? Usa el chat de soporte ↓ para activar tu acceso.
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Chat sempre visível mesmo sem assinatura */}
        <ChatWidget />
      </div>
    );
  }

  const purchaseDate = subscription?.createdAt ? new Date(subscription.createdAt) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">POSICIONES MATADORAS</h1>
                <p className="text-xs text-muted-foreground">Bienvenido, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:inline text-xs">{user?.name?.split(" ")[0] ?? "Perfil"}</span>
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                  <LayoutDashboard className="w-4 h-4 mr-1" /> Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => logout()}>Salir</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {selectedLesson ? (
          <div className="space-y-6">
            <Button variant="outline" onClick={() => setSelectedLesson(null)}>
              ← Volver a Módulos
            </Button>
            <VideoPlayer lessonId={selectedLesson} onBack={() => setSelectedLesson(null)} />
          </div>
        ) : (
          <Tabs defaultValue="modules" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">Mi Área de Miembros</h2>
                <p className="text-muted-foreground text-sm">Accede a tu contenido y sigue tu progreso</p>
              </div>
              <TabsList className="bg-card border border-border">
                <TabsTrigger value="modules" className="flex items-center gap-2">
                  <Play className="w-4 h-4" /> Módulos
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Cronograma
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ABA: MÓDULOS */}
            <TabsContent value="modules" className="space-y-4 mt-0">
              {modulesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : modulesList && modulesList.length > 0 ? (
                <div className="grid gap-4">
                  {modulesList.map((module: any) => {
                    const lockInfo = getModuleLockInfo(module, purchaseDate, isAdmin);
                    const isLocked = lockInfo.isLocked;
                    const isExpanded = expandedModules.has(module.id);

                    return (
                      <Card
                        key={module.id}
                        className={`overflow-hidden transition-all ${isLocked ? "opacity-80" : "hover:shadow-lg hover:shadow-red-950/20"}`}
                      >
                        <CardHeader
                          className={`cursor-pointer select-none ${
                            isLocked
                              ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white"
                              : "bg-gradient-to-r from-red-900 to-black text-white"
                          }`}
                          onClick={() => !isLocked && toggleModule(module.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isLocked ? (
                                <Lock className="w-5 h-5 text-gray-400" />
                              ) : (
                                <Play className="w-5 h-5 text-red-300" />
                              )}
                              <div>
                                <CardTitle className="text-lg">{module.title}</CardTitle>
                                {module.description && (
                                  <CardDescription className="text-gray-300 mt-1">{module.description}</CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isLocked ? (
                                <Badge variant="outline" className="border-orange-500 text-orange-300 text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {lockInfo.label}
                                </Badge>
                              ) : (module.releaseMode === "immediate" || !module.releaseMode) ? (
                                <Badge variant="outline" className="border-red-400 text-red-300 text-xs">
                                  <Zap className="w-3 h-3 mr-1" /> Acceso inmediato
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-300 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Desbloqueado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {!isLocked && isExpanded && (
                          <CardContent className="pt-4">
                            <ModuleLessons
                              moduleId={module.id}
                              isLocked={false}
                              onSelectLesson={setSelectedLesson}
                            />
                          </CardContent>
                        )}

                        {!isLocked && !isExpanded && (
                          <CardContent className="pt-3 pb-3">
                            <button
                              className="text-sm text-primary hover:underline"
                              onClick={() => toggleModule(module.id)}
                            >
                              Ver clases →
                            </button>
                          </CardContent>
                        )}

                        {isLocked && (
                          <CardContent className="pt-3 pb-3">
                            <p className="text-sm text-muted-foreground">
                              {module.releaseMode === "date" && module.releaseDate ? (
                                <>Este módulo se desbloqueará el{" "}
                                  <strong className="text-foreground">
                                    {new Date(module.releaseDate).toLocaleDateString("es-ES", {
                                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                                    })}
                                  </strong>
                                </>
                              ) : lockInfo.unlockDate ? (
                                <>Este módulo se desbloqueará el{" "}
                                  <strong className="text-foreground">
                                    {lockInfo.unlockDate.toLocaleDateString("es-ES", {
                                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                                    })}
                                  </strong>
                                </>
                              ) : (
                                <>Este módulo se desbloqueará el día {module.releaseDaysAfterPurchase} desde tu compra.</>
                              )}
                              {" "}<button
                                className="text-primary underline text-xs ml-1"
                                onClick={() => {
                                  const tab = document.querySelector('[data-value="schedule"]') as HTMLElement;
                                  tab?.click();
                                }}
                              >Ver cronograma →</button>
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No hay módulos disponibles aún</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ABA: CRONOGRAMA */}
            <TabsContent value="schedule" className="mt-0">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-foreground">Cronograma de Contenido</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {purchaseDate
                    ? `Tu acceso comenzó el ${purchaseDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Aquí puedes ver cuándo se desbloquea cada módulo"}
                </p>
              </div>
              <DripSchedule />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Chat de suporte flutuante */}
      <ChatWidget />
    </div>
  );
}
