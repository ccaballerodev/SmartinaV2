# Smartina — CDT Smart Regions Center

Smartina is a full-stack AI-powered voice assistant interface built for the **CDT Smart Regions Center**. It provides a conversational chat experience with voice input, text-to-speech output, wake-word activation, and a file management system — all backed by a Flask API proxy that bridges the frontend with n8n webhooks.

---

## Table of Contents

- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [n8n Webhook Integration](#n8n-webhook-integration)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Smartina App                        │
│                                                         │
│  ┌──────────────────────┐    ┌──────────────────────┐   │
│  │   Frontend (Vite +   │    │   Backend (Flask)    │   │
│  │   React + TypeScript)│    │   Python 3.13        │   │
│  │   Port: 5173         │    │   Port: 5000         │   │
│  └──────────┬───────────┘    └──────────┬───────────┘   │
│             │ HTTP/JSON                 │ HTTP/JSON     │
│             │                           │               │
│             │              ┌────────────▼────────────┐  │
│             │              │   n8n Webhook Server    │  │
│             │              │   Port: 5678            │  │
│             └──────────────┤  (Chat, Upload,         │  │
│                            │   Documents, Delete)    │  │
│                            └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

The frontend is a React SPA served by Vite dev server. The backend is a Flask application that acts as a **reverse proxy**, forwarding requests to n8n webhook endpoints. This decoupled architecture keeps the n8n workflow logic separate from the application code.

---

## Project Structure

```
SmartinaV2/
├── .gitignore
├── README.md                    # This file
├── backend/
│   ├── app.py                   # Flask application (all routes)
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (webhook URLs)
│   ├── .env.example             # Example env file
│   ├── README.md                # Backend-specific notes
│   └── venv/                    # Python virtual environment
└── frontend/
    ├── package.json             # Node dependencies & scripts
    ├── tsconfig.json            # TypeScript configuration
    ├── vite.config.ts           # Vite build config
    ├── README.md                # Frontend template notes
    ├── public/
    │   ├── favicon.svg
    │   ├── icons.svg
    │   └── images/
    │       ├── emojis/
    │       └── icons/
    │           ├── Logo_SmartRegions.gif
    │           └── ...
    └── src/
        ├── main.tsx             # React entry point
        ├── App.tsx              # Root component with router
        ├── index.css
        ├── style.css
        ├── types/
        │   └── chat.ts          # TypeScript interfaces (Message, ChatState)
        ├── components/
        │   ├── Chat/
        │   │   ├── Chat.tsx     # Main chat interface
        │   │   ├── ChatInput.tsx # Message input & controls
        │   │   └── ChatMessage.tsx # Individual message bubble
        │   ├── Avatar/
        │   │   ├── Avatar.tsx   # Animated avatar (idle/talking)
        │   │   ├── idle.png
        │   │   └── hablando.png
        │   ├── CallMode/
        │   │   └── CallMode.tsx # Voice call interface
        │   └── Archivos/
        │       ├── Archivos.tsx # File manager component
        │       └── Archivos.css
        ├── Hooks/
        │   ├── useFSM.ts            # Finite State Machine (IDLE/ACTIVE/RESPONSE)
        │   ├── useVoiceInput.ts     # Continuous voice-to-text input
        │   ├── useSpeechRecognition.ts # STT for command mode
        │   ├── useSpeechSynthesis.ts   # TTS with progressive reveal
        │   └── useWakeWordDetection.py  # "Smartina" wake word listener
        ├── services/
        │   ├── chatService.ts      # Streaming chat via fetch
        │   ├── uploadFile.ts       # File upload via fetch
        │   ├── getDocuments.ts     # List documents via fetch
        │   └── deleteDocument.ts   # Delete document via fetch
        ├── lib/
        │   ├── router.tsx         # Custom hash-free router
        │   └── callMode/          # Call mode utilities
        └── state/                   # Application state
```

---

## Features

### Chat
- **Streaming responses** — assistant replies are delivered token-by-token via Server-Sent Events from the Flask backend, which proxies them from n8n.
- **Voice input** — press the microphone button to dictate messages using the browser's Speech Recognition API (Spanish locale `es-ES`).
- **Text-to-speech** — toggle TTS to have the assistant's responses read aloud using the Web Speech Synthesis API.
- **Wake word detection** — say "Smartina" (or variants like "Hey Smartina", "Oye Smartina") to activate the assistant without touching the UI. The wake word listener runs continuously in the background.
- **Call mode** — a dedicated voice-call interface with status indicators, transcript display, and hang-up control.
- **Conversation management** — clear chat history with confirmation dialog.
- **Session persistence** — a unique session ID is generated per browser session and stored in `sessionStorage`.

### File Management
- **Drag & drop upload** — files can be dragged onto the drop zone or selected via click.
- **Multiple file selection** — upload several files at once.
- **File listing** — uploaded files are displayed with name, size, type icon, and delete button.
- **Delete documents** — remove files from the backend/n8n storage.
- **Auto-refresh** — the file list reloads after each upload or deletion.

### UI/UX
- **Responsive dashboard layout** with header, main content area, and footer.
- **Custom FSM** (Finite State Machine) managing states: `IDLE`, `ACTIVE`, `RESPONSE`.
- **Custom router** — no external router dependency; uses `pushState` and `popstate` events for navigation between `/` (chat) and `/archivos` (files).
- **Animated avatar** — toggles between idle and talking frames at 300ms intervals.
- **Suggestions** — quick-reply chips on the welcome screen.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.10+ | Backend Flask server |
| Node.js | 18+ | Frontend development server & build |
| npm | 9+ | Frontend dependency management |
| n8n | Latest | Workflow automation server (webhook endpoints) |

---

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate the virtual environment:**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Copy `.env.example` to `.env` and set your n8n webhook URLs:
   ```bash
   copy .env.example .env
   ```
   Edit `.env` with the correct n8n webhook URLs for your deployment.

5. **Run the Flask server:**
   ```bash
   python app.py
   ```
   The backend starts on `http://127.0.0.1:5000` in debug mode.

---

## Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend starts on `http://localhost:5173`.

---

## Running the Application

1. Start the **n8n** workflow server first (must be running for the backend to proxy requests).
2. Start the **backend** (Flask on port 5000).
3. Start the **frontend** (Vite dev server on port 5173).
4. Open `http://localhost:5173` in a browser.

The frontend communicates with the backend at `http://localhost:5000`, and the backend communicates with n8n at the URLs configured in `.env`.

---

## Configuration

### Environment Variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_WEBHOOK_URL` | `http://localhost:5678/n8n_main_webhook` | n8n webhook for chat streaming |
| `N8N_UPLOAD_WEBHOOK` | `http://localhost:5678/webhook/upload-document` | n8n webhook for file uploads |
| `N8N_DOCUMENTS_WEBHOOK` | `http://localhost:5678/webhook/listar-documentos` | n8n webhook for listing documents |
| `N8N_DELETE_DOCUMENT_WEBHOOK` | `http://localhost:5678/webhook/delete-document` | n8n webhook for deleting documents |

Each variable also has a `_PR` (preview) variant for staging/pre-production environments.

### CORS Configuration

The backend allows cross-origin requests from `http://localhost:5173` (the Vite dev server) on all `/api/*` routes. This is configured in `app.py` via `flask-cors`.

---

## API Endpoints

### Backend (Flask) — `http://localhost:5000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a message and receive a streaming NDJSON response from n8n |
| `POST` | `/api/upload` | Upload a file to n8n via multipart form data |
| `GET` | `/api/documents` | Retrieve the list of uploaded documents from n8n |
| `DELETE` | `/api/documents/<id>` | Delete a document by ID from n8n |

### Frontend → Backend Communication

The frontend services (`src/services/`) use the browser `fetch` API to communicate with the backend:

- **`chatService.ts`** — sends messages to `/api/chat` and processes the streaming NDJSON response using `ReadableStream` and `TextDecoder`. Includes an abort controller for cancellation and a safety guard against infinite loops (50,000 iteration max).
- **`uploadFile.ts`** — sends `FormData` to `/api/upload` and returns the JSON response.
- **`getDocuments.ts`** — fetches the document list from `/api/documents`.
- **`deleteDocument.ts`** — sends a `DELETE` request to `/api/documents/{id}`.

---

## n8n Webhook Integration

Smartina delegates all AI and document management logic to **n8n** workflows. The Flask backend acts as a thin proxy, forwarding requests to n8n webhook endpoints and streaming responses back to the client.

### Chat Flow
1. User sends a message in the frontend chat.
2. Frontend POSTs to `http://localhost:5000/api/chat` with `{ chatInput, sessionId }`.
3. Backend proxies the request to the n8n chat webhook via `httpx.stream()`.
4. n8n processes the message (likely via an LLM node) and streams NDJSON responses.
5. Backend forwards each line to the frontend as an `application/x-ndjson` response.
6. Frontend parses each NDJSON line, extracts `data.content`, and appends it to the message bubble in real time.

### File Upload Flow
1. User drops or selects files in the file manager.
2. Frontend sends `FormData` to `http://localhost:5000/api/upload`.
3. Backend forwards the file to the n8n upload webhook.
4. n8n processes and stores the document.
5. Backend returns the n8n response to the frontend.

### Document Management Flow
- **List**: Backend GETs from the n8n documents webhook and returns the JSON array.
- **Delete**: Backend sends DELETE to the n8n delete webhook with `{ document_id }`.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.7 | UI library |
| TypeScript | ~6.0.2 | Type-safe JavaScript |
| Vite | ^8.1.1 | Build tool & dev server |
| @vitejs/plugin-react | ^6.0.3 | React plugin for Vite |
| Oxlint | ^1.71.0 | Linter |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.13 | Runtime |
| Flask | 3.1.3 | Web framework |
| flask-cors | 6.0.5 | CORS middleware |
| httpx | 0.28.8 | Async HTTP client for proxying to n8n |
| python-dotenv | 1.2.2 | Environment variable loading |

### Browser APIs Used
- **Speech Recognition** (`webkitSpeechRecognition` / `SpeechRecognition`) — voice input
- **Speech Synthesis** (`speechSynthesis`) — text-to-speech output
- **ReadableStream** — processing streaming NDJSON responses
- **sessionStorage** — session ID persistence
- **crypto.randomUUID()** — session ID generation

---

## License

This project is proprietary software developed for the CDT Smart Regions Center. All rights reserved.

© 2026 CDT Smart Regions Center — Todos los derechos reservados.
