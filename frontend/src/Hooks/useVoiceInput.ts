import { useCallback, useEffect, useRef, useState } from "react";

export function useVoiceInput(setInputText: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);

  const supported =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stopInternal = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startInternal = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript.trimStart());
    };

    recognition.onerror = (event: any) => {
      const error = event?.error;
      if (error === "aborted" || error === "no-speech") {
        return;
      }
      console.error("[VoiceInput] Error:", error);
      if (error === "not-allowed" || error === "service-not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (!shouldListenRef.current) return;
          try {
            recognition.start();
            recognitionRef.current = recognition;
          } catch {
            // fall through to stop
          }
        }, 150);
        return;
      }
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      shouldListenRef.current = true;
      setIsListening(true);
    } catch (err) {
      console.error("[VoiceInput] Error al iniciar:", err);
      shouldListenRef.current = false;
      setIsListening(false);
    }
  }, [setInputText]);

  const toggle = useCallback(() => {
    if (shouldListenRef.current || recognitionRef.current) {
      stopInternal();
    } else {
      setInputText("");
      startInternal();
    }
  }, [startInternal, stopInternal, setInputText]);

  const stop = useCallback(() => {
    stopInternal();
  }, [stopInternal]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, toggle, stop, supported };
}
