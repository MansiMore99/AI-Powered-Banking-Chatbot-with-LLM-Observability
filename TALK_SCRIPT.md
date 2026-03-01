# 🎤 2-Minute Demo Talk Script — Bank Assistant

---

## ⏱️ Minute 1: The Story + Why It Matters

A developer ships an AI chatbot. Everyone's happy. Two weeks later — a customer asks *"Can I cancel my wire transfer?"* The bot says *"Yes, you have a 2-hour window, completely free."* That's wrong. Wire transfers can't be cancelled. And the company had no idea it was happening — no logs, no alerts, nothing.

That's the problem right now. Teams are shipping AI into banking, healthcare, legal — and flying completely blind. We don't know when it hallucinates, when it leaks private data, or when someone tricks it with a bad prompt.

So I built **Bank Assistant** — a working AI banking chatbot, but with one key difference: every single response is tracked, traced, and evaluated in real time using **Mistral** for the LLM, **ElevenLabs** for voice, and **W&B Weave** for observability.

---

## ⏱️ Minute 2: The Demo

**[Open the app]**

Users can type or speak — watch this.

**[Click mic → say: "What's the daily ACH transfer limit?"]**

ElevenLabs transcribed that in real time. Mistral answered correctly — $10,000 per day.

**[Click "Log Demo" → "Hallucination: ACH Transfer Limits"]**

Now I've triggered a demo scenario — the AI claims the limit is $25,000. Totally made up.

**[Click "View Traces on W&B"]**

Here's the W&B Weave dashboard. Every call, every token, every response. Look at that trace — correct policy on the left, wrong AI answer on the right. W&B automatically scores it and flags it as low quality. Hallucination, caught.

We have 8 demo scenarios like this — hallucinations, PII leaks, prompt injection, input PII. All scored automatically.

This is what responsible AI looks like — not just building the chatbot, but **watching it**.

---

## ⚡ 10-second one-liner

> "A banking chatbot using Mistral, ElevenLabs, and W&B Weave — it doesn't just answer questions, it catches itself when it gets things wrong."
