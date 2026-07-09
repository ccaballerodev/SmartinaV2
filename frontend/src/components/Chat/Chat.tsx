import { useState, useRef, useEffect, useCallback } from "react";
import type { Message } from "../../types/chat";
import { useSpeechSynthesis } from "../../Hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "../../Hooks/useSpeechRecognition";
import { useVoiceInput } from "../../Hooks/useVoiceInput";
import { useFSM, type FSMState } from "../../Hooks/useFSM";
import { useWakeWordDetection } from "../../Hooks/useWakeWordDetection";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import Avatar from "../Avatar/Avatar";
import CallMode from "../CallMode/CallMode";
import { type CallState } from "../CallMode/CallMode";
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
  const [isListeningForCommand, setIsListeningForCommand] = useState(false);
  const [inputText, setInputText] = useState("");
  const [callTranscript, setCallTranscript] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showCallMode, setShowCallMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const commandSilenceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined!);
  const detectedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined!);
  const noCommandTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined!);
  const heardSpeechRef = useRef(false);
  const lastCommandRef = useRef("");
  const prevStateRef = useRef<FSMState>("IDLE");
  const fsmStateRef = useRef<FSMState>("IDLE");
  const interruptedRef = useRef(false);
  const generatingRef = useRef(false);
  const idleTransitionRef = useRef<ReturnType<typeof setTimeout>>(undefined!);

  const NO_COMMAND_TIMEOUT = 6000;

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

  const { isListening, toggle: toggleMic, stop: stopMic } = useVoiceInput(setInputText);

  const { fsm, transition, acknowledge } = useFSM();

  const handleSendMessage = useCallback(async (text?: string) => {
    const textToSend = (text || inputText).trim();
    console.log("[API] handleSendMessage entrada:", JSON.stringify(textToSend), "fsm:", fsm.state, "processing:", fsm.processing);

    if (!textToSend) {
      console.log("[API] handleSendMessage salida: texto vacío");
      return;
    }

    console.log("[API] Enviando a backend:", JSON.stringify(textToSend));
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
    transition("RESPONSE");
    generatingRef.current = true;
    console.log("[API] FSM transicionado a RESPONSE");

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
        generatingRef.current = false;
        if (interruptedRef.current) {
          console.log("[API] onComplete ignorado por interrupción del usuario");
          interruptedRef.current = false;
          return;
        }
        console.log("[API] onComplete. response:", JSON.stringify(fullResponse), "ttsEnabled:", ttsEnabled, "showCallMode:", showCallMode);
        if (fullResponse.length > 0 && (ttsEnabled || showCallMode)) {
          speak(fullResponse);
        }

        idleTransitionRef.current = setTimeout(() => {
          idleTransitionRef.current = undefined!;
          console.log("[API] Volviendo a IDLE desde RESPONSE");
          transition("IDLE");
          acknowledge();
        }, 1000);
      },

      onError(error) {
        generatingRef.current = false;
        console.log("[API] onError:", error);
        setMessages((prev) => {
          const updated = [...prev];

          updated[updated.length - 1] = {
            role: "model",
            text: "⚠️ " + error,
            timestamp: Date.now(),
          };

          return updated;
        });

        idleTransitionRef.current = setTimeout(() => {
          idleTransitionRef.current = undefined!;
          console.log("[API] Volviendo a IDLE desde error");
          transition("IDLE");
          acknowledge();
        }, 1000);
      },
    });
  }, [inputText, transition, acknowledge, speak, ttsEnabled, fsm, showCallMode]);

  const finalizeCommand = useCallback((finalTranscript: string) => {
    if (noCommandTimerRef.current) {
      clearTimeout(noCommandTimerRef.current);
    }
    const command = finalTranscript.trim();
    console.log("[CMD] finalizeCommand entrada:", JSON.stringify(command));
    setIsListeningForCommand(false);
    stopListening();
    lastCommandRef.current = "";

    if (command) {
      console.log("Comando capturado:", command);
      console.log("[CMD] Llamando handleSendMessage con:", JSON.stringify(command));
      transition("RESPONSE");
      handleSendMessage(command);
      console.log("[CMD] handleSendMessage invocado");
    } else {
      console.log("[CMD] Sin comando, volviendo a IDLE");
      transition("IDLE");
      acknowledge();
    }
  }, [stopListening, transition, handleSendMessage, acknowledge]);

  const handleWakeWordDetected = useCallback(
    (transcript: string) => {
      console.log("[WW] handleWakeWordDetected:", transcript);

      // Siempre cortar el habla al activar Smartina (interrupción)
      stopSpeaking();
      if (idleTransitionRef.current) {
        clearTimeout(idleTransitionRef.current);
        idleTransitionRef.current = undefined!;
      }

      if (generatingRef.current) {
        console.log("[WW] Interrumpiendo respuesta en curso");
        interruptedRef.current = true;
        stopGeneration();
      }

      transition("ACTIVE");
      setInputText("");
      setCallTranscript("");
      lastCommandRef.current = "";
      heardSpeechRef.current = false;
      setIsListeningForCommand(true);

      const started = startListening(
        (cmd) => {
          console.log("[CMD] onResult:", JSON.stringify(cmd));
          heardSpeechRef.current = true;
          if (noCommandTimerRef.current) {
            clearTimeout(noCommandTimerRef.current);
          }
          lastCommandRef.current = cmd;
          setInputText(cmd);
          setCallTranscript(cmd);
          if (commandSilenceTimerRef.current) {
            clearTimeout(commandSilenceTimerRef.current);
          }
          commandSilenceTimerRef.current = setTimeout(() => {
            console.log("[CMD] Silencio detectado, finalizando:", JSON.stringify(cmd));
            finalizeCommand(lastCommandRef.current);
          }, 2500);
        },
        () => {
          console.log("[CMD] onEnd. comando:", JSON.stringify(lastCommandRef.current.trim()));
          if (commandSilenceTimerRef.current) {
            clearTimeout(commandSilenceTimerRef.current);
          }
          if (noCommandTimerRef.current) {
            clearTimeout(noCommandTimerRef.current);
          }
          if (lastCommandRef.current.trim()) {
            finalizeCommand(lastCommandRef.current);
          } else {
            setIsListeningForCommand(false);
          }
        },
        (error) => {
          console.log("[CMD] onError:", error);
          setIsListeningForCommand(false);
          if (noCommandTimerRef.current) {
            clearTimeout(noCommandTimerRef.current);
          }
        },
        true
      );

      console.log("[CMD] startListening resultado:", started);
      if (!started) {
        setIsListeningForCommand(false);
        return;
      }

      if (noCommandTimerRef.current) {
        clearTimeout(noCommandTimerRef.current);
      }
      noCommandTimerRef.current = setTimeout(() => {
        console.log("[CMD] No se recibió comando tras la palabra de activación");
        if (commandSilenceTimerRef.current) {
          clearTimeout(commandSilenceTimerRef.current);
        }
        heardSpeechRef.current = false;
        lastCommandRef.current = "";
        setIsListeningForCommand(false);
        stopListening();
        transition("IDLE");
        acknowledge();
        if (showCallMode) {
          speak(
            "¿Estás ahí? No dijiste nada. Di 'Smartina' nuevamente para activarme."
          );
        }
      }, NO_COMMAND_TIMEOUT);
    },
    [transition, startListening, finalizeCommand, speak, showCallMode, acknowledge, stopListening, stopSpeaking]
  );

  const wakeWord = useWakeWordDetection({
    onDetected: handleWakeWordDetected,
    commandActive: isListeningForCommand || isListening,
  });

  useEffect(() => {
    wakeWord.startWatching();

    return () => {
      wakeWord.stopWatching();
    };
  }, [wakeWord]);

  useEffect(() => {
    return () => {
      if (commandSilenceTimerRef.current) {
        clearTimeout(commandSilenceTimerRef.current);
      }
      if (noCommandTimerRef.current) {
        clearTimeout(noCommandTimerRef.current);
      }
      if (idleTransitionRef.current) {
        clearTimeout(idleTransitionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log("[FSM] state changed:", fsm.state, "processing:", fsm.processing, "detected:", fsm.detected);

    fsmStateRef.current = fsm.state;

    if (fsm.state === "ACTIVE" && prevStateRef.current === "IDLE" && !showCallMode && !isListeningForCommand) {
      console.log("[FSM] Arrancando temporizador de retorno a IDLE");
      detectedTimerRef.current = setTimeout(() => {
        console.log("[FSM] Timeout, volviendo a IDLE");
        transition("IDLE");
        acknowledge();
      }, 4000);
    }

    prevStateRef.current = fsm.state;

    return () => {
      if (detectedTimerRef.current) {
        clearTimeout(detectedTimerRef.current);
      }
    };
  }, [fsm.state, fsm.processing, fsm.detected, transition, acknowledge, showCallMode, isListeningForCommand]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const toggleListening = useCallback(() => {
    if (isListeningForCommand || fsm.processing) {
      return;
    }

    toggleMic();
  }, [isListeningForCommand, fsm.processing, toggleMic]);

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

  const handleClearChat = () => {
    if (!confirm("¿Limpiar conversación?")) return;

    if (commandSilenceTimerRef.current) {
      clearTimeout(commandSilenceTimerRef.current);
    }
    if (noCommandTimerRef.current) {
      clearTimeout(noCommandTimerRef.current);
    }
    if (idleTransitionRef.current) {
      clearTimeout(idleTransitionRef.current);
    }

    stopGeneration();
    stopSpeaking();
    generatingRef.current = false;
    interruptedRef.current = false;

    setMessages([]);
    setInputText("");
    setCallTranscript("");
    setIsListeningForCommand(false);
  };

  const handleOpenCallMode = () => {
    setShowCallMode(true);
    setCallTranscript("");

    if (sttSupported && !isListening) {
      const started = startListening(
        (transcript: string) => {
          setInputText(transcript);
          setCallTranscript(transcript);
        },
        () => {
          stopMic();
        },
        () => {
          stopMic();
        },
        true
      );

      if (started) {
        // el modo llamada usa su propia instancia de reconocimiento
      }
    }
  };

  const handleHangUp = () => {
    if (commandSilenceTimerRef.current) {
      clearTimeout(commandSilenceTimerRef.current);
    }
    if (noCommandTimerRef.current) {
      clearTimeout(noCommandTimerRef.current);
    }
    if (idleTransitionRef.current) {
      clearTimeout(idleTransitionRef.current);
    }

    stopSpeaking();
    stopListening();
    stopMic();
    generatingRef.current = false;
    interruptedRef.current = false;
    setShowCallMode(false);
    setCallTranscript("");
    transition("IDLE");
    acknowledge();
  };

  return (
    <div className="chat-layout">
      {showCallMode && (() => {
        const callState: CallState =
          fsm.state === "RESPONSE"
            ? "responding"
            : fsm.state === "ACTIVE" && showCallMode
              ? "listening"
              : "idle";
        return (
          <CallMode
            state={callState}
            talking={isSpeaking && (ttsEnabled || showCallMode)}
            spokenText={callTranscript}
            commandPreview={callTranscript}
            onHangUp={handleHangUp}
          />
        );
      })()}

      <Avatar talking={isSpeaking && (ttsEnabled || showCallMode)} />

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
                  onClick={() => handleSendMessage(suggestion)}
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
          onSendMessage={handleSendMessage}
          isListening={isListening}
          toggleListening={toggleListening}
          ttsEnabled={ttsEnabled}
          toggleTts={toggleTts}
          isLoading={fsm.processing}
          onOpenCallMode={handleOpenCallMode}
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
