import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Image, Globe, DollarSign, Layout, Star } from "lucide-react";

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

export default function LandingEditorPanel() {
  const { data: config, isLoading, refetch } = trpc.landingConfig.get.useQuery();
  const updateMutation = trpc.landingConfig.update.useMutation({
    onSuccess: () => {
      toast.success("¡Cambios guardados correctamente!");
      refetch();
    },
    onError: (e) => toast.error("Error al guardar: " + e.message),
  });
  const uploadImageMutation = trpc.landingConfig.uploadImage.useMutation({
    onError: (e) => toast.error("Error al subir imagen: " + e.message),
  });

  const heroFileRef = useRef<HTMLInputElement>(null);
  const aboutFileRef = useRef<HTMLInputElement>(null);

  // Hero state
  const [heroTitle, setHeroTitle] = useState<string>("");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("");
  const [heroCtaText, setHeroCtaText] = useState<string>("");
  const [heroBgImageUrl, setHeroBgImageUrl] = useState<string>("");

  // About state
  const [aboutTitle, setAboutTitle] = useState<string>("");
  const [aboutDescription, setAboutDescription] = useState<string>("");
  const [aboutImageUrl, setAboutImageUrl] = useState<string>("");

  // Features state
  const [featuresTitle, setFeaturesTitle] = useState<string>("");
  const [featuresSubtitle, setFeaturesSubtitle] = useState<string>("");

  // Plans state
  const [plansTitle, setPlansTitle] = useState<string>("");
  const [plansSubtitle, setPlansSubtitle] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>([]);

  // Footer & social
  const [footerText, setFooterText] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  const [initialized, setInitialized] = useState(false);

  // Initialize state from config when loaded
  if (config && !initialized) {
    setHeroTitle(config.heroTitle ?? "Domina las Posiciones Matadoras");
    setHeroSubtitle(config.heroSubtitle ?? "Una guía completa en video sobre técnicas íntimas para parejas que desean mejorar su vida sexual.");
    setHeroCtaText(config.heroCtaText ?? "Acceder Ahora");
    setHeroBgImageUrl(config.heroBgImageUrl ?? "");
    setAboutTitle(config.aboutTitle ?? "¿Por qué Posiciones Matadoras?");
    setAboutDescription(config.aboutDescription ?? "");
    setAboutImageUrl(config.aboutImageUrl ?? "");
    setFeaturesTitle(config.featuresTitle ?? "Todo lo que necesitas");
    setFeaturesSubtitle(config.featuresSubtitle ?? "");
    setPlansTitle(config.plansTitle ?? "Elige tu plan");
    setPlansSubtitle(config.plansSubtitle ?? "");
    setPlans((config.plans as Plan[]) ?? [
      { name: "Básico", price: "47", period: "mes", features: ["Acceso a módulos básicos", "Chat de soporte"], highlighted: false, ctaText: "Comenzar" },
      { name: "Premium", price: "97", period: "mes", features: ["Acceso completo", "Chat prioritario", "Certificados"], highlighted: true, ctaText: "Obtener Premium" },
    ]);
    setFooterText(config.footerText ?? "© 2025 Posiciones Matadoras. Todos los derechos reservados.");
    setSocialLinks((config.socialLinks as SocialLinks) ?? {});
    setInitialized(true);
  }

  if (!config && !initialized) {
    // Default plans for first time
    setPlans([
      { name: "Básico", price: "47", period: "mes", features: ["Acceso a módulos básicos", "Chat de soporte"], highlighted: false, ctaText: "Comenzar" },
      { name: "Premium", price: "97", period: "mes", features: ["Acceso completo", "Chat prioritario", "Certificados"], highlighted: true, ctaText: "Obtener Premium" },
    ]);
    setInitialized(true);
  }

  const handleSave = (section?: string) => {
    updateMutation.mutate({
      heroTitle, heroSubtitle, heroCtaText, heroBgImageUrl,
      aboutTitle, aboutDescription, aboutImageUrl,
      featuresTitle, featuresSubtitle,
      plansTitle, plansSubtitle, plans,
      footerText, socialLinks,
    });
  };

  const handleImageUpload = async (file: File, type: "hero" | "about") => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const result = await uploadImageMutation.mutateAsync({ base64, type });
      if (type === "hero") setHeroBgImageUrl(result.url);
      else setAboutImageUrl(result.url);
      toast.success("Imagen subida correctamente");
    };
    reader.readAsDataURL(file);
  };

  const addPlan = () => {
    setPlans(prev => [...prev, { name: "Nuevo Plan", price: "0", period: "mes", features: ["Característica 1"], highlighted: false, ctaText: "Obtener Acceso" }]);
  };

  const removePlan = (idx: number) => {
    setPlans(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePlan = (idx: number, field: keyof Plan, value: unknown) => {
    setPlans(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const updatePlanFeature = (planIdx: number, featIdx: number, value: string) => {
    setPlans(prev => prev.map((p, i) => {
      if (i !== planIdx) return p;
      const features = [...p.features];
      features[featIdx] = value;
      return { ...p, features };
    }));
  };

  const addFeature = (planIdx: number) => {
    setPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, features: [...p.features, "Nueva característica"] } : p));
  };

  const removeFeature = (planIdx: number, featIdx: number) => {
    setPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, features: p.features.filter((_, fi) => fi !== featIdx) } : p));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Editor de Landing Page</h2>
          <p className="text-sm text-muted-foreground">Personaliza el contenido de tu página de ventas</p>
        </div>
        <Button
          onClick={() => handleSave()}
          disabled={updateMutation.isPending}
          className="bg-red-600 hover:bg-red-700"
        >
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Guardar Todo
        </Button>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="hero" className="text-xs"><Layout className="w-3 h-3 mr-1" />Hero</TabsTrigger>
          <TabsTrigger value="about" className="text-xs"><Image className="w-3 h-3 mr-1" />Sobre</TabsTrigger>
          <TabsTrigger value="features" className="text-xs"><Star className="w-3 h-3 mr-1" />Beneficios</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs"><DollarSign className="w-3 h-3 mr-1" />Planes</TabsTrigger>
          <TabsTrigger value="footer" className="text-xs"><Globe className="w-3 h-3 mr-1" />Footer</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sección Hero (Cabecera Principal)</CardTitle>
              <CardDescription>El primer bloque que los visitantes ven al entrar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título Principal</Label>
                <Input
                  value={heroTitle}
                  onChange={e => setHeroTitle(e.target.value)}
                  placeholder="Domina las Posiciones Matadoras"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo / Descripción</Label>
                <Textarea
                  value={heroSubtitle}
                  onChange={e => setHeroSubtitle(e.target.value)}
                  placeholder="Una guía completa en video..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Texto del Botón CTA</Label>
                <Input
                  value={heroCtaText}
                  onChange={e => setHeroCtaText(e.target.value)}
                  placeholder="Acceder Ahora"
                />
              </div>
              <div className="space-y-2">
                <Label>Imagen de Fondo (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={heroBgImageUrl}
                    onChange={e => setHeroBgImageUrl(e.target.value)}
                    placeholder="https://... o sube una imagen"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => heroFileRef.current?.click()}
                    disabled={uploadImageMutation.isPending}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <input
                  ref={heroFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero")}
                />
                {heroBgImageUrl && (
                  <img src={heroBgImageUrl} alt="Hero preview" className="w-full h-32 object-cover rounded-lg mt-2 border border-border" />
                )}
              </div>
              <Button onClick={() => handleSave("hero")} disabled={updateMutation.isPending} className="w-full bg-red-600 hover:bg-red-700">
                Guardar Hero
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Section */}
        <TabsContent value="about" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sección Sobre el Producto</CardTitle>
              <CardDescription>Presenta los beneficios y propuesta de valor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título de la Sección</Label>
                <Input
                  value={aboutTitle}
                  onChange={e => setAboutTitle(e.target.value)}
                  placeholder="¿Por qué Posiciones Matadoras?"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={aboutDescription}
                  onChange={e => setAboutDescription(e.target.value)}
                  placeholder="Describe tu producto aquí..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Imagen del Producto (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={aboutImageUrl}
                    onChange={e => setAboutImageUrl(e.target.value)}
                    placeholder="https://... o sube una imagen"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => aboutFileRef.current?.click()}
                    disabled={uploadImageMutation.isPending}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <input
                  ref={aboutFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "about")}
                />
                {aboutImageUrl && (
                  <img src={aboutImageUrl} alt="About preview" className="w-full h-40 object-cover rounded-lg mt-2 border border-border" />
                )}
              </div>
              <Button onClick={() => handleSave("about")} disabled={updateMutation.isPending} className="w-full bg-red-600 hover:bg-red-700">
                Guardar Sección
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Section */}
        <TabsContent value="features" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sección de Beneficios / Características</CardTitle>
              <CardDescription>Los 3 puntos de venta principales mostrados en la landing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título de la Sección</Label>
                <Input
                  value={featuresTitle}
                  onChange={e => setFeaturesTitle(e.target.value)}
                  placeholder="Todo lo que necesitas"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input
                  value={featuresSubtitle}
                  onChange={e => setFeaturesSubtitle(e.target.value)}
                  placeholder="Descripción breve de los beneficios"
                />
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                Los 3 bloques de beneficios (Contenido en Video, Acceso de por Vida, Soporte 24/7) son editables directamente en el código. Para personalizarlos, entre en contacto.
              </div>
              <Button onClick={() => handleSave("features")} disabled={updateMutation.isPending} className="w-full bg-red-600 hover:bg-red-700">
                Guardar Sección
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Section */}
        <TabsContent value="plans" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planes de Precios</CardTitle>
              <CardDescription>Configura los planes que aparecen en la landing page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Título de la Sección</Label>
                  <Input value={plansTitle} onChange={e => setPlansTitle(e.target.value)} placeholder="Elige tu plan" />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input value={plansSubtitle} onChange={e => setPlansSubtitle(e.target.value)} placeholder="Sin compromisos" />
                </div>
              </div>

              <div className="space-y-4">
                {plans.map((plan, idx) => (
                  <Card key={idx} className={`border-2 ${plan.highlighted ? "border-red-600" : "border-border"}`}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Plan #{idx + 1}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={plan.highlighted}
                              onCheckedChange={v => updatePlan(idx, "highlighted", v)}
                            />
                            <Label className="text-xs">Destacado</Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlan(idx)}
                            className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Nombre del Plan</Label>
                          <Input value={plan.name} onChange={e => updatePlan(idx, "name", e.target.value)} placeholder="Premium" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Texto del Botón</Label>
                          <Input value={plan.ctaText} onChange={e => updatePlan(idx, "ctaText", e.target.value)} placeholder="Obtener Acceso" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Precio (solo número)</Label>
                          <Input value={plan.price} onChange={e => updatePlan(idx, "price", e.target.value)} placeholder="97" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Período</Label>
                          <Input value={plan.period} onChange={e => updatePlan(idx, "period", e.target.value)} placeholder="mes / año / único" className="h-8 text-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Características incluidas</Label>
                        {plan.features.map((feat, fi) => (
                          <div key={fi} className="flex gap-2">
                            <Input
                              value={feat}
                              onChange={e => updatePlanFeature(idx, fi, e.target.value)}
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFeature(idx, fi)}
                              className="h-7 w-7 p-0 text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addFeature(idx)}
                          className="w-full h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Agregar característica
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" onClick={addPlan} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Agregar Plan
              </Button>

              <Button onClick={() => handleSave("plans")} disabled={updateMutation.isPending} className="w-full bg-red-600 hover:bg-red-700">
                Guardar Planes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer & Social */}
        <TabsContent value="footer" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Footer y Redes Sociales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Texto del Footer</Label>
                <Input
                  value={footerText}
                  onChange={e => setFooterText(e.target.value)}
                  placeholder="© 2025 Posiciones Matadoras. Todos los derechos reservados."
                />
              </div>
              <div className="space-y-3">
                <Label>Redes Sociales (URL completa)</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20 text-muted-foreground">Instagram</span>
                    <Input
                      value={socialLinks.instagram ?? ""}
                      onChange={e => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="https://instagram.com/..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20 text-muted-foreground">WhatsApp</span>
                    <Input
                      value={socialLinks.whatsapp ?? ""}
                      onChange={e => setSocialLinks(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="https://wa.me/..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20 text-muted-foreground">Telegram</span>
                    <Input
                      value={socialLinks.telegram ?? ""}
                      onChange={e => setSocialLinks(prev => ({ ...prev, telegram: e.target.value }))}
                      placeholder="https://t.me/..."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={() => handleSave("footer")} disabled={updateMutation.isPending} className="w-full bg-red-600 hover:bg-red-700">
                Guardar Footer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
