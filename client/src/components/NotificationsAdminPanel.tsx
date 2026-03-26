import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, BookOpen, Zap, CreditCard, Megaphone, Users, Clock } from "lucide-react";
import { toast } from "sonner";

const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  module_released: { label: "Módulo liberado", icon: <BookOpen className="w-3 h-3" />, color: "bg-green-900/50 text-green-300 border-green-700" },
  new_lesson: { label: "Nueva clase", icon: <Zap className="w-3 h-3" />, color: "bg-yellow-900/50 text-yellow-300 border-yellow-700" },
  subscription: { label: "Suscripción", icon: <CreditCard className="w-3 h-3" />, color: "bg-blue-900/50 text-blue-300 border-blue-700" },
  manual: { label: "Manual", icon: <Megaphone className="w-3 h-3" />, color: "bg-primary/20 text-primary border-primary/30" },
};

function formatDate(date: Date) {
  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export default function NotificationsAdminPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"module_released" | "new_lesson" | "subscription" | "manual">("manual");

  const utils = trpc.useUtils();
  const { data: history, isLoading: historyLoading } = trpc.notifications.adminList.useQuery();

  const sendToAll = trpc.notifications.sendToAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Notificación enviada a ${data.sent} miembro${data.sent !== 1 ? "s" : ""}`);
      setTitle("");
      setMessage("");
      setType("manual");
      utils.notifications.adminList.invalidate();
    },
    onError: (err) => {
      toast.error("Error al enviar: " + err.message);
    },
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("El título y el mensaje son obligatorios");
      return;
    }
    sendToAll.mutate({ title: title.trim(), message: message.trim(), type });
  };

  return (
    <div className="space-y-6">
      {/* Formulário de envio */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Enviar Notificación a Todos los Miembros
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            La notificación aparecerá en el área de miembros de todos los alumnos con suscripción activa.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Notificación</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">📢 Anuncio Manual</SelectItem>
                  <SelectItem value="module_released">📚 Módulo Liberado</SelectItem>
                  <SelectItem value="new_lesson">⚡ Nueva Clase</SelectItem>
                  <SelectItem value="subscription">💳 Suscripción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ej: ¡Nuevo módulo disponible!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background border-border"
                maxLength={255}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              placeholder="Escribe el contenido de la notificación..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="p-4 rounded-lg border border-dashed border-border bg-background/50">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Bell className="w-3 h-3" /> Vista previa de la notificación:
              </p>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                  type === "module_released" ? "bg-green-900/30 border-green-800/50" :
                  type === "new_lesson" ? "bg-yellow-900/30 border-yellow-800/50" :
                  type === "subscription" ? "bg-blue-900/30 border-blue-800/50" :
                  "bg-primary/10 border-primary/30"
                }`}>
                  {type === "module_released" && <BookOpen className="w-4 h-4 text-green-400" />}
                  {type === "new_lesson" && <Zap className="w-4 h-4 text-yellow-400" />}
                  {type === "subscription" && <CreditCard className="w-4 h-4 text-blue-400" />}
                  {type === "manual" && <Megaphone className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title || "Título..."}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{message || "Mensaje..."}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={sendToAll.isPending || !title.trim() || !message.trim()}
            className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
          >
            {sendToAll.isPending ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</span>
            ) : (
              <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Enviar a Todos los Miembros</span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico de envios */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Historial de Notificaciones Enviadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No hay notificaciones enviadas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => {
                const typeInfo = typeLabels[item.type] ?? typeLabels.manual;
                return (
                  <div key={idx} className="flex items-start justify-between p-4 rounded-lg border border-border bg-background/50 gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs flex-shrink-0 ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge className="bg-card border-border text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {item.count}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
