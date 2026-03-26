import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CertificateCardProps {
  certificate: {
    id: number;
    studentName: string;
    moduleTitle: string;
    issuedAt: Date | string;
    verificationCode: string;
  };
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Gera o certificado em canvas e faz o download como PNG.
 */
function downloadCertificate(cert: CertificateCardProps["certificate"]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Fundo preto
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, 1200, 850);

  // Borda externa vermelha
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 1160, 810);

  // Borda interna dourada fina
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(34, 34, 1132, 782);

  // Ornamentos nos cantos (losangos)
  const drawCornerDiamond = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#8b0000";
    ctx.fillRect(-10, -10, 20, 20);
    ctx.restore();
  };
  drawCornerDiamond(54, 54);
  drawCornerDiamond(1146, 54);
  drawCornerDiamond(54, 796);
  drawCornerDiamond(1146, 796);

  // Linha decorativa central superior
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 120);
  ctx.lineTo(1100, 120);
  ctx.stroke();

  // Título "POSICIONES MATADORAS"
  ctx.fillStyle = "#8b0000";
  ctx.font = "bold 22px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("POSICIONES MATADORAS", 600, 100);

  // Ícone de troféu (círculo com estrela)
  ctx.beginPath();
  ctx.arc(600, 195, 48, 0, Math.PI * 2);
  ctx.fillStyle = "#1a0000";
  ctx.fill();
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Estrela no centro do círculo
  ctx.fillStyle = "#c9a84c";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("★", 600, 210);

  // "CERTIFICADO DE CONCLUSIÓN"
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Georgia, serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "4px";
  ctx.fillText("CERTIFICADO DE CONCLUSIÓN", 600, 295);

  // Linha decorativa
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 315);
  ctx.lineTo(1000, 315);
  ctx.stroke();

  // "Este certificado se otorga a"
  ctx.fillStyle = "#9ca3af";
  ctx.font = "italic 20px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Este certificado se otorga a", 600, 365);

  // Nome do aluno
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(cert.studentName, 600, 435);

  // Linha sob o nome
  const nameWidth = ctx.measureText(cert.studentName).width;
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(600 - nameWidth / 2, 450);
  ctx.lineTo(600 + nameWidth / 2, 450);
  ctx.stroke();

  // "por completar exitosamente el módulo"
  ctx.fillStyle = "#9ca3af";
  ctx.font = "italic 20px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("por completar exitosamente el módulo", 600, 495);

  // Título do módulo
  ctx.fillStyle = "#ef4444";
  ctx.font = "bold 30px Georgia, serif";
  ctx.textAlign = "center";
  // Truncar se muito longo
  const maxWidth = 900;
  let moduleText = cert.moduleTitle;
  while (ctx.measureText(moduleText).width > maxWidth && moduleText.length > 10) {
    moduleText = moduleText.slice(0, -4) + "...";
  }
  ctx.fillText(moduleText, 600, 545);

  // Linha decorativa inferior
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 600);
  ctx.lineTo(1100, 600);
  ctx.stroke();

  // Data de emissão e código de verificação
  ctx.fillStyle = "#6b7280";
  ctx.font = "14px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText(`Emitido el: ${formatDate(cert.issuedAt)}`, 120, 650);

  ctx.textAlign = "right";
  ctx.fillText(`Código de verificación: ${cert.verificationCode.slice(0, 16)}...`, 1080, 650);

  // Assinatura
  ctx.strokeStyle = "#4b5563";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(400, 730);
  ctx.lineTo(800, 730);
  ctx.stroke();

  ctx.fillStyle = "#9ca3af";
  ctx.font = "italic 16px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Posiciones Matadoras — Certificado Oficial", 600, 755);

  ctx.fillStyle = "#4b5563";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Verifica en: ${window.location.origin}/certificate/${cert.verificationCode}`, 600, 790);

  // Download
  const link = document.createElement("a");
  link.download = `certificado-${cert.moduleTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function CertificateCard({ certificate }: CertificateCardProps) {
  const handleCopyLink = () => {
    const url = `${window.location.origin}/certificate/${certificate.verificationCode}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Enlace de verificación copiado");
    });
  };

  return (
    <div className="relative rounded-xl border border-yellow-800/40 bg-gradient-to-br from-yellow-950/30 via-card to-red-950/20 overflow-hidden group hover:border-yellow-700/60 transition-all duration-300">
      {/* Barra superior dourada */}
      <div className="h-1 w-full bg-gradient-to-r from-yellow-800 via-yellow-500 to-yellow-800" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-900/60 to-yellow-700/30 border border-yellow-700/40 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <Badge className="bg-yellow-900/40 text-yellow-400 border-yellow-800/50 text-xs mb-1">
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                Certificado Oficial
              </Badge>
              <p className="text-xs text-muted-foreground">POSICIONES MATADORAS</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-2 mb-4">
          <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2">
            {certificate.moduleTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            Otorgado a <span className="text-foreground font-medium">{certificate.studentName}</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(certificate.issuedAt)}</span>
          </div>
        </div>

        {/* Código de verificação */}
        <div className="bg-background/50 rounded-lg p-2.5 mb-4 border border-border">
          <p className="text-xs text-muted-foreground mb-0.5">Código de verificación</p>
          <p className="text-xs font-mono text-foreground truncate">{certificate.verificationCode.slice(0, 20)}...</p>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-yellow-900/40 hover:bg-yellow-800/50 text-yellow-300 border border-yellow-800/50 h-8 text-xs"
            variant="outline"
            onClick={() => downloadCertificate(certificate)}
          >
            <Download className="w-3 h-3 mr-1.5" />
            Descargar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-border text-muted-foreground hover:text-foreground h-8 text-xs"
            onClick={handleCopyLink}
          >
            <ExternalLink className="w-3 h-3 mr-1.5" />
            Verificar
          </Button>
        </div>
      </div>
    </div>
  );
}
