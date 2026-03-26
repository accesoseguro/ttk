import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, BookOpen, Award, TrendingUp, Trophy, Clock, CheckCircle2, Loader2,
} from "lucide-react";

const COLORS = ["#7f1d1d", "#991b1b", "#b91c1c", "#dc2626", "#ef4444", "#f87171"];
const PIE_COLORS = ["#374151", "#6b7280", "#f59e0b", "#10b981", "#3b82f6", "#dc2626"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function timeAgo(date: Date | string | null) {
  if (!date) return "Nunca";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`;
  return `Hace ${Math.floor(days / 30)} mes.`;
}

export default function ProgressStatsPanel() {
  const { data: stats, isLoading: loadingStats } = trpc.admin.getProgressStats.useQuery();
  const { data: students, isLoading: loadingStudents } = trpc.admin.getStudentProgress.useQuery();

  if (loadingStats || loadingStudents) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Cargando estadísticas...</span>
      </div>
    );
  }

  if (!stats || !students) return null;

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Estudiantes</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.kpis.totalStudents}</p>
            <p className="text-xs text-muted-foreground mt-1">registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Progreso Medio</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.kpis.avgProgress}%</p>
            <p className="text-xs text-muted-foreground mt-1">promedio general</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Clases Completadas</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.kpis.totalLessonsCompleted}</p>
            <p className="text-xs text-muted-foreground mt-1">en total</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Certificados</span>
              <Award className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.kpis.totalCertificates}</p>
            <p className="text-xs text-muted-foreground mt-1">emitidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Progresso por módulo */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Progreso Promedio por Módulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.moduleStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay módulos con datos de progreso aún.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.moduleStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="title"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
                  />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                    labelStyle={{ color: "#f9fafb", fontWeight: 600 }}
                    itemStyle={{ color: "#dc2626" }}
                    formatter={(v: number) => [`${v}%`, "Progreso medio"]}
                  />
                  <Bar dataKey="avgCompletion" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Aulas concluídas por dia */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Clases Completadas (últimos 30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.dailyCompletions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay actividad en los últimos 30 días.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.dailyCompletions} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    tickFormatter={formatDate}
                  />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                    labelStyle={{ color: "#f9fafb", fontWeight: 600 }}
                    itemStyle={{ color: "#10b981" }}
                    labelFormatter={(v: string) => formatDate(v)}
                    formatter={(v: number) => [v, "Clases completadas"]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de progresso */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Distribución de Estudiantes por Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.kpis.totalStudents === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay estudiantes registrados aún.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.progressDistribution}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ range, count }: { range: string; count: number }) => count > 0 ? `${range}: ${count}` : ""}
                    labelLine={false}
                  >
                    {stats.progressDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                    itemStyle={{ color: "#f9fafb" }}
                    formatter={(v: number, name: string) => [v, name]}
                  />
                  <Legend
                    formatter={(value: string) => <span style={{ color: "#9ca3af", fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Progresso por módulo - detalhado */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-yellow-500" />
              Detalle de Completación por Módulo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.moduleStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay módulos creados aún.
              </div>
            ) : (
              stats.moduleStats.map(mod => (
                <div key={mod.moduleId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium truncate max-w-[60%]">{mod.title}</span>
                    <span className="text-muted-foreground">
                      {mod.completedStudents}/{mod.totalStudents} alumnos · {mod.avgCompletion}%
                    </span>
                  </div>
                  <Progress value={mod.avgCompletion} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking de alunos */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Ranking de Estudiantes por Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay estudiantes registrados aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">#</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Estudiante</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Email</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Progreso</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Clases</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Certs.</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Última actividad</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.userId} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3">
                        {i === 0 ? <span className="text-yellow-500 font-bold">🥇</span>
                          : i === 1 ? <span className="text-gray-400 font-bold">🥈</span>
                          : i === 2 ? <span className="text-amber-700 font-bold">🥉</span>
                          : <span className="text-muted-foreground">{i + 1}</span>}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                            {(s.name[0] ?? "?").toUpperCase()}
                          </div>
                          <span className="text-foreground font-medium truncate max-w-[100px]">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs hidden md:table-cell truncate max-w-[140px]">
                        {s.email}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Progress value={s.progressPct} className="h-1.5 w-16" />
                          <span className="text-xs text-foreground font-medium">{s.progressPct}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs hidden sm:table-cell">
                        {s.completedLessons}/{s.totalLessons}
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell">
                        {s.certificates > 0 ? (
                          <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-800/50 text-xs">
                            <Award className="w-3 h-3 mr-1" />{s.certificates}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(s.lastActivityAt)}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <Badge
                          className={
                            s.subscriptionStatus === "active"
                              ? "bg-green-900/30 text-green-400 border-green-800/50 text-xs"
                              : "bg-gray-800/50 text-gray-400 border-gray-700/50 text-xs"
                          }
                        >
                          {s.subscriptionStatus === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
