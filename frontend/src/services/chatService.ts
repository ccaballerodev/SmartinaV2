let abortController: AbortController | null = null;

export interface StreamCallbacks {
  onStart?: () => void;
  onToken: (token: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export async function sendToBackend(
  text: string,
  callbacks: StreamCallbacks
): Promise<void> {
  abortController = new AbortController();

  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatInput: text,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    if (!response.body) {
      throw new Error("El navegador no soporta streaming.");
    }

    callbacks.onStart?.();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);

          // Token del AI Agent
          if (
            data.type === "item" &&
            typeof data.content === "string"
          ) {
            // Ignorar el mensaje final que contiene el JSON completo
            if (data.content.startsWith("{\"output\"")) {
              continue;
            }

            callbacks.onToken(data.content);
          }
        } catch (err) {
          console.warn("Línea inválida:", line);
        }
      }
    }

    callbacks.onComplete?.();
  } catch (err: any) {
    if (err.name === "AbortError") {
      callbacks.onComplete?.();
      return;
    }

    callbacks.onError?.(
      err.message || "Error desconocido."
    );
  } finally {
    abortController = null;
  }
}

export function stopGeneration() {
  abortController?.abort();
}