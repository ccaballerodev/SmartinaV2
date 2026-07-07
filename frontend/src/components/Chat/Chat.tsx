import { useState, useRef, useEffect } from "react";
import type { Message } from "../../types/chat";
import { useSpeechSynthesis } from "../../Hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "../../Hooks/useSpeechRecognition";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import Avatar from "../Avatar/Avatar";
import CallMode from "../CallMode/CallMode";
import {
  sendToBackend,
  stopGeneration,
} from "../../services/chatService";

const suggestions = [
  "¿Qué es el CDT Smart Regions Center?",
  "¿Qué servicios ofrece el CDT?",
  "Cuéntame sobre los proyectos del CDT",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showCallMode, setShowCallMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    speak,
    stopSpeaking,
    synth: ttsSupported,
    isSpeaking,
  } = useSpeechSynthesis();

  const {
    startListening,
    stopListening,
    isSupported: sttSupported,
  } = useSpeechRecognition();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const toggleListening = () => {
    if (!sttSupported) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }

    setInputText("");

    const started = startListening(
      (transcript: string) => {
        setInputText(transcript);
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (started) {
      setIsListening(true);
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

    const userMessage: Message = {
      role: "user",
      text: textToSend,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      role: "model",
      text: "",
      timestamp: Date.now() + 1,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      assistantMessage,
    ]);

    setInputText("");
    setIsLoading(true);

    let fullResponse = "";

    await sendToBackend(textToSend, {
      onToken(token) {
        fullResponse += token;

        setMessages((prev) => {
          const updated = [...prev];

          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: fullResponse,
          };

          return updated;
        });
      },

      onComplete() {
        setIsLoading(false);

        if (ttsEnabled && fullResponse.length > 0) {
          speak(fullResponse);
        }
      },

      onError(error) {
        setIsLoading(false);

        setMessages((prev) => {
          const updated = [...prev];

          updated[updated.length - 1] = {
            role: "model",
            text: "⚠️ " + error,
            timestamp: Date.now(),
          };

          return updated;
        });
      },
    });
  };

  const handleClearChat = () => {
    if (!confirm("¿Limpiar conversación?")) return;

    stopGeneration();
    stopSpeaking();

    setMessages([]);
    setInputText("");
    setIsLoading(false);
  };

  return (
    <div className="chat-layout">
      {showCallMode && (
        <CallMode
          state="idle"
          talking={false}
          spokenText=""
          commandPreview=""
          onHangUp={() => setShowCallMode(false)}
        />
      )}

      <Avatar talking={isSpeaking && ttsEnabled} />

      <div className="chat-container">
      {messages.length === 0 ? (
        <div className="welcome-state">
          <div className="welcome-icon">S</div>

          <h2 className="welcome-title">
            Hola, soy Smartina
          </h2>

          <p className="welcome-subtitle">
            Asistente del Centro de Desarrollo Tecnológico
            (CDT) Smart Regions Center.
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
            <ChatMessage
              key={idx}
              message={msg}
            />
          ))}

          <div ref={messagesEndRef} />
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
        onOpenCallMode={() => setShowCallMode(true)}
      />

      {messages.length > 0 && (
        <button
          className="clear-chat-btn"
          onClick={handleClearChat}
          title="Limpiar conversación"
        >
          🗑️
        </button>
      )}
    </div>
    </div>
  );
}