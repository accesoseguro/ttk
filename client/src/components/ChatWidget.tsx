import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: number;
  message: string;
  isFromAdmin: boolean;
  isRead: boolean;
  createdAt: Date | string;
};

function formatTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Busca histórico com polling a cada 5s quando aberto
  const { data: messages = [], isLoading } = trpc.chat.getMyHistory.useQuery(undefined, {
    refetchInterval: isOpen ? 5000 : false,
  });

  // Conta não lidos (polling a cada 10s quando fechado)
  const { data: unreadData } = trpc.chat.getUnreadCount.useQuery(undefined, {
    refetchInterval: isOpen ? false : 10000,
  });

  const sendMsg = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMyHistory.invalidate();
      setText("");
    },
  });

  const markRead = trpc.chat.markAdminMessagesRead.useMutation({
    onSuccess: () => utils.chat.getUnreadCount.invalidate(),
  });

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Marca como lido ao abrir
  useEffect(() => {
    if (isOpen && (unreadData?.count ?? 0) > 0) {
      markRead.mutate();
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sendMsg.isPending) return;
    sendMsg.mutate({ message: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Janela do chat */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "480px" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-red-900 to-red-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">PM</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Soporte POSICIONES MATADORAS</p>
                <p className="text-red-200 text-xs">Respondemos en menos de 24h</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-7 w-7 p-0 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
                <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <p className="text-gray-300 font-medium text-sm">¡Hola! ¿En qué podemos ayudarte?</p>
                  <p className="text-gray-500 text-xs mt-1">Escribe tu pregunta y te responderemos pronto.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Mensagem de boas-vindas sempre no topo */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2">
                    <p className="text-gray-200 text-sm">¡Hola! ¿En qué podemos ayudarte hoy? 😊</p>
                    <p className="text-gray-500 text-xs mt-1">Soporte</p>
                  </div>
                </div>

                {(messages as Message[]).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isFromAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        msg.isFromAdmin
                          ? "bg-gray-800 rounded-tl-sm"
                          : "bg-red-700 rounded-tr-sm"
                      }`}
                    >
                      <p className="text-white text-sm break-words">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.isFromAdmin ? "text-gray-400" : "text-red-200"}`}>
                        {msg.isFromAdmin ? "Soporte · " : ""}{formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-800 p-3 bg-gray-950 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-600 transition-colors"
                style={{ maxHeight: "80px", overflowY: "auto" }}
              />
              <Button
                onClick={handleSend}
                disabled={!text.trim() || sendMsg.isPending}
                size="sm"
                className="bg-red-600 hover:bg-red-700 rounded-xl h-9 w-9 p-0 flex-shrink-0"
              >
                {sendMsg.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </Button>
            </div>
            <p className="text-gray-600 text-xs mt-1 text-center">Enter para enviar · Shift+Enter para nueva línea</p>
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-black text-xs font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
      </button>
    </div>
  );
}
