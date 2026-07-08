import Avatar from "../Avatar/Avatar";

export type CallState = "idle" | "listening" | "thinking" | "responding";

interface CallModeProps {
  state: CallState;
  talking: boolean;
  spokenText: string;
  commandPreview: string;
  onHangUp: () => void;
}

const STATUS_TEXT: Record<CallState, string> = {
  idle: 'Esperando la palabra "Smartina"',
  listening: "Te escucho...",
  thinking: "Pensando...",
  responding: "Respondiendo...",
};

export default function CallMode({
  state,
  talking,
  spokenText,
  commandPreview,
  onHangUp,
}: CallModeProps) {
  const isListening = state === "idle" || state === "listening";

  return (
    <div className="call-overlay">
      <div className="call-stage">
        <Avatar talking={talking} size="call" />

        <div className="call-status">
          <span
            className={`call-idle-dot ${isListening ? "active" : ""} ${
              state === "thinking" ? "thinking" : ""
            } ${state === "responding" ? "responding" : ""}`}
          />
          <span className="call-status-text">{STATUS_TEXT[state]}</span>
        </div>

        <p className="call-transcript">
          {spokenText || "Smartina está lista para ayudarte."}
        </p>

        {commandPreview && (state === "listening" || state === "thinking" || state === "responding") && (
          <p className="call-command-preview">{commandPreview}</p>
        )}
      </div>

      <button className="call-hangup" onClick={onHangUp} title="Colgar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
        </svg>
      </button>
    </div>
  );
}
