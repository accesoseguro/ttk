import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Invalidar cache de assinatura para refletir o novo status
  useEffect(() => {
    utils.members.getSubscription.invalidate();
  }, [utils]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Ícone de sucesso */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-400 text-lg">
            Bienvenido a <span className="text-red-500 font-semibold">POSICIONES MATADORAS</span>
          </p>
          <p className="text-gray-500 text-sm">
            Tu acceso ha sido activado. Ya puedes comenzar a disfrutar de todo el contenido exclusivo.
          </p>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-800" />

        {/* Benefícios */}
        <div className="space-y-3 text-left">
          <p className="text-gray-400 text-sm font-medium text-center mb-4">Lo que tienes ahora:</p>
          {[
            "Acceso a todos los módulos y clases",
            "Videos en HD sin restricciones",
            "Soporte directo con el equipo",
            "Certificados de finalización",
            "Actualizaciones de por vida",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300 text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate("/members")}
          className="w-full bg-red-700 hover:bg-red-600 text-white py-6 text-lg font-semibold rounded-xl"
        >
          <Play className="w-5 h-5 mr-2" />
          Comenzar Ahora
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-gray-600 text-xs">
          Recibirás un email de confirmación en breve.
        </p>
      </div>
    </div>
  );
}
