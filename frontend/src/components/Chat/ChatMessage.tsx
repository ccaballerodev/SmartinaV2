import type { Message } from "../../types/chat";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`chat-bubble ${message.role}`}>
      {message.text}
    </div>
  );
}