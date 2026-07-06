import { useRef, useEffect } from "react";
import { stopGeneration } from "../../services/chatService";

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
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      stopGeneration();
      return;
    }

    onSendMessage();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isLoading) {
        stopGeneration();
      } else {
        onSendMessage();
      }
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
            rows={1}
          />
        </div>

        <div className="input-actions">

          <button
            type="button"
            className={`chat-mic ${isListening ? "listening" : ""}`}
            onClick={toggleListening}
            title={
              isListening
                ? "Detener escucha"
                : "Escuchar con voz"
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>

          <button
            type="button"
            className={`chat-tts ${ttsEnabled ? "active" : ""}`}
            onClick={toggleTts}
          >
            {ttsEnabled ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" x2="17" y1="9" y2="15" />
                <line x1="17" x2="23" y1="9" y2="15" />
              </svg>
            )}
          </button>

          <button
            type="submit"
            className={`chat-send ${isLoading ? "stop-mode" : ""}`}
            disabled={!isLoading && !inputText.trim()}
            title={isLoading ? "Detener generación" : "Enviar"}
          >
            {isLoading ? (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect
                  x="7"
                  y="7"
                  width="10"
                  height="10"
                  rx="1.5"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line
                  x1="12"
                  x2="12"
                  y1="19"
                  y2="5"
                />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </button>

        </div>

      </div>
    </form>
  );
}