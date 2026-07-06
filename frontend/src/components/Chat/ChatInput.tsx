import { useRef, useEffect } from "react";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: (text?: string) => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${newHeight}px`;
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <form className="chat-form" onSubmit={handleSubmit}>
      <div className="input-row">
        <div className="input-field">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={isLoading}
            rows={1}
          />
        </div>
        <div className="input-actions">
          <button
            type="button"
            className={`chat-mic ${isListening ? "listening" : ""}`}
            onClick={toggleListening}
            aria-label={isListening ? "Detener escucha" : "Iniciar escucha"}
            title={isListening ? "Detener escucha" : "Escuchar con voz"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
          <button
            type="button"
            className={`chat-tts ${ttsEnabled ? "active" : ""}`}
            onClick={toggleTts}
            aria-label={ttsEnabled ? "Desactivar voz" : "Activar voz"}
            title={ttsEnabled ? "Voz activada: click para desactivar" : "Leer respuestas en voz alta"}
          >
            {ttsEnabled ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" x2="17" y1="9" y2="15"/>
                <line x1="17" x2="23" y1="9" y2="15"/>
              </svg>
            )}
          </button>
          <button type="submit" className="chat-send" disabled={isLoading || !inputText.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="19" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
