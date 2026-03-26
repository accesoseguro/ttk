import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Shield, Star, Play, Users, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "register" | "admin";

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  // Verificar se já está logado
  const { data: currentUser, isLoading: checkingAuth } = trpc.localAuth.me.useQuery();

  useEffect(() => {
    if (!checkingAuth && currentUser) {
      const dest = (currentUser as any).role === "admin" ? "/admin" : "/members";
      navigate(dest);
    }
  }, [currentUser, checkingAuth, navigate]);

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success("¡Bienvenido de vuelta!");
      const dest = data.user.role === "admin" ? "/admin" : "/members";
      window.location.href = dest;
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const adminLoginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.user.role !== "admin") {
        setError("Acceso denegado. Esta área es solo para administradores.");
        // Fazer logout imediato
        return;
      }
      toast.success("¡Bienvenido, Administrador!");
      window.location.href = "/admin";
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: () => {
      toast.success("¡Cuenta creada con éxito!");
      window.location.href = "/members";
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (form.password !== form.confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }
      if (form.name.trim().length < 2) {
        setError("El nombre debe tener al menos 2 caracteres");
        return;
      }
      registerMutation.mutate({ name: form.name, email: form.email, password: form.password });
    } else if (mode === "admin") {
      adminLoginMutation.mutate({ email: form.email, password: form.password });
    } else {
      loginMutation.mutate({ email: form.email, password: form.password });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending || adminLoginMutation.isPending;

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const isAdminMode = mode === "admin";

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Painel esquerdo — visual */}
      <div
        className={`hidden md:flex md:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 transition-all duration-500 ${
          isAdminMode
            ? "bg-gradient-to-br from-gray-950 via-gray-900 to-black"
            : "bg-gradient-to-br from-red-950 via-red-900 to-black"
        }`}
      >
        <div className="absolute inset-0 opacity-10">
          <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 ${isAdminMode ? "bg-gray-500" : "bg-red-500"}`} />
          <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 ${isAdminMode ? "bg-gray-700" : "bg-red-700"}`} />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-md">
          <div className="flex justify-center">
            <div className={`w-20 h-20 backdrop-blur-sm rounded-2xl flex items-center justify-center border ${isAdminMode ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20"}`}>
              {isAdminMode ? (
                <Lock className="w-10 h-10 text-gray-300" />
              ) : (
                <span className="text-white font-black text-3xl">PM</span>
              )}
            </div>
          </div>

          {isAdminMode ? (
            <div>
              <h1 className="text-4xl font-black text-white leading-tight mb-3">
                PANEL DE<br />
                <span className="text-gray-400">ADMINISTRACIÓN</span>
              </h1>
              <p className="text-gray-400 text-lg">Acceso exclusivo para administradores de la plataforma</p>
              <div className="mt-8 space-y-3 text-left">
                {[
                  "Gestión de módulos y clases",
                  "Control de miembros y accesos",
                  "Estadísticas y reportes",
                  "Configuración de la plataforma",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0" />
                    <span className="text-gray-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-4xl font-black text-white leading-tight mb-3">
                  POSICIONES<br />
                  <span className="text-red-400">MATADORAS</span>
                </h1>
                <p className="text-gray-300 text-lg">La guía definitiva para transformar tu vida íntima</p>
              </div>

              <div className="space-y-4 text-left">
                {[
                  { icon: Play, text: "Más de 30 videos exclusivos en HD" },
                  { icon: Shield, text: "Acceso seguro y privado 100%" },
                  { icon: Star, text: "Contenido premium actualizado" },
                  { icon: Users, text: "Soporte directo con el equipo" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-200 text-sm">{text}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                <p className="text-gray-300 text-sm italic">
                  "Cambió completamente nuestra relación. El contenido es increíble y muy práctico."
                </p>
                <p className="text-red-400 text-xs mt-2 font-semibold">— María G., miembro desde 2024</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-black">
        {/* Logo mobile */}
        <div className="md:hidden mb-8 text-center">
          <div className={`inline-flex w-16 h-16 rounded-xl items-center justify-center mb-3 ${isAdminMode ? "bg-gray-800" : "bg-gradient-to-br from-red-600 to-red-900"}`}>
            {isAdminMode ? <Lock className="w-8 h-8 text-gray-300" /> : <span className="text-white font-black text-2xl">PM</span>}
          </div>
          <h1 className="text-2xl font-black text-white">
            {isAdminMode ? "PANEL ADMIN" : "POSICIONES MATADORAS"}
          </h1>
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Cabeçalho */}
          <div>
            <h2 className="text-3xl font-bold text-white">
              {mode === "login" ? "Iniciar Sesión" : mode === "register" ? "Crear Cuenta" : "Acceso Administrador"}
            </h2>
            <p className="text-gray-400 mt-1">
              {mode === "login"
                ? "Accede a tu área de miembros exclusiva"
                : mode === "register"
                ? "Regístrate para acceder al contenido"
                : "Área restringida — solo para administradores"}
            </p>
          </div>

          {/* Tabs: 3 abas */}
          <div className="flex bg-gray-900 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMode("login"); setError(""); setForm({ name: "", email: "", password: "", confirmPassword: "" }); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "login" ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); setForm({ name: "", email: "", password: "", confirmPassword: "" }); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "register" ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Registrarse
            </button>
            <button
              onClick={() => { setMode("admin"); setError(""); setForm({ name: "", email: "", password: "", confirmPassword: "" }); }}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                mode === "admin"
                  ? "bg-gray-600 text-white shadow"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Lock className="w-3 h-3" />
              Admin
            </button>
          </div>

          {/* Banner de aviso modo admin */}
          {isAdminMode && (
            <div className="flex items-start gap-3 bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">
                <span className="text-gray-200 font-semibold">Área restringida.</span>{" "}
                Solo los administradores autorizados pueden acceder a este panel.
              </p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <Label htmlFor="name" className="text-gray-300 text-sm">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 h-12 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={isAdminMode ? "Email del administrador" : "tu@email.com"}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className={`bg-gray-900 border-gray-700 text-white placeholder-gray-500 h-12 rounded-xl ${
                  isAdminMode ? "focus:border-gray-500" : "focus:border-red-600"
                }`}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-300 text-sm">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : isAdminMode ? "Contraseña de administrador" : "Tu contraseña"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className={`bg-gray-900 border-gray-700 text-white placeholder-gray-500 h-12 rounded-xl pr-10 ${
                    isAdminMode ? "focus:border-gray-500" : "focus:border-red-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 h-12 rounded-xl"
                />
              </div>
            )}

            {/* Mensagem de erro */}
            {error && (
              <div className="flex items-center gap-2 bg-red-950/50 border border-red-800 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className={`w-full h-12 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                isAdminMode
                  ? "bg-gray-700 hover:bg-gray-600 shadow-gray-900/50"
                  : "bg-red-600 hover:bg-red-700 shadow-red-900/50"
              }`}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : mode === "login" ? (
                "Iniciar Sesión"
              ) : mode === "register" ? (
                "Crear Cuenta"
              ) : (
                <><Lock className="w-4 h-4 mr-2" /> Acceder al Panel Admin</>
              )}
            </Button>
          </form>

          {/* Segurança */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 flex items-start gap-2">
            <Shield className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              <span className="text-gray-300 font-medium">Acceso 100% seguro.</span>{" "}
              {isAdminMode
                ? "El acceso al panel está protegido y registrado."
                : "Tu contraseña se almacena encriptada. Nunca compartimos tus datos."}
            </p>
          </div>

          {!isAdminMode && (
            <p className="text-center text-xs text-gray-600">
              Al continuar, aceptas nuestros{" "}
              <a href="#" className="text-red-500 hover:underline">Términos de Servicio</a>{" "}
              y{" "}
              <a href="#" className="text-red-500 hover:underline">Política de Privacidad</a>
            </p>
          )}

          <div className="text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
