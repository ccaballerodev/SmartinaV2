import './style.css'
import { setupChat } from './chat.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="dashboard">
    <header class="dashboard-header">
      <h1 class="app-title">Smartina Dashboard</h1>
      <span class="badge">Frontend Demo</span>
    </header>

    <main class="dashboard-main">
      <section class="chat-panel">
        <div class="chat-messages"></div>

        <form class="chat-form" autocomplete="off">
          <input class="chat-input" type="text" placeholder="Escribe un mensaje..." />
          <button type="button" class="chat-tts" aria-label="Activar voz" title="Leer respuestas en voz alta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
          <button type="button" class="chat-mic" aria-label="Iniciar escucha">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          <button type="submit" class="chat-send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </section>

      <aside class="response-panel">
        <div class="model-response">
          <h2>Respuesta del modelo</h2>
          <p class="model-text"></p>
        </div>
      </aside>
    </main>
  </div>
`

setupChat(document.querySelector<HTMLDivElement>('#app')!)