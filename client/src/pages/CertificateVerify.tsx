import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, XCircle, Calendar, Loader2, ArrowLeft, Shield } from "lucide-react";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function CertificateVerify() {
  const params = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const code = params.code ?? "";

  const { data: cert, isLoading } = trpc.certificates.verify.useQuery(
    { code },
    { enabled: !!code }
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="font-bold text-foreground text-sm">POSICIONES MATADORAS</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Inicio
          </Button>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Verificando certificado...</p>
            </div>
          ) : !code ? (
            <div className="text-center py-16">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-foreground font-semibold">Código inválido</p>
              <p className="text-muted-foreground text-sm mt-1">No se proporcionó un código de verificación.</p>
            </div>
          ) : cert && cert.isValid ? (
            /* Certificado válido */
            <div className="rounded-2xl border border-yellow-800/40 bg-gradient-to-br from-yellow-950/30 via-card to-red-950/20 overflow-hidden">
              {/* Barra dourada */}
              <div className="h-2 w-full bg-gradient-to-r from-yellow-800 via-yellow-500 to-yellow-800" />

              <div className="p-8 text-center">
                {/* Ícone de verificação */}
                <div className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-700/50 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>

                <Badge className="bg-green-900/40 text-green-400 border-green-800/50 mb-4">
                  <Shield className="w-3 h-3 mr-1" />
                  Certificado Verificado y Auténtico
                </Badge>

                <h1 className="text-2xl font-bold text-foreground mb-1">Certificado Oficial</h1>
                <p className="text-sm text-muted-foreground mb-6">POSICIONES MATADORAS</p>

                <div className="bg-background/50 rounded-xl p-6 border border-border space-y-4 text-left">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estudiante</p>
                    <p className="text-lg font-bold text-foreground">{cert.studentName}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Módulo Completado</p>
                    <p className="text-base font-semibold text-primary">{cert.moduleTitle}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de emisión</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(cert.issuedAt)}</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Código de Verificación</p>
                    <p className="text-xs font-mono text-muted-foreground break-all">{cert.verificationCode}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-6">
                  Este certificado fue emitido por POSICIONES MATADORAS y confirma que el estudiante completó exitosamente el módulo indicado.
                </p>
              </div>
            </div>
          ) : (
            /* Certificado inválido */
            <div className="rounded-2xl border border-red-800/40 bg-gradient-to-br from-red-950/20 via-card to-card overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-red-900 via-red-700 to-red-900" />
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-red-900/30 border-2 border-red-700/50 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <Badge className="bg-red-900/40 text-red-400 border-red-800/50 mb-4">
                  Certificado No Encontrado
                </Badge>
                <h1 className="text-xl font-bold text-foreground mb-2">Certificado Inválido</h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  No se encontró ningún certificado con el código proporcionado. Verifica que el enlace sea correcto o contacta al soporte.
                </p>
                <Button
                  className="mt-6 bg-primary hover:bg-primary/90 text-white"
                  onClick={() => navigate("/")}
                >
                  Ir al Inicio
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
