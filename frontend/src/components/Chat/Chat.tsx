import { useState } from "react";
import type { Message } from "../../types/chat";
import { useSpeechSynthesis } from "../../Hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "../../Hooks/useSpeechRecognition";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { sendToBackend } from "../../services/chatService";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const { speak, stopSpeaking, synth: ttsSupported } = useSpeechSynthesis();
  const { startListening, stopListening, isSupported: sttSupported } = useSpeechRecognition();

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

  const sendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || isLoading) return;

    setMessages(prev => [...prev, { role: "user", text: textToSend }]);
    setInputText("");
    setIsLoading(true);

    try {
      const data = await sendToBackend(textToSend);

      if (data.reply !== undefined) {
        setMessages(prev => [...prev, { role: "model", text: data.reply }]);
        if (ttsEnabled) speak(data.reply);
      } else {
        const errorText = `⚠️ Error: ${data.error || "No se pudo procesar."}`;
        setMessages(prev => [...prev, { role: "model", text: errorText }]);
        if (ttsEnabled) speak(errorText);
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      const errorText = "No se pudo conectar con el servidor backend. Asegúrate de que Flask esté corriendo en el puerto 5000.";
      setMessages(prev => [...prev, { role: "model", text: errorText }]);
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
      <h1 className="app-title" onClick={handleClearChat}>Smartina</h1>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
      </div>
      {isLoading && (
        <div className="model-response visible">
          <span className="model-text">Smartina está pensando...</span>
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
    </div>
  );
}