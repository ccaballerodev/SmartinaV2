import { useCallback, useState, useEffect } from "react";

export function useSpeechSynthesis() {
  const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!synth || !text) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error("[SpeechSynthesis] Error al reproducir voz:", event.error);
      setIsSpeaking(false);
    };
    synth.speak(utterance);
  }, [synth]);

  const stopSpeaking = useCallback(() => {
    if (synth) synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
    };
  }, [synth]);

  return { speak, stopSpeaking, synth: !!synth, isSpeaking };
}
