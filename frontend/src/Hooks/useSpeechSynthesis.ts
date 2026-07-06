import { useCallback } from "react";

export function useSpeechSynthesis() {
  const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

  const speak = useCallback((text: string) => {
    if (!synth || !text) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onerror = (event) => {
      console.error("[SpeechSynthesis] Error al reproducir voz:", event.error);
    };
    synth.speak(utterance);
  }, [synth]);

  const stopSpeaking = useCallback(() => {
    if (synth) synth.cancel();
  }, [synth]);

  return { speak, stopSpeaking, synth: !!synth };
}