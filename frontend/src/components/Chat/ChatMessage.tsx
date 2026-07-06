import type { Message } from "../../types/chat";

interface ChatMessageProps {
  message: Message;
}

function formatTime(timestamp?: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const time = formatTime(message.timestamp);

  return (
    <div className={`chat-bubble ${message.role}`}>
      {message.text}
      {time && <div className={`message-time message-time-below ${message.role}`}>{time}</div>}
    </div>
  );
}
