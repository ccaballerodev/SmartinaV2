import { useCallback, useRef } from "react";

export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);

  const initRecognition = useCallback((continuous = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;
    return recognition;
  }, []);

  const startListening = useCallback((onResult: (transcript: string) => void, onEnd: () => void, onError: (error: any) => void, continuous = false) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const recognition = initRecognition(continuous);
    if (!recognition) return false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      onResult(transcript);
    };
    recognition.onend = onEnd;
    recognition.onerror = onError;

    recognitionRef.current = recognition;

    try {
      recognition.start();
      return true;
    } catch (err) {
      console.error("[SpeechRecognition] Error al iniciar:", err);
      return false;
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { startListening, stopListening, isSupported: typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) };
}