import { useCallback, useRef, useState, useEffect } from "react";

function splitIntoChunks(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]*\s*/g);
  if (!matches) return [text];
  return matches.map((part) => part.trim()).filter(Boolean);
}

export function useSpeechSynthesis() {
  const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cancelRef = useRef(false);
  const utteranceRef = useRef<any>(null);

  const speak = useCallback((text: string) => {
    if (!synth || !text) return;
    cancelRef.current = false;
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
    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [synth]);

  const speakProgressive = useCallback(
    (text: string, onReveal?: (revealed: string) => void) => {
      if (!synth || !text) return;
      cancelRef.current = false;
      synth.cancel();

      const chunks = splitIntoChunks(text);
      let index = 0;

      const speakNext = () => {
        if (cancelRef.current) {
          setIsSpeaking(false);
          return;
        }

        if (index >= chunks.length) {
          setIsSpeaking(false);
          onReveal?.(text);
          return;
        }

        const chunk = chunks[index];
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = "es-ES";
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
          if (cancelRef.current) return;
          onReveal?.(chunk);
          setIsSpeaking(true);
        };
        utterance.onend = () => {
          index += 1;
          speakNext();
        };
        utterance.onerror = (event) => {
          console.error("[SpeechSynthesis] Error al reproducir voz:", event.error);
          index += 1;
          speakNext();
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
      };

      speakNext();
    },
    [synth]
  );

  const stopSpeaking = useCallback(() => {
    cancelRef.current = true;
    if (synth) synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (synth) synth.cancel();
    };
  }, [synth]);

  return { speak, speakProgressive, stopSpeaking, synth: !!synth, isSpeaking };
}
