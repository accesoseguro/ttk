import { useLocation } from "wouter";
import { XCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancel() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Ícone */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-900/30 border-2 border-red-700 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">
            Pago Cancelado
          </h1>
          <p className="text-gray-400 text-lg">
            No se realizó ningún cargo en tu tarjeta.
          </p>
          <p className="text-gray-500 text-sm">
            Si tuviste algún problema durante el pago o tienes dudas, 
            contáctanos y te ayudamos.
          </p>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-800" />

        {/* Botões */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-red-700 hover:bg-red-600 text-white py-6 text-lg font-semibold rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver e Intentar de Nuevo
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/members")}
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-900 py-6 rounded-xl"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Ir al Chat de Soporte
          </Button>
        </div>

        <p className="text-gray-600 text-xs">
          ¿Necesitas ayuda? Escríbenos directamente en el chat de soporte.
        </p>
      </div>
    </div>
  );
}
