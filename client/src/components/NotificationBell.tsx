import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, X, CheckCheck, BookOpen, Zap, CreditCard, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationType = "module_released" | "new_lesson" | "subscription" | "manual";

const typeIcon: Record<NotificationType, React.ReactNode> = {
  module_released: <BookOpen className="w-4 h-4 text-green-400" />,
  new_lesson: <Zap className="w-4 h-4 text-yellow-400" />,
  subscription: <CreditCard className="w-4 h-4 text-blue-400" />,
  manual: <Megaphone className="w-4 h-4 text-primary" />,
};

const typeBg: Record<NotificationType, string> = {
  module_released: "bg-green-900/30 border-green-800/50",
  new_lesson: "bg-yellow-900/30 border-yellow-800/50",
  subscription: "bg-blue-900/30 border-blue-800/50",
  manual: "bg-primary/10 border-primary/30",
};

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Ahora mismo";
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: unreadData } = trpc.notifications.countUnread.useQuery(undefined, {
    refetchInterval: 30000, // polling a cada 30s
  });
  const { data: notifList, isLoading } = trpc.notifications.list.useQuery(undefined, {
    enabled: open,
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.countUnread.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.countUnread.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      {/* Botão sino */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Painel dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Notificaciones</span>
              {unreadCount > 0 && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-1.5 py-0">
                  {unreadCount} nueva{unreadCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !notifList || notifList.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Sin notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifList.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                    className={cn(
                      "px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors",
                      !n.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border",
                        typeBg[n.type as NotificationType] ?? "bg-card border-border"
                      )}>
                        {typeIcon[n.type as NotificationType] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={cn(
                            "text-sm leading-tight",
                            n.isRead ? "text-muted-foreground font-normal" : "text-foreground font-semibold"
                          )}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifList && notifList.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-card/50">
              <p className="text-xs text-muted-foreground text-center">
                {notifList.length} notificaci{notifList.length !== 1 ? "ones" : "ón"} en total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
