import { useEffect, useCallback, useRef } from "react";

const WAKE_PATTERNS = /\b(smartina|es martina|es martin|hey smartina|oye smartina|hola smartina|ey smartina|hey martina|oye martina)\b/i;

export interface UseWakeWordDetectionOptions {
  onDetected: (transcript: string) => void;
  enabled?: boolean;
  language?: string;
  commandActive?: boolean;
}

export function useWakeWordDetection({
  onDetected,
  enabled = true,
  language = "es-ES",
  commandActive = false,
}: UseWakeWordDetectionOptions) {
  const recognitionRef = useRef<any>(null);
  const attemptsRef = useRef(0);
  const latestAttemptRef = useRef(0);

  const stopCurrent = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const startCurrent = useCallback(() => {
    stopCurrent();

    const SpeechRecognition =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognition) {
      return;
    }

    if (commandActive) {
      return;
    }

    attemptsRef.current += 1;
    latestAttemptRef.current = attemptsRef.current;
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");

      if (WAKE_PATTERNS.test(transcript)) {
        attemptsRef.current = 0;
        onDetected(transcript);
        return;
      }
    };

    recognition.onend = () => {
      if (enabled && !commandActive && attemptsRef.current < 50 && latestAttemptRef.current === attemptsRef.current) {
        setTimeout(() => {
          startCurrent();
        }, 450);
      }
    };

    recognition.onerror = (event: any) => {
      if (
        enabled &&
        !commandActive &&
        attemptsRef.current < 50 &&
        event.error !== "not-allowed" &&
        event.error !== "service-not-allowed" &&
        latestAttemptRef.current === attemptsRef.current
      ) {
        setTimeout(() => {
          startCurrent();
        }, 450);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }
  }, [enabled, language, onDetected, stopCurrent, commandActive]);

  useEffect(() => {
    if (!enabled || commandActive) {
      return;
    }

    attemptsRef.current += 1;
    latestAttemptRef.current = attemptsRef.current;
    startCurrent();

    return () => {
      stopCurrent();
    };
  }, [enabled, commandActive, startCurrent, stopCurrent]);

  return {
    startWatching: startCurrent,
    stopWatching: stopCurrent,
    isSupported: typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
  };
}
