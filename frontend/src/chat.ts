export interface Message {
  role: 'user' | 'model'
  text: string
}

export interface ChatState {
  messages: Message[]
  isListening: boolean
  inputText: string
  isLoading: boolean
  ttsEnabled: boolean
}

export function setupChat(root: HTMLElement) {
  const state: ChatState = {
    messages: [],
    isListening: false,
    inputText: '',
    isLoading: false,
    ttsEnabled: false,
  }

  // Configuración de Reconocimiento de Voz (Speech-to-Text)
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  let recognition: any = null
  if (SpeechRecognition) {
    recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
      state.inputText = transcript
      updateInput()
    }

    recognition.onend = () => {
      state.isListening = false
      updateMicButton()
    }

    recognition.onerror = (event: any) => {
      console.error('[SpeechRecognition] onerror:', event.error)
      state.isListening = false
      updateMicButton()
    }
  }

  // Configuración de Síntesis de Voz (Text-to-Speech)
  const synth: SpeechSynthesis | null = 'speechSynthesis' in window ? window.speechSynthesis : null

  function speak(text: string) {
    if (!synth || !text) return

    // Si ya está hablando, cancelamos para no encimar audios
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 1
    utterance.pitch = 1

    utterance.onerror = (event) => {
      console.error('[SpeechSynthesis] Error al reproducir voz:', event.error)
    }

    synth.speak(utterance)
  }

  function stopSpeaking() {
    if (synth) synth.cancel()
  }

  // Selectores del DOM
  const messagesContainer = root.querySelector('.chat-messages')!
  const inputEl = root.querySelector('.chat-input') as HTMLInputElement
  const sendBtn = root.querySelector('.chat-send')!
  const micBtn = root.querySelector('.chat-mic')!
  const ttsBtn = root.querySelector('.chat-tts') as HTMLButtonElement
  const responseArea = root.querySelector('.model-response')!
  const modelText = root.querySelector('.model-text')!
  const chatForm = root.querySelector('.chat-form') as HTMLFormElement

  function renderMessages() {
    messagesContainer.innerHTML = ''
    state.messages.forEach((msg) => {
      const bubble = document.createElement('div')
      bubble.className = `chat-bubble ${msg.role}`
      bubble.textContent = msg.text
      messagesContainer.appendChild(bubble)
    })
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  function updateInput() {
    inputEl.value = state.inputText
  }

  function updateMicButton() {
    micBtn.classList.toggle('listening', state.isListening)
    micBtn.setAttribute('aria-label', state.isListening ? 'Detener escucha' : 'Iniciar escucha')
  }

  function updateTtsButton() {
    ttsBtn.classList.toggle('active', state.ttsEnabled)
    ttsBtn.setAttribute('aria-label', state.ttsEnabled ? 'Desactivar voz' : 'Activar voz')
    ttsBtn.title = state.ttsEnabled ? 'Voz activada: click para desactivar' : 'Leer respuestas en voz alta'
  }

  function updateResponse(text: string = 'Pensando...') {
    if (state.isLoading) {
      responseArea.classList.add('visible')
      modelText.textContent = text
    } else {
      responseArea.classList.remove('visible')
      modelText.textContent = ''
    }
  }


  async function sendMessage() {
    // Escuchar el valor directamente del input por si el usuario escribió a mano
    state.inputText = inputEl.value
    const textToSend = state.inputText.trim()

    if (!textToSend || state.isLoading) return

    // Mostrar mensaje del usuario en la UI inmediatamente
    state.messages.push({ role: 'user', text: textToSend })
    state.inputText = ''
    updateInput()
    renderMessages()

    // Activar estado de carga ("Pensando...")
    state.isLoading = true
    updateResponse('Smartina está pensando...')

    try {
      // Petición HTTP Real hacia tu backend en Flask
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatInput: textToSend }) // Payload exacto que espera Flask
      })

      const data = await response.json()

      if (response.ok) {
        // Si Flask responde bien, agregamos la respuesta de n8n
        state.messages.push({ role: 'model', text: data.reply })
        if (state.ttsEnabled) {
          speak(data.reply)
        }
      } else {
        // Manejo de errores controlados desde Flask (ej: n8n caído)
        const errorText = `⚠️ Error: ${data.error || 'No se pudo procesar.'}`
        state.messages.push({ role: 'model', text: errorText })
        if (state.ttsEnabled) {
          speak(errorText)
        }
      }

    } catch (error) {
      // Manejo de errores críticos (ej: Servidor Flask totalmente apagado)
      console.error("Error al conectar con la API:", error)
      const errorText = 'No se pudo conectar con el servidor backend. Asegúrate de que Flask esté corriendo en el puerto 5000.'
      state.messages.push({
        role: 'model',
        text: errorText
      })
      if (state.ttsEnabled) {
        speak(errorText)
      }
    } finally {
      // Apagar cargador y refrescar la pantalla
      state.isLoading = false
      updateResponse()
      renderMessages()
    }
  }

  // Controlar el submit del formulario completo (evita recargas de página extrañas)
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    sendMessage()
  })

  // Evento al botón enviar por si hacen click
  sendBtn.addEventListener('click', (e) => {
    e.preventDefault()
    sendMessage()
  })

  // Controlar el botón del micrófono
  micBtn.addEventListener('click', (e) => {
    e.preventDefault()
    if (!recognition) {
      alert('Tu navegador no soporta reconocimiento de voz.')
      return
    }

    if (state.isListening) {
      recognition.stop()
      state.isListening = false
    } else {
      state.inputText = ''
      updateInput()
      try {
        recognition.start()
        state.isListening = true
      } catch (err) {
        console.error('[SpeechRecognition] Error al iniciar:', err)
        state.isListening = false
      }
    }
    updateMicButton()
  })

  // Controlar el botón de texto a voz (TTS)
  ttsBtn.addEventListener('click', (e) => {
    e.preventDefault()

    if (!synth) {
      alert('Tu navegador no soporta síntesis de voz.')
      return
    }

    state.ttsEnabled = !state.ttsEnabled
    updateTtsButton()

    // Si lo desactivan mientras está hablando, cortamos el audio de inmediato
    if (!state.ttsEnabled) {
      stopSpeaking()
    }
  })

  // Limpiar chat al hacer click en el título
  root.querySelector('.app-title')!.addEventListener('click', () => {
    if (confirm('¿Limpiar conversación?')) {
      stopSpeaking()
      state.messages = []
      state.inputText = ''
      state.isLoading = false
      updateInput()
      updateMicButton()
      updateResponse()
      renderMessages()
    }
  })

  updateTtsButton()
  renderMessages()
}