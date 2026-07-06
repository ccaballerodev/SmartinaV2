import { useCallback, useRef } from "react";

export function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.continuous = false;
    return recognition;
  }, []);

  const startListening = useCallback((onResult: (transcript: string) => void, onEnd: () => void, onError: (error: any) => void) => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
      if (!recognitionRef.current) return false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        onResult(transcript);
      };
      recognitionRef.current.onend = onEnd;
      recognitionRef.current.onerror = onError;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return true;
      } catch (err) {
        console.error("[SpeechRecognition] Error al iniciar:", err);
        return false;
      }
    }
    return false;
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { startListening, stopListening, isSupported: typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) };
}