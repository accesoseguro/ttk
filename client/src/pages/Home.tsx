import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, CheckCircle2, MessageCircle, LayoutDashboard, Instagram, ExternalLink, Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  ctaText: string;
}

interface SocialLinks {
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
}

// Defaults usados quando não há config salva no banco
const DEFAULTS = {
  heroTitle: "Domina las Posiciones Matadoras",
  heroSubtitle: "Una guía completa en video sobre técnicas íntimas para parejas que desean mejorar su vida sexual.",
  heroCtaText: "Acceder Ahora",
  heroBgImageUrl: "",
  aboutTitle: "¿Por qué Posiciones Matadoras?",
  aboutDescription: "Nuestro programa exclusivo te guía paso a paso con contenido en video de alta calidad, diseñado para parejas que desean llevar su vida íntima al siguiente nivel.",
  aboutImageUrl: "",
  featuresTitle: "Todo lo que necesitas",
  featuresSubtitle: "Accede a contenido premium diseñado para transformar tu vida íntima",
  plansTitle: "Acceso Completo",
  plansSubtitle: "Pago único. Acceso de por vida. Sin mensualidades.",
  plans: [
    { name: "Acceso Completo", price: "97", period: "pago único", features: ["Acceso vitalicio a todos los módulos", "Videos en HD sin restricciones", "Chat de soporte directo", "Certificados de finalización", "Actualizaciones incluidas"], highlighted: true, ctaText: "Obtener Acceso Ahora" },
  ] as Plan[],
  footerText: "© 2026 POSICIONES MATADORAS. Todos los derechos reservados.",
  socialLinks: {} as SocialLinks,
};

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: config } = trpc.landingConfig.get.useQuery();

  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => {
      toast.error("Error al iniciar el pago: " + err.message);
    },
  });

  const handleBuyClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toast.info("Redirigiendo al checkout seguro...");
    createCheckout.mutate({ origin: window.location.origin });
  };

  const c = {
    heroTitle: config?.heroTitle || DEFAULTS.heroTitle,
    heroSubtitle: config?.heroSubtitle || DEFAULTS.heroSubtitle,
    heroCtaText: config?.heroCtaText || DEFAULTS.heroCtaText,
    heroBgImageUrl: config?.heroBgImageUrl || DEFAULTS.heroBgImageUrl,
    aboutTitle: config?.aboutTitle || DEFAULTS.aboutTitle,
    aboutDescription: config?.aboutDescription || DEFAULTS.aboutDescription,
    aboutImageUrl: config?.aboutImageUrl || DEFAULTS.aboutImageUrl,
    featuresTitle: config?.featuresTitle || DEFAULTS.featuresTitle,
    featuresSubtitle: config?.featuresSubtitle || DEFAULTS.featuresSubtitle,
    plansTitle: config?.plansTitle || DEFAULTS.plansTitle,
    plansSubtitle: config?.plansSubtitle || DEFAULTS.plansSubtitle,
    plans: (config?.plans as Plan[] | null) || DEFAULTS.plans,
    footerText: config?.footerText || DEFAULTS.footerText,
    socialLinks: (config?.socialLinks as SocialLinks | null) || DEFAULTS.socialLinks,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-950/20">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">POSICIONES MATADORAS</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden md:block">Hola, {user?.name}</span>
                {user?.role === "admin" && (
                  <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                    <LayoutDashboard className="w-4 h-4 mr-1" /> Admin
                  </Button>
                )}
                <Button onClick={() => navigate("/members")} className="bg-red-600 hover:bg-red-700">
                  Mi Área de Miembros
                </Button>
                <Button variant="outline" size="sm" onClick={() => logout()}>Salir</Button>
              </>
            ) : (
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => navigate("/login")}>
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative container mx-auto px-4 py-24 text-center overflow-hidden"
        style={c.heroBgImageUrl ? {
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(${c.heroBgImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}}
      >
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-block px-4 py-1 bg-red-900/30 border border-red-800/50 rounded-full text-red-400 text-sm font-medium mb-2">
            Programa Exclusivo
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            {c.heroTitle.includes("Posiciones") ? (
              <>
                {c.heroTitle.split("Posiciones")[0]}
                <span className="text-red-600">Posiciones{c.heroTitle.split("Posiciones")[1]}</span>
              </>
            ) : (
              <span>{c.heroTitle}</span>
            )}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {c.heroSubtitle}
          </p>
          <div className="flex gap-4 justify-center pt-6">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8" onClick={handleBuyClick} disabled={createCheckout.isPending}>
              {createCheckout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
              {c.heroCtaText}
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })}>
              Ver Planes
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      {(c.aboutDescription || c.aboutImageUrl) && (
        <section className="container mx-auto px-4 py-16">
          <div className={`grid ${c.aboutImageUrl ? "md:grid-cols-2" : "md:grid-cols-1 max-w-2xl mx-auto"} gap-12 items-center`}>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-foreground">{c.aboutTitle}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">{c.aboutDescription}</p>
            </div>
            {c.aboutImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-2xl">
                <img src={c.aboutImageUrl} alt="Sobre el producto" className="w-full h-64 md:h-80 object-cover" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h3 className="text-3xl font-bold text-foreground">{c.featuresTitle}</h3>
          {c.featuresSubtitle && <p className="text-muted-foreground mt-2">{c.featuresSubtitle}</p>}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-border bg-card/50 backdrop-blur hover:border-red-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-red-600" />
                Contenido en Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Módulos completos organizados progresivamente para tu aprendizaje.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur hover:border-red-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-red-600" />
                Acceso de por Vida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Una vez que compres, tienes acceso ilimitado a todo el contenido.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur hover:border-red-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-red-600" />
                Soporte 24/7
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Chat directo con nuestro equipo para resolver tus dudas.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans-section" className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h3 className="text-3xl font-bold text-foreground">{c.plansTitle}</h3>
          {c.plansSubtitle && <p className="text-muted-foreground mt-2">{c.plansSubtitle}</p>}
        </div>
        <div className={`grid ${c.plans.length === 1 ? "max-w-sm mx-auto" : c.plans.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"} gap-6`}>
          {c.plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`relative border-2 transition-all ${plan.highlighted
                ? "border-red-600 shadow-lg shadow-red-900/20 scale-105"
                : "border-border hover:border-red-800/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MÁS POPULAR
                </div>
              )}
              <CardContent className="pt-8 pb-6 space-y-5">
                <div className="text-center">
                  <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                  <div className="mt-3">
                    <span className="text-4xl font-extrabold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground ml-1">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.highlighted ? "bg-red-600 hover:bg-red-700" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={handleBuyClick}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {plan.ctaText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-red-900 to-black border-red-800">
          <CardContent className="pt-12 text-center space-y-6">
            <h3 className="text-3xl font-bold text-white">¿Listo para Comenzar?</h3>
            <p className="text-gray-200 max-w-2xl mx-auto">
              Obtén acceso completo a todos nuestros módulos educativos y transforma tu vida íntima.
            </p>
            <Button size="lg" className="bg-white text-red-900 hover:bg-gray-100" onClick={handleBuyClick} disabled={createCheckout.isPending}>
              {createCheckout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-red-900" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
              Comprar Acceso Ahora
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">{c.footerText}</p>
            <div className="flex items-center gap-4">
              {c.socialLinks.instagram && (
                <a href={c.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-red-500 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {c.socialLinks.whatsapp && (
                <a href={c.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green-500 transition-colors text-sm flex items-center gap-1">
                  <ExternalLink className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {c.socialLinks.telegram && (
                <a href={c.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-400 transition-colors text-sm flex items-center gap-1">
                  <ExternalLink className="w-4 h-4" /> Telegram
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
