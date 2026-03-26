import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, BookOpen, Users, MessageSquare, Video, Plus, Edit, Trash2, Check, X, Upload, Send, Shield, ShieldOff, Calendar, Zap, Clock, CheckCircle2, Bell, BarChart2, Palette } from "lucide-react";
import ProgressStatsPanel from "@/components/ProgressStatsPanel";
import NotificationsAdminPanel from "@/components/NotificationsAdminPanel";
import LandingEditorPanel from "@/components/LandingEditorPanel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
function StatsPanel() {
  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[
        { label: "Miembros Totales", value: stats?.totalMembers ?? 0, color: "text-blue-400" },
        { label: "Suscripciones Activas", value: stats?.activeSubscriptions ?? 0, color: "text-green-400" },
        { label: "Módulos", value: stats?.totalModules ?? 0, color: "text-yellow-400" },
        { label: "Clases", value: stats?.totalLessons ?? 0, color: "text-red-400" },
      ].map(s => (
        <Card key={s.label} className="bg-card border-border">
          <CardContent className="pt-6">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── MÓDULOS ─────────────────────────────────────────────────────────────────
function ModulesPanel() {
  const utils = trpc.useUtils();
  const { data: mods, isLoading } = trpc.admin.listModules.useQuery();
  const createMod = trpc.admin.createModule.useMutation({ onSuccess: () => { utils.admin.listModules.invalidate(); toast.success("Módulo creado"); } });
  const updateMod = trpc.admin.updateModule.useMutation({ onSuccess: () => { utils.admin.listModules.invalidate(); toast.success("Módulo actualizado"); } });
  const deleteMod = trpc.admin.deleteModule.useMutation({ onSuccess: () => { utils.admin.listModules.invalidate(); toast.success("Módulo eliminado"); } });

  const [form, setForm] = useState({ title: "", description: "", order: 0, releaseMode: "immediate" as "immediate" | "days" | "date", releaseDaysAfterPurchase: "", releaseDate: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", releaseMode: "immediate" as "immediate" | "days" | "date", releaseDaysAfterPurchase: "", releaseDate: "" });

  const handleCreate = () => {
    if (!form.title.trim()) return toast.error("El título es obligatorio");
    createMod.mutate({
      title: form.title,
      description: form.description || undefined,
      order: form.order,
      releaseMode: form.releaseMode,
      releaseDaysAfterPurchase: form.releaseMode === "days" && form.releaseDaysAfterPurchase !== "" ? parseInt(form.releaseDaysAfterPurchase) : null,
      releaseDate: form.releaseMode === "date" && form.releaseDate ? form.releaseDate : null,
    });
    setForm({ title: "", description: "", order: 0, releaseMode: "immediate", releaseDaysAfterPurchase: "", releaseDate: "" });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg">Crear Nuevo Módulo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Ej: Módulo 1 - Introducción" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Modo de Liberación</Label>
              <Select value={form.releaseMode} onValueChange={v => setForm(f => ({ ...f, releaseMode: v as any }))}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate"><span className="flex items-center gap-2"><Zap className="w-3 h-3 text-green-400" /> Inmediato (al comprar)</span></SelectItem>
                  <SelectItem value="days"><span className="flex items-center gap-2"><Clock className="w-3 h-3 text-orange-400" /> Días tras la compra</span></SelectItem>
                  <SelectItem value="date"><span className="flex items-center gap-2"><Calendar className="w-3 h-3 text-blue-400" /> Fecha fija específica</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.releaseMode === "days" && (
            <div className="space-y-2 max-w-xs">
              <Label>Número de días tras la compra</Label>
              <Input type="number" min="1" placeholder="Ej: 7" value={form.releaseDaysAfterPurchase} onChange={e => setForm(f => ({ ...f, releaseDaysAfterPurchase: e.target.value }))} className="bg-background" />
              <p className="text-xs text-muted-foreground">El módulo se libera X días después de que el alumno compre</p>
            </div>
          )}
          {form.releaseMode === "date" && (
            <div className="space-y-2 max-w-xs">
              <Label>Fecha de liberación</Label>
              <Input type="datetime-local" value={form.releaseDate} onChange={e => setForm(f => ({ ...f, releaseDate: e.target.value }))} className="bg-background" />
              <p className="text-xs text-muted-foreground">El módulo se libera en esta fecha para todos los alumnos</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea placeholder="Descripción del módulo..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background" />
          </div>
          <Button onClick={handleCreate} disabled={createMod.isPending} className="bg-red-600 hover:bg-red-700">
            {createMod.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Crear Módulo
          </Button>
        </CardContent>
      </Card>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
        <div className="space-y-3">
          {mods?.map(mod => (
            <Card key={mod.id} className="bg-card border-border">
              <CardContent className="pt-4">
                {editId === mod.id ? (
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Título</Label>
                        <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Modo de Liberación</Label>
                        <Select value={editForm.releaseMode} onValueChange={v => setEditForm(f => ({ ...f, releaseMode: v as any }))}>
                          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Inmediato</SelectItem>
                            <SelectItem value="days">Días tras compra</SelectItem>
                            <SelectItem value="date">Fecha fija</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {editForm.releaseMode === "days" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Días tras la compra</Label>
                        <Input type="number" min="1" value={editForm.releaseDaysAfterPurchase} onChange={e => setEditForm(f => ({ ...f, releaseDaysAfterPurchase: e.target.value }))} className="bg-background" />
                      </div>
                    )}
                    {editForm.releaseMode === "date" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Fecha de liberación</Label>
                        <Input type="datetime-local" value={editForm.releaseDate} onChange={e => setEditForm(f => ({ ...f, releaseDate: e.target.value }))} className="bg-background" />
                      </div>
                    )}
                    <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="bg-background" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => {
                        updateMod.mutate({
                          id: mod.id,
                          title: editForm.title,
                          description: editForm.description,
                          releaseMode: editForm.releaseMode,
                          releaseDaysAfterPurchase: editForm.releaseMode === "days" && editForm.releaseDaysAfterPurchase !== "" ? parseInt(editForm.releaseDaysAfterPurchase) : null,
                          releaseDate: editForm.releaseMode === "date" && editForm.releaseDate ? editForm.releaseDate : null,
                        });
                        setEditId(null);
                      }}>
                        <Check className="w-4 h-4 mr-1" /> Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{mod.title}</span>
                        <Badge variant={mod.isActive ? "default" : "secondary"} className={mod.isActive ? "bg-green-700" : ""}>{mod.isActive ? "Activo" : "Inactivo"}</Badge>
                        <span className="text-xs text-muted-foreground">Orden: {mod.order}</span>
                        {(mod.releaseMode === "immediate" || !mod.releaseMode) && (
                          <Badge variant="outline" className="text-xs border-green-600 text-green-400"><Zap className="w-3 h-3 mr-1" />Inmediato</Badge>
                        )}
                        {mod.releaseMode === "days" && (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-400"><Clock className="w-3 h-3 mr-1" />Día {mod.releaseDaysAfterPurchase} tras compra</Badge>
                        )}
                        {mod.releaseMode === "date" && (
                          <Badge variant="outline" className="text-xs border-blue-500 text-blue-400"><Calendar className="w-3 h-3 mr-1" />{mod.releaseDate ? new Date(mod.releaseDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Fecha fija"}</Badge>
                        )}
                      </div>
                      {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditId(mod.id); setEditForm({ title: mod.title, description: mod.description ?? "", releaseMode: (mod.releaseMode ?? "immediate") as any, releaseDaysAfterPurchase: mod.releaseDaysAfterPurchase != null ? String(mod.releaseDaysAfterPurchase) : "", releaseDate: mod.releaseDate ? new Date(mod.releaseDate).toISOString().slice(0, 16) : "" }); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateMod.mutate({ id: mod.id, isActive: !mod.isActive })}>
                        {mod.isActive ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm("¿Eliminar este módulo y todas sus clases?")) deleteMod.mutate(mod.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {mods?.length === 0 && <p className="text-center text-muted-foreground py-8">No hay módulos creados aún</p>}
        </div>
      )}
    </div>
  );
}

// ─── AULAS ───────────────────────────────────────────────────────────────────
function LessonsPanel() {
  const utils = trpc.useUtils();
  const { data: mods } = trpc.admin.listModules.useQuery();
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const { data: lessonsList, isLoading } = trpc.admin.listLessons.useQuery(
    { moduleId: selectedModule && selectedModule !== "all" ? parseInt(selectedModule) : undefined },
    { enabled: true }
  );
  const createLesson = trpc.admin.createLesson.useMutation({ onSuccess: () => { utils.admin.listLessons.invalidate(); toast.success("Clase creada"); } });
  const updateLesson = trpc.admin.updateLesson.useMutation({ onSuccess: () => { utils.admin.listLessons.invalidate(); toast.success("Clase actualizada"); } });
  const deleteLesson = trpc.admin.deleteLesson.useMutation({ onSuccess: () => { utils.admin.listLessons.invalidate(); toast.success("Clase eliminada"); } });

  const [form, setForm] = useState({
    moduleId: "",
    title: "",
    description: "",
    videoUrl: "",
    order: 0,
    isReleased: true,
    releaseDaysAfterPurchase: "",
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleVideoUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 50));
      };
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const ext = file.name.split(".").pop() ?? "mp4";
        const key = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        setUploadProgress(60);
        try {
          const result = await utils.client.admin.uploadVideo.mutate({
            key,
            base64Data: base64,
            contentType: file.type || "video/mp4",
          });
          setForm(f => ({ ...f, videoUrl: result.url }));
          setUploadProgress(100);
          toast.success("Video subido correctamente");
        } catch (e) {
          toast.error("Error al subir el video");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error al leer el archivo");
      setIsUploading(false);
    }
  };

  const handleCreate = () => {
    if (!form.moduleId) return toast.error("Selecciona un módulo");
    if (!form.title.trim()) return toast.error("El título es obligatorio");
    if (!form.videoUrl.trim()) return toast.error("La URL del video es obligatoria");
    createLesson.mutate({
      moduleId: parseInt(form.moduleId),
      title: form.title,
      description: form.description || undefined,
      videoUrl: form.videoUrl,
      order: form.order,
      isReleased: form.isReleased,
      releaseDaysAfterPurchase: form.releaseDaysAfterPurchase ? parseInt(form.releaseDaysAfterPurchase) : undefined,
    });
    setForm({ moduleId: form.moduleId, title: "", description: "", videoUrl: "", order: 0, isReleased: true, releaseDaysAfterPurchase: "" });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg">Crear Nueva Clase (Sala)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Módulo *</Label>
              <Select value={form.moduleId} onValueChange={v => setForm(f => ({ ...f, moduleId: v }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccionar módulo" /></SelectTrigger>
                <SelectContent>
                  {mods?.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título de la Clase *</Label>
              <Input placeholder="Ej: Clase 1 - Posición Básica" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-background" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea placeholder="Descripción de la clase..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background" />
          </div>

          {/* Upload de vídeo */}
          <div className="space-y-2">
            <Label>Video de la Clase *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Arrastra un video o haz clic para seleccionar</p>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                id="video-upload"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }}
              />
              <Button variant="outline" onClick={() => document.getElementById("video-upload")?.click()} disabled={isUploading}>
                {isUploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Subiendo... {uploadProgress}%</> : <><Upload className="w-4 h-4 mr-2" />Seleccionar Video</>}
              </Button>
              {form.videoUrl && <p className="text-xs text-green-400 break-all">✓ Video listo: {form.videoUrl.slice(0, 60)}...</p>}
            </div>
            <div className="space-y-2">
              <Label>O ingresa URL del video directamente</Label>
              <Input placeholder="https://..." value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} className="bg-background" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Días tras la compra (Drip)</Label>
              <Input type="number" placeholder="0 = inmediato" value={form.releaseDaysAfterPurchase} onChange={e => setForm(f => ({ ...f, releaseDaysAfterPurchase: e.target.value }))} className="bg-background" />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={form.isReleased} onCheckedChange={v => setForm(f => ({ ...f, isReleased: v }))} />
                <Label>{form.isReleased ? "Liberada" : "Bloqueada"}</Label>
              </div>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={createLesson.isPending || isUploading} className="bg-red-600 hover:bg-red-700">
            {createLesson.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Crear Clase
          </Button>
        </CardContent>
      </Card>

      {/* Filtro por módulo */}
      <div className="flex items-center gap-3">
        <Label>Filtrar por módulo:</Label>
        <Select value={selectedModule} onValueChange={setSelectedModule}>
          <SelectTrigger className="w-64 bg-background"><SelectValue placeholder="Todos los módulos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {mods?.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
        <div className="space-y-3">
          {lessonsList?.map(lesson => (
            <Card key={lesson.id} className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{lesson.title}</span>
                      <Badge variant={lesson.isReleased ? "default" : "secondary"} className={lesson.isReleased ? "bg-green-700" : "bg-yellow-700"}>
                        {lesson.isReleased ? "Liberada" : "Bloqueada"}
                      </Badge>
                      {lesson.releaseDaysAfterPurchase != null && (
                        <Badge variant="outline" className="text-xs">Drip: día {lesson.releaseDaysAfterPurchase}</Badge>
                      )}
                    </div>
                    {lesson.description && <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1 truncate">Video: {lesson.videoUrl}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => updateLesson.mutate({ id: lesson.id, isReleased: !lesson.isReleased })}>
                      {lesson.isReleased ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { if (confirm("¿Eliminar esta clase?")) deleteLesson.mutate(lesson.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {lessonsList?.length === 0 && <p className="text-center text-muted-foreground py-8">No hay clases creadas aún</p>}
        </div>
      )}
    </div>
  );
}

// ─── MEMBROS ─────────────────────────────────────────────────────────────────
function MembersPanel() {
  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.admin.listMembers.useQuery();
  const grantAccess = trpc.admin.grantAccess.useMutation({ onSuccess: () => { utils.admin.listMembers.invalidate(); toast.success("Acceso concedido"); } });
  const revokeAccess = trpc.admin.revokeAccess.useMutation({ onSuccess: () => { utils.admin.listMembers.invalidate(); toast.success("Acceso revocado"); } });
  const updateRole = trpc.admin.updateMemberRole.useMutation({ onSuccess: () => { utils.admin.listMembers.invalidate(); toast.success("Rol actualizado"); } });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {members?.map(member => (
        <Card key={member.id} className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{member.name || "Sin nombre"}</span>
                  <Badge variant={member.role === "admin" ? "default" : "secondary"} className={member.role === "admin" ? "bg-red-700" : ""}>
                    {member.role === "admin" ? "Admin" : "Miembro"}
                  </Badge>
                  {member.subscription && (
                    <Badge variant={member.subscription.status === "active" ? "default" : "secondary"} className={member.subscription.status === "active" ? "bg-green-700" : "bg-gray-700"}>
                      {member.subscription.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  )}
                  {!member.subscription && <Badge variant="secondary" className="bg-gray-700">Sin suscripción</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <p className="text-xs text-muted-foreground">Registrado: {new Date(member.createdAt).toLocaleDateString("es-ES")}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(!member.subscription || member.subscription.status !== "active") && (
                  <Button size="sm" className="bg-green-700 hover:bg-green-800" onClick={() => grantAccess.mutate({ userId: member.id })}>
                    <Shield className="w-4 h-4 mr-1" /> Dar Acceso
                  </Button>
                )}
                {member.subscription?.status === "active" && (
                  <Button size="sm" variant="destructive" onClick={() => revokeAccess.mutate({ userId: member.id })}>
                    <ShieldOff className="w-4 h-4 mr-1" /> Revocar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {members?.length === 0 && <p className="text-center text-muted-foreground py-8">No hay miembros registrados</p>}
    </div>
  );
}

// ─── CHAT ADMIN ──────────────────────────────────────────────────────────────
function ChatAdminPanel() {
  const utils = trpc.useUtils();
  const { data: chats, isLoading } = trpc.admin.listChats.useQuery();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { data: history } = trpc.admin.getChatHistory.useQuery(selectedUserId!, { enabled: selectedUserId !== null });
  const sendMsg = trpc.admin.sendAdminMessage.useMutation({
    onSuccess: () => {
      utils.admin.getChatHistory.invalidate(selectedUserId!);
      utils.admin.listChats.invalidate();
      setMessage("");
    }
  });
  const markRead = trpc.admin.markChatRead.useMutation({ onSuccess: () => utils.admin.listChats.invalidate() });
  const [message, setMessage] = useState("");

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    markRead.mutate(userId);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      {/* Lista de conversaciones */}
      <Card className="bg-card border-border overflow-y-auto">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Conversaciones</CardTitle></CardHeader>
        <CardContent className="p-2 space-y-1">
          {chats?.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Sin mensajes aún</p>}
          {chats?.map(chat => (
            <button
              key={chat.userId}
              onClick={() => handleSelectUser(chat.userId)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${selectedUserId === chat.userId ? "bg-red-900/40 border border-red-700" : "hover:bg-accent/50"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate">{chat.user?.name || "Usuario"}</span>
                {chat.unreadCount > 0 && <Badge className="bg-red-600 text-white text-xs">{chat.unreadCount}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{chat.lastMessage.message}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Área de chat */}
      <div className="md:col-span-2 flex flex-col">
        {selectedUserId ? (
          <Card className="bg-card border-border flex flex-col h-full">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-sm">
                Chat con: {chats?.find(c => c.userId === selectedUserId)?.user?.name || "Usuario"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {history?.map(msg => (
                <div key={msg.id} className={`flex ${msg.isFromAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.isFromAdmin ? "bg-red-700 text-white" : "bg-secondary text-foreground"}`}>
                    <p>{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">{new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
              {history?.length === 0 && <p className="text-center text-muted-foreground text-sm">Sin mensajes en esta conversación</p>}
            </CardContent>
            <div className="p-4 border-t border-border flex gap-2">
              <Input
                placeholder="Escribe tu respuesta..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (message.trim()) sendMsg.mutate({ userId: selectedUserId, message }); } }}
                className="bg-background"
              />
              <Button onClick={() => { if (message.trim()) sendMsg.mutate({ userId: selectedUserId, message }); }} disabled={sendMsg.isPending || !message.trim()} className="bg-red-600 hover:bg-red-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="bg-card border-border flex items-center justify-center h-full">
            <p className="text-muted-foreground">Selecciona una conversación</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── CRONOGRAMA ADMIN ───────────────────────────────────────────────────────────────
function ScheduleAdminPanel() {
  const { data: schedule, isLoading } = trpc.admin.getSchedule.useQuery();

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const now = new Date();

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Cronograma de Liberación de Módulos
          </CardTitle>
          <p className="text-sm text-muted-foreground">Vista general de cuándo se libera cada módulo para los alumnos</p>
        </CardHeader>
        <CardContent>
          {!schedule || schedule.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay módulos creados aún</p>
          ) : (
            <div className="space-y-3">
              {schedule.map((mod: any) => {
                const isImmediate = mod.releaseMode === "immediate" || !mod.releaseMode;
                const isDays = mod.releaseMode === "days";
                const isDate = mod.releaseMode === "date";
                const releaseDate = isDate && mod.releaseDate ? new Date(mod.releaseDate) : null;
                const isReleased = isDate && releaseDate ? now >= releaseDate : true;

                return (
                  <div key={mod.id} className="flex items-start justify-between p-4 rounded-lg border border-border bg-background/50 gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isImmediate ? "bg-green-900/50" : isDays ? "bg-orange-900/50" : isReleased ? "bg-green-900/50" : "bg-blue-900/50"
                      }`}>
                        {isImmediate && <Zap className="w-5 h-5 text-green-400" />}
                        {isDays && <Clock className="w-5 h-5 text-orange-400" />}
                        {isDate && (isReleased ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Calendar className="w-5 h-5 text-blue-400" />)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{mod.title}</span>
                          <span className="text-xs text-muted-foreground">Orden: {mod.order}</span>
                          <span className="text-xs text-muted-foreground">{mod.lessons?.length ?? 0} clases</span>
                        </div>
                        {mod.description && <p className="text-sm text-muted-foreground mt-0.5">{mod.description}</p>}
                        <div className="mt-2">
                          {isImmediate && (
                            <span className="text-xs text-green-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Disponible inmediatamente al comprar</span>
                          )}
                          {isDays && (
                            <span className="text-xs text-orange-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Se libera {mod.releaseDaysAfterPurchase} días después de la compra</span>
                          )}
                          {isDate && releaseDate && (
                            <span className={`text-xs flex items-center gap-1 ${isReleased ? "text-green-400" : "text-blue-400"}`}>
                              <Calendar className="w-3 h-3" />
                              {isReleased ? "Liberado el " : "Se libera el "}
                              {releaseDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isImmediate && <Badge className="bg-green-900/50 text-green-300 border-green-700">Inmediato</Badge>}
                      {isDays && <Badge className="bg-orange-900/50 text-orange-300 border-orange-700">Día {mod.releaseDaysAfterPurchase}</Badge>}
                      {isDate && <Badge className={isReleased ? "bg-green-900/50 text-green-300 border-green-700" : "bg-blue-900/50 text-blue-300 border-blue-700"}>{isReleased ? "Liberado" : "Programado"}</Badge>}
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

// ─── PÁGINA PRINCIPAL ───────────────────────────────────────────────────────────────────
export default function AdminDashboard() { const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">No tienes permisos para acceder al panel de administración.</p>
            <Button onClick={() => navigate("/")} className="w-full">Volver al Inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">PM</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Panel Administrativo</h1>
              <p className="text-xs text-muted-foreground">POSICIONES MATADORAS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden md:block">Hola, {user.name}</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/members")}>Área de Miembros</Button>
            <Button variant="outline" size="sm" onClick={() => logout()}>Cerrar Sesión</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <StatsPanel />

        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList className="bg-card border border-border grid grid-cols-8 w-full md:w-auto">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /><span className="hidden sm:inline">Módulos</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <Video className="w-4 h-4" /><span className="hidden sm:inline">Clases</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" /><span className="hidden sm:inline">Miembros</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /><span className="hidden sm:inline">Cronograma</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /><span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger value="landing" className="flex items-center gap-2">
              <Palette className="w-4 h-4" /><span className="hidden sm:inline">Landing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules"><ModulesPanel /></TabsContent>
          <TabsContent value="lessons"><LessonsPanel /></TabsContent>
          <TabsContent value="members"><MembersPanel /></TabsContent>
          <TabsContent value="chat"><ChatAdminPanel /></TabsContent>
          <TabsContent value="schedule"><ScheduleAdminPanel /></TabsContent>
          <TabsContent value="notifications"><NotificationsAdminPanel /></TabsContent>
          <TabsContent value="stats"><ProgressStatsPanel /></TabsContent>
          <TabsContent value="landing"><LandingEditorPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
