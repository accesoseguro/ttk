import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Unlock, Calendar, Clock, Zap, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

type ReleaseMode = "immediate" | "days" | "date";

interface ModuleWithStatus {
  id: number;
  title: string;
  description: string | null;
  releaseMode: ReleaseMode;
  releaseDaysAfterPurchase: number | null;
  releaseDate: Date | null;
  isActive: boolean;
  order: number;
  isUnlocked: boolean;
  unlockDate: Date | null;
  daysRemaining: number | null;
  hoursRemaining: number | null;
}

function computeUnlockInfo(
  mod: { releaseMode: ReleaseMode; releaseDaysAfterPurchase: number | null; releaseDate: Date | null },
  purchaseDate: Date | null,
  isAdmin: boolean
): { isUnlocked: boolean; unlockDate: Date | null; daysRemaining: number | null; hoursRemaining: number | null } {
  if (isAdmin) return { isUnlocked: true, unlockDate: null, daysRemaining: null, hoursRemaining: null };

  const now = new Date();

  if (mod.releaseMode === "immediate") {
    return { isUnlocked: true, unlockDate: null, daysRemaining: null, hoursRemaining: null };
  }

  if (mod.releaseMode === "date") {
    const releaseDate = mod.releaseDate ? new Date(mod.releaseDate) : null;
    if (!releaseDate) return { isUnlocked: true, unlockDate: null, daysRemaining: null, hoursRemaining: null };
    const isUnlocked = now >= releaseDate;
    const diffMs = releaseDate.getTime() - now.getTime();
    const daysRemaining = isUnlocked ? null : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hoursRemaining = isUnlocked ? null : Math.ceil(diffMs / (1000 * 60 * 60));
    return { isUnlocked, unlockDate: releaseDate, daysRemaining, hoursRemaining };
  }

  if (mod.releaseMode === "days") {
    if (!purchaseDate || !mod.releaseDaysAfterPurchase) {
      return { isUnlocked: !mod.releaseDaysAfterPurchase, unlockDate: null, daysRemaining: null, hoursRemaining: null };
    }
    const unlockDate = new Date(purchaseDate.getTime() + mod.releaseDaysAfterPurchase * 24 * 60 * 60 * 1000);
    const isUnlocked = now >= unlockDate;
    const diffMs = unlockDate.getTime() - now.getTime();
    const daysRemaining = isUnlocked ? null : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hoursRemaining = isUnlocked ? null : Math.ceil(diffMs / (1000 * 60 * 60));
    return { isUnlocked, unlockDate, daysRemaining, hoursRemaining };
  }

  return { isUnlocked: true, unlockDate: null, daysRemaining: null, hoursRemaining: null };
}

// Contador regressivo em tempo real
function Countdown({ targetDate }: { targetDate: Date }) {
  const [diff, setDiff] = useState(() => targetDate.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = targetDate.getTime() - Date.now();
      setDiff(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (diff <= 0) return <span className="text-green-400 font-semibold">¡Disponible ahora!</span>;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return (
      <span className="font-mono text-orange-300">
        {days}d {hours.toString().padStart(2, "0")}h {minutes.toString().padStart(2, "0")}m
      </span>
    );
  }
  return (
    <span className="font-mono text-orange-300">
      {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

export default function DripSchedule() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: modulesList, isLoading: modulesLoading } = trpc.modules.list.useQuery();
  const { data: subscription, isLoading: subLoading } = trpc.members.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const purchaseDate = subscription?.createdAt ? new Date(subscription.createdAt) : null;

  if (modulesLoading || subLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!modulesList || modulesList.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6 text-center text-muted-foreground">
          No hay módulos disponibles aún.
        </CardContent>
      </Card>
    );
  }

  const modulesWithStatus: ModuleWithStatus[] = modulesList.map((mod: any) => {
    const info = computeUnlockInfo(
      { releaseMode: mod.releaseMode ?? "immediate", releaseDaysAfterPurchase: mod.releaseDaysAfterPurchase, releaseDate: mod.releaseDate },
      purchaseDate,
      isAdmin
    );
    return { ...mod, ...info };
  });

  const unlocked = modulesWithStatus.filter(m => m.isUnlocked);
  const locked = modulesWithStatus.filter(m => !m.isUnlocked).sort((a, b) => {
    if (a.unlockDate && b.unlockDate) return a.unlockDate.getTime() - b.unlockDate.getTime();
    if (a.daysRemaining !== null && b.daysRemaining !== null) return a.daysRemaining - b.daysRemaining;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-950/30 border-green-800">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-400">{unlocked.length}</p>
            <p className="text-xs text-green-300 mt-1">Disponibles</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-950/30 border-orange-800">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{locked.length}</p>
            <p className="text-xs text-orange-300 mt-1">Por desbloquear</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">{modulesList.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total módulos</p>
          </CardContent>
        </Card>
      </div>

      {/* Módulos disponíveis */}
      {unlocked.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Unlock className="w-5 h-5 text-green-400" />
            Módulos Disponibles
          </h3>
          <div className="space-y-2">
            {unlocked.map(mod => (
              <Card key={mod.id} className="bg-card border-green-800/40 hover:border-green-600/60 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{mod.title}</p>
                        {mod.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{mod.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {mod.releaseMode === "immediate" && (
                        <Badge className="bg-green-900/50 text-green-300 border-green-700 text-xs">
                          <Zap className="w-3 h-3 mr-1" /> Inmediato
                        </Badge>
                      )}
                      {mod.releaseMode === "days" && (
                        <Badge className="bg-green-900/50 text-green-300 border-green-700 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Desbloqueado
                        </Badge>
                      )}
                      {mod.releaseMode === "date" && (
                        <Badge className="bg-green-900/50 text-green-300 border-green-700 text-xs">
                          <Calendar className="w-3 h-3 mr-1" /> Disponible
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Módulos bloqueados com cronograma */}
      {locked.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Próximos Desbloqueos
          </h3>
          <div className="space-y-3">
            {locked.map((mod, idx) => (
              <Card key={mod.id} className="bg-card border-orange-800/40 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-orange-900 to-red-900" />
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{mod.title}</p>
                          {idx === 0 && (
                            <Badge className="bg-orange-900/50 text-orange-300 border-orange-700 text-xs">Próximo</Badge>
                          )}
                        </div>
                        {mod.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{mod.description}</p>
                        )}

                        {/* Info de liberação */}
                        <div className="mt-2 space-y-1">
                          {mod.releaseMode === "days" && mod.unlockDate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Se desbloquea el{" "}
                                <strong className="text-foreground">
                                  {new Date(mod.unlockDate).toLocaleDateString("es-ES", {
                                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                                  })}
                                </strong>
                              </span>
                            </div>
                          )}
                          {mod.releaseMode === "date" && mod.unlockDate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Fecha de lanzamiento:{" "}
                                <strong className="text-foreground">
                                  {new Date(mod.unlockDate).toLocaleDateString("es-ES", {
                                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                                  })}
                                </strong>
                              </span>
                            </div>
                          )}
                          {mod.releaseMode === "days" && !purchaseDate && (
                            <p className="text-xs text-yellow-500">
                              Se desbloqueará {mod.releaseDaysAfterPurchase} días después de tu compra
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contagem regressiva */}
                    {mod.unlockDate && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground mb-1">Disponible en</p>
                        <Countdown targetDate={new Date(mod.unlockDate)} />
                      </div>
                    )}
                    {!mod.unlockDate && mod.releaseMode === "days" && mod.releaseDaysAfterPurchase && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground mb-1">Días tras compra</p>
                        <span className="font-bold text-orange-300 text-lg">{mod.releaseDaysAfterPurchase}d</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem se tudo liberado */}
      {locked.length === 0 && unlocked.length > 0 && (
        <Card className="bg-green-950/20 border-green-800/40">
          <CardContent className="pt-4 pb-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-300 font-medium">¡Tienes acceso a todos los módulos!</p>
            <p className="text-xs text-muted-foreground mt-1">Todo el contenido está disponible para ti</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
