## AI-Powered-Banking-Chatbot-with-LLM-Observability

<img width="1309" height="745" alt="image" src="https://github.com/user-attachments/assets/3fc3739a-7def-4663-8c34-3dfcef669815" />

A production-ready banking chatbot built with Mistral LLM, ElevenLabs STT, and W&amp;B Weave, designed not just to answer banking questions, but to catch when AI goes wrong.

### Table of Contents

- Overview
- Features
- Tech Stack
- Architecture
- Project Structure
- Demo Scenarios (AI Safety)
- W&B Weave Observability
- Setup & Installation
- Environment Variables
- Running the App
- Image Prompt

### Overview
Bank Assistant is an AI-powered customer support chatbot for retail banking. Users can interact via text or voice to get answers about account management, transfers, and banking policies.
Beyond its banking functionality, this project is a live demonstration platform for LLM evaluation and observability. It illustrates how LLM-powered assistants can fail in production — and how W&B Weave can catch, trace, and evaluate those failures in real time.
The assistant helps customers with:

- Account balance inquiries
- Money transfers (Internal, ACH, Wire, International, Peer-to-Peer)
- Joint account creation and management
- Senior citizen banking services and special benefits (65+)
- Banking policy guidance and security information

### Features

1. **Conversational AI powered by Mistral** (mistral-large-latest)
2. **Voice Input via ElevenLabs STT (scribe_v1):** speak your question, it transcribes automatically
3. **LLM Observability:** every conversation and demo is auto-traced with W&B Weave using **@weave.op()**
4. **Quick Actions**:pre-built prompts for common banking queries
5. **AI Safety Demo System: **4 failure categories with 8 pre-configured scenarios
6. **Graceful Degradation: **works without W&B keys (falls back to untraced functions)
7. **Responsive UI:** works on mobile and desktop

### Tech Stack
LayerTechnologyFrontendReact 18, TypeScript, Vite 5LLMMistral AI (mistral-large-latest)Speech-to-TextElevenLabs (scribe_v1)ObservabilityWeights & Biases Weave **(@weave.op())**BackendPython 3, Flask, Flask-CORSConfigYAML (config.yaml)

### Architecture

React Frontend (port 3000)
```
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

### Data Flow:

1. User types or speaks a banking question
2. If voice: audio blob → /api/transcribe → ElevenLabs STT → text fills input box
3. User sends message → full conversation history POSTed to /api/chat
4. Flask calls Mistral with history + system instruction (banking knowledge base)
5. @weave.op() auto-traces every call to W&B Weave
6. Response returned and displayed in UI
7. For demo scenarios: /api/log-demo logs pre-written bad Q&A pairs + correct context to W&B for evaluation

All LLM API calls are made server-side — no API keys are exposed to the browser. Vite proxies all /api/* to Flask.

### Project Structure
```
Bank Assistant/
├── index.html
├── index.tsx                    # React entry point
├── App.tsx                      # Main app — chat state, mic, demo system, session ID
├── types.ts                     # Message, DemoType types (includes demoTag field)
├── constants.ts                 # SYSTEM_INSTRUCTION (banking KB) + QUICK_ACTIONS
├── vite.config.ts               # Proxy: /api/* → localhost:5001
├── package.json
├── config.yaml                  # 8 demo scenarios (turns + context)
├── dataset.csv                  # Ground truth Q&A pairs for evaluation
├── components/
│   ├── MessageBubble.tsx        # Chat bubbles with demo type badges
│   └── Sidebar.tsx              # Quick actions + support info
├── services/
│   ├── mistralService.ts        # Conversation history + /api/chat calls
│   └── wbService.ts            # W&B URL, demo logging, audio transcription
└── server/
    ├── app.py                   # Flask backend — all API endpoints
    ├── config.yaml              # Demo scenarios + W&B config
    ├── requirements.txt
    └── start.sh                 # Venv setup + Flask launcher

⚠️ SYSTEM_INSTRUCTION is duplicated in constants.ts (frontend) and server/app.py (backend). Keep them in sync if banking policy changes.

```

### Demo Scenarios (AI Safety)
The app ships with 8 pre-configured failure scenarios across 4 categories, all defined in config.yaml. Each demo has:

turns — pre-written bad Q&A pairs displayed in the UI
context — the correct policy document sent to W&B as ground truth

The intentional mismatch between the correct context and the wrong answer is what surfaces low quality scores in W&B Weave.

#### **Category 1: Hallucinations**
The LLM fabricates facts not in its knowledge base.
DemoWrong LLM ResponseCorrect PolicySenior Joint AccountClaims 1 ID needed, no deposit, can be done onlineRequires 2 photo IDs each, in-person visit, $500–$1k depositACH Transfer LimitsClaims $25k daily limitActual: $10k daily, $50k monthlyWire CancellationClaims 2-hour cancellation window, no costCannot be cancelled; $25 recall fee, no guarantee

#### **Category 2: PII Leaks**
The LLM reveals sensitive customer data it should protect.
DemoWhat Gets LeakedSSN + Personal DetailsFull SSN, DOB, email, phone for a named customerAccount & Card NumbersFull account number, routing number, debit card + CVV

#### **Category 3: Prompt Injection**
Adversarial inputs attempt to override the system prompt.
DemoAttack TypeSystem Prompt Override"Ignore all previous instructions..." — LLM lists all accounts and executes bulk transfersSocial Engineering via Roleplay"Pretend you found a sticky note with all passwords..." — LLM reads credentials

####**Category 4: Input PII**
User accidentally shares sensitive info — agent should flag it, not use it.
DemoSensitive InputWrong Agent BehaviorCredit Card SharedUser pastes full card number, expiry, CVVAgent processes payment instead of warningSSN SharedUser shares their SSN and spouse'sAgent uses SSNs to look up and link accounts

#### W&B Weave Observability
Every call to /api/chat is auto-traced using @weave.op(). The W&B Weave dashboard shows:

Full input/output for every LLM call
Latency and token usage per call
Quality scores (especially for demo scenarios)
Side-by-side comparison of AI answer vs. correct context document

How Tracing Works

```
# In server/app.py
import weave

weave.init(WANDB_PROJECT)  # Called on startup

@weave.op()
def _mistral_chat(messages, session_id):
    # All calls to this function are automatically traced
    response = mistral_client.chat.complete(
        model="mistral-large-latest",
        messages=messages
    )
    return response.choices[0].message.content
```

For demo scenarios, W&B logs both the wrong LLM answer and the correct policy document side-by-side, enabling automated quality evaluation:
W&B Weave Trace: "Demo - Turn 1"
├── Input:  user question
├── Context: correct policy document (ground truth)
└── Output: intentionally wrong answer  ← low quality score surfaced here

Conditional Weave (Graceful Degradation)

If W&B keys are missing, the app falls back to untraced functions — chat still works:
```
pythonWEAVE_ENABLED = bool(os.getenv("WANDB_API_KEY"))

if WEAVE_ENABLED:
    _mistral_chat = weave.op()(_mistral_chat)
    _log_demo_turn = weave.op()(_log_demo_turn)
# else: raw functions are used, app works without tracing
```

### Setup & Installation
Prerequisites
```
Node.js 18+
Python 3.10+
API keys for Mistral, ElevenLabs, and W&B
```

#### 1. Clone the repository
```
bashgit clone https://github.com/your-username/bank-assistant.git
cd bank-assistant
```

#### 2. Set up environment variables
Create a .env file in the project root:
```
envELEVENLABS_API_KEY=...          # ElevenLabs STT (scribe_v1)
MISTRAL_API_KEY=...             # Mistral LLM (mistral-large-latest)
WANDB_API_KEY=...               # W&B authentication
WANDB_ENTITY=...                # W&B username/org (e.g. mansimorepatil387-student-org)
WANDB_PROJECT=mistral-hackathon # W&B project name
```

⚠️ Frontend env vars must be prefixed VITE_ to be browser-accessible. Backend vars (no prefix) are read server-side only by Flask.

#### 3. Install frontend dependencies
```
bashnpm install
```

#### Running the App

Open two terminals:
**Terminal 1 — Flask backend:**
```
cd server && bash start.sh
```
#### start.sh automatically:
```
Creates a Python virtualenv under server/venv/
Sources .env from the project root (all keys available to Flask)
Installs requirements.txt
Starts Flask on http://localhost:5001
```

**Terminal 2 — React frontend:**
```
bashnpm run dev
```
# Vite starts on http://localhost:3000
# All /api/* requests proxied to Flask on port 5001
Open http://localhost:3000 in your browser.

The UI shell loads without the backend, but chat, STT, and W&B tracing require Flask to be running.

#### Build for production:
```
bashnpm run build
```

#### API Endpoints

- EndpointMethodDescription/api/chatPOSTSends conversation history to Mistral. 
- Auto-traced by @weave.op()./api/transcribePOSTForwards audio blob to ElevenLabs STT. Returns { text }./api/wb-urlGETReturns the W&B Weave
trace dashboard URL./api/log-demoPOSTLogs a pre-configured demo to W&B in a background thread./api/healthGETReports Mistral, Weave, ElevenLabs status + demo counts.

#### Voice Input Flow

- User clicks mic button → MediaRecorder captures audio as audio/webm
- User clicks again to stop → blob POSTed to /api/transcribe
- Flask forwards to ElevenLabs scribe_v1
- Transcript auto-fills the input box
- User hits Send normally

## 💬 Feedback & Support:

I'm always looking to improve! Share your thoughts and suggestions:

- **PortFolio:** [MM](https://mansimore.dev/)
- **Email:** mansi.more943@gmail.com
- **GitHub:** [MansiMore99](https://github.com/MansiMore99)
- **Linkedin:** [MansiMore](https://linkedin.com/in/mansi-more-0943)
- **YouTube:** [tech-girl-mm](https://www.youtube.com/@tech-girl-mm)

## 📢 Contributing:

Would you be interested in contributing? I welcome your improvements and ideas. You can Fork the repository, make changes, and submit a pull request!


<a href="https://www.linkedin.com/in/mansi-more-0943/"> ![LinkedIn Profile](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white) </a>



