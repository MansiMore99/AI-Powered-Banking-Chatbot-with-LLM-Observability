# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Two processes must run simultaneously:

**Frontend (Vite, port 3000):**
```bash
npm run dev
```

**Backend (Flask, port 5001):**
```bash
cd server && bash start.sh
```
`start.sh` creates a Python venv under `server/venv/`, sources `.env` from the project root (so all keys are available to Flask), installs `requirements.txt`, and starts Flask. The backend is required for Mistral chat, ElevenLabs STT, and W&B tracing — the UI shell loads without it but chat will not work.

**Build for production:**
```bash
npm run build
```

## Environment Variables

All keys live in `.env` at the project root. `start.sh` sources this file automatically for the Flask process.

```
VITE_GEMINI_API_KEY=...       # Legacy — not used by current stack
ELEVENLABS_API_KEY=...        # ElevenLabs STT (scribe_v1 model)
MISTRAL_API_KEY=...           # Mistral LLM (mistral-large-latest)
WANDB_API_KEY=...             # W&B authentication
WANDB_ENTITY=...              # W&B username/org (e.g. mansimorepatil387-student-org)
WANDB_PROJECT=mistral-hackathon  # W&B project name
```

Frontend env vars must be prefixed `VITE_` to be accessible in the browser. Backend vars are plain (no `VITE_` prefix) and are only read server-side by Flask.

## Architecture

```
React Frontend (port 3000)
  ├── mistralService.ts  ──► POST /api/chat       ─┐
  ├── wbService.ts       ──► GET  /api/wb-url      │
  │                          POST /api/log-demo    ├─► Vite proxy → Flask (port 5001)
  │                          POST /api/transcribe  │
  └────────────────────────────────────────────────┘
                                    │
                Flask (port 5001) ──┤
                  ├── Mistral API   │  (LLM — mistral-large-latest)
                  ├── W&B Weave     │  (auto-tracing via @weave.op())
                  └── ElevenLabs    │  (STT — scribe_v1 model)
```

Vite proxies all `/api/*` requests to `http://localhost:5001` (configured in `vite.config.ts`). All LLM calls are made server-side — no API keys are exposed to the browser.

## Frontend

- **`App.tsx`** — orchestrates chat state, mic recording state, demo system, and session ID (`SESSION_ID` is a per-tab UUID generated at module load). Renders the W&B tracing bar, "Log Demo" dropdown, mic button, message list, and input form.
- **`services/mistralService.ts`** — maintains a **client-side conversation history array**. `initializeChat()` resets history. `sendMessage(text, sessionId)` pushes the user message, POSTs the full history to `/api/chat`, appends the assistant reply, and returns the text.
- **`services/wbService.ts`** — `fetchWbUrl()` gets the W&B Weave trace URL from the backend. `logDemoToWb()` triggers pre-configured demo logging. `transcribeAudio(blob)` POSTs a recorded audio blob to `/api/transcribe` and returns the transcript string.
- **`constants.ts`** — contains `SYSTEM_INSTRUCTION` (full banking knowledge base) and `QUICK_ACTIONS`. The system instruction is also duplicated in `server/app.py` as `SYSTEM_INSTRUCTION` — keep them in sync if the banking policy changes.
- **`components/MessageBubble.tsx`** — renders chat bubbles with demo type badges.
- **`components/Sidebar.tsx`** — quick action buttons and support info.

## Backend (`server/app.py`)

Flask app. On startup: logs in to W&B (`wandb.login`), calls `weave.init(WANDB_PROJECT)`, and creates the Mistral client.

| Endpoint | Purpose |
|---|---|
| `POST /api/chat` | Calls Mistral with full conversation history + system instruction. Auto-traced by `@weave.op()`. |
| `POST /api/transcribe` | Forwards audio file to ElevenLabs `/v1/speech-to-text` (field: `file`, model: `scribe_v1`). Returns `{ text }`. |
| `GET /api/wb-url` | Returns `https://wandb.ai/{ENTITY}/{PROJECT}/weave/calls` for the "View traces on W&B" link. |
| `POST /api/log-demo` | Looks up a pre-configured demo from `config.yaml`, returns turns immediately, logs to W&B Weave in a **background thread** via `log_demo_trace()`. |
| `GET /api/health` | Reports Mistral/Weave/ElevenLabs status + demo counts. |

The two weave-traced functions are defined with `weave.op()` applied conditionally (wraps `_mistral_chat` and `_log_demo_turn`). If `WEAVE_ENABLED = False` (keys missing), the raw functions are used instead, so the app still works without W&B.

## Demo Scenarios

All 8 demo scenarios are in **`config.yaml`** under four keys: `demo_hallucinations`, `demo_pii_issues`, `demo_prompt_injection`, `demo_input_pii`. Each scenario has `turns` (pre-written bad Q&A pairs shown in the UI) and `context` (the correct policy documents sent to W&B as the ground truth input). The deliberate mismatch between the correct context and the wrong answer is what surfaces low quality scores in W&B Weave.

## Mic / ElevenLabs STT Flow

1. User clicks mic button → `MediaRecorder` captures audio as `audio/webm`
2. User clicks again to stop → `onstop` fires, sends blob to `/api/transcribe`
3. Flask forwards the blob to `https://api.elevenlabs.io/v1/speech-to-text` with `xi-api-key` header
4. Transcript fills the input box; user hits Send normally

## Key Types

- `Message` (in `types.ts`) — includes `demoTag` field (`'hallucination' | 'pii' | 'prompt_injection' | 'input_pii'`) to badge demo messages in the UI.
- `DemoType` (in `wbService.ts`) — same four values, exported for `App.tsx`.
