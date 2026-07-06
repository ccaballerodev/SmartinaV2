import { useState, useRef, useEffect } from "react";
import type { Message } from "../../types/chat";
import { useSpeechSynthesis } from "../../Hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "../../Hooks/useSpeechRecognition";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { sendToBackend } from "../../services/chatService";

const suggestions = [
  "¿Qué es el CDT Smart Regions Center?",
  "¿Qué servicios ofrece el CDT?",
  "Cuéntame sobre los proyectos del CDT"
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { speak, stopSpeaking, synth: ttsSupported } = useSpeechSynthesis();
  const { startListening, stopListening, isSupported: sttSupported } = useSpeechRecognition();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleListening = () => {
    if (!sttSupported) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      setInputText("");
      const started = startListening(
        (transcript: string) => {
          setInputText(transcript);
        },
        () => {
          setIsListening(false);
        },
        (error: any) => {
          console.error("[SpeechRecognition] onerror:", error.error);
          setIsListening(false);
        }
      );
      if (started) setIsListening(true);
    }
  };

  const toggleTts = () => {
    if (!ttsSupported) {
      alert("Tu navegador no soporta síntesis de voz.");
      return;
    }

    if (ttsEnabled) {
      stopSpeaking();
    }
    setTtsEnabled(!ttsEnabled);
  };

  const sendMessage = async (text?: string) => {
    const textToSend = (text || inputText).trim();
    if (!textToSend || isLoading) return;

    setMessages(prev => [...prev, { role: "user", text: textToSend, timestamp: Date.now() }]);
    setInputText("");
    setIsLoading(true);

    try {
      const data = await sendToBackend(textToSend);

      if (data.reply !== undefined) {
        setMessages(prev => [...prev, { role: "model", text: data.reply, timestamp: Date.now() }]);
        if (ttsEnabled) speak(data.reply);
      } else {
        const errorText = `⚠️ Error: ${data.error || "No se pudo procesar."}`;
        setMessages(prev => [...prev, { role: "model", text: errorText, timestamp: Date.now() }]);
        if (ttsEnabled) speak(errorText);
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      const errorText = "No se pudo conectar con el servidor backend. Asegúrate de que Flask esté corriendo en el puerto 5000.";
      setMessages(prev => [...prev, { role: "model", text: errorText, timestamp: Date.now() }]);
      if (ttsEnabled) speak(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("¿Limpiar conversación?")) {
      stopSpeaking();
      setMessages([]);
      setInputText("");
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {messages.length === 0 && !isLoading ? (
        <div className="welcome-state">
          <div className="welcome-icon">S</div>
          <h2 className="welcome-title">Hola, soy Smartina</h2>
          <p className="welcome-subtitle">
            Asistente del Centro de Desarrollo Tecnológico (CDT) Smart Regions Center.
          </p>
          <div className="suggestions">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="suggestion-chip"
                onClick={() => sendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      {isLoading && (
        <div className="thinking-indicator">
          <div className="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="thinking-text">Smartina está pensando...</span>
        </div>
      )}
      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        onSendMessage={sendMessage}
        isListening={isListening}
        toggleListening={toggleListening}
        ttsEnabled={ttsEnabled}
        toggleTts={toggleTts}
        isLoading={isLoading}
      />
      {messages.length > 0 && (
        <button className="clear-chat-btn" onClick={handleClearChat} title="Limpiar conversación">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      )}
    </div>
  );
}
