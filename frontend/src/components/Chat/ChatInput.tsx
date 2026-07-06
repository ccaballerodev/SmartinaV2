import { useRef } from "react";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  isListening: boolean;
  toggleListening: () => void;
  ttsEnabled: boolean;
  toggleTts: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  inputText,
  setInputText,
  onSendMessage,
  isListening,
  toggleListening,
  ttsEnabled,
  toggleTts,
  isLoading
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <form className="chat-form" onSubmit={handleSubmit}>
      <div className="input-container">
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={isLoading}
        />
        <button
          type="button"
          className={`chat-mic ${isListening ? "listening" : ""}`}
          onClick={toggleListening}
          aria-label={isListening ? "Detener escucha" : "Iniciar escucha"}
        >
          🎤
        </button>
      </div>
      <button type="submit" className="chat-send" disabled={isLoading || !inputText.trim()}>
        Enviar
      </button>
      <button
        type="button"
        className={`chat-tts ${ttsEnabled ? "active" : ""}`}
        onClick={toggleTts}
        aria-label={ttsEnabled ? "Desactivar voz" : "Activar voz"}
        title={ttsEnabled ? "Voz activada: click para desactivar" : "Leer respuestas en voz alta"}
      >
        🔊
      </button>
    </form>
  );
}