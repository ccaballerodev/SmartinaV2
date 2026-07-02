export interface Message {
  role: 'user' | 'model'
  text: string
}

export interface ChatState {
  messages: Message[]
  isListening: boolean
  inputText: string
  isLoading: boolean
}

export function setupChat(root: HTMLElement) {
  const state: ChatState = {
    messages: [],
    isListening: false,
    inputText: '',
    isLoading: false,
  }

  // Configuración de Reconocimiento de Voz
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

    recognition.onerror = () => {
      state.isListening = false
      updateMicButton()
    }
  }

  // Selectores del DOM
  const messagesContainer = root.querySelector('.chat-messages')!
  const inputEl = root.querySelector('.chat-input') as HTMLInputElement
  const sendBtn = root.querySelector('.chat-send')!
  const micBtn = root.querySelector('.chat-mic')!
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
      } else {
        // Manejo de errores controlados desde Flask (ej: n8n caído)
        state.messages.push({ role: 'model', text: `⚠️ Error: ${data.error || 'No se pudo procesar.'}` })
      }

    } catch (error) {
      // Manejo de errores críticos (ej: Servidor Flask totalmente apagado)
      console.error("Error al conectar con la API:", error)
      state.messages.push({ 
        role: 'model', 
        text: 'No se pudo conectar con el servidor backend. Asegúrate de que Flask esté corriendo en el puerto 5000.' 
      })
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
      recognition.start()
      state.isListening = true
    }
    updateMicButton()
  })

  // Limpiar chat al hacer click en el título
  root.querySelector('.app-title')!.addEventListener('click', () => {
    if (confirm('¿Limpiar conversación?')) {
      state.messages = []
      state.inputText = ''
      state.isLoading = false
      updateInput()
      updateMicButton()
      updateResponse()
      renderMessages()
    }
  })

  renderMessages()
}