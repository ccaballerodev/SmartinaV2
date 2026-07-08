
import { useState, useCallback } from "react";

export type FSMState = "IDLE" | "ACTIVE" | "RESPONSE";
export interface FSMContext {
  state: FSMState;
  detected: boolean;
  processing: boolean;
}

export function useFSM() {
  const [fsm, setFSM] = useState<FSMContext>({
    state: "IDLE",
    detected: false,
    processing: false,
  });

  const transition = useCallback((nextState: FSMState) => {
    setFSM((prev) => ({
      ...prev,
      state: nextState,
      detected: nextState === "ACTIVE" ? true : prev.detected,
      processing: nextState === "RESPONSE" ? true : prev.processing,
    }));
  }, []);

  const acknowledge = useCallback(() => {
    setFSM((prev) => ({
      ...prev,
      detected: false,
      processing: false,
      state: "IDLE",
    }));
  }, []);

  return { fsm, transition, acknowledge };
}
