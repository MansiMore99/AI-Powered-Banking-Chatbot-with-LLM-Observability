/**
 * Galileo Service
 *
 * Provides:
 *  - Galileo console URL (from env var or backend API)
 *  - Live conversation logging (fire-and-forget)
 *  - Demo trace logging (hallucinations & PII issues)
 */

const API_BASE = '/api';

/**
 * Fetch the Galileo console URL.
 * Prefers the build-time env var; falls back to the backend API.
 */
export const fetchGalileoUrl = async (): Promise<string | null> => {
  const envUrl = import.meta.env.VITE_GALILEO_URL;
  if (envUrl) return envUrl;

  try {
    const response = await fetch(`${API_BASE}/galileo-url`);
    const data = await response.json();
    return data.url || null;
  } catch {
    console.warn('Galileo backend not reachable. Run: python3 "Bank Assistant/server/app.py"');
    return null;
  }
};

/**
 * Log a live conversation turn to Galileo (fire-and-forget).
 */
export const logConversationToGalileo = async (
  userMessage: string,
  botResponse: string,
  sessionId: string,
  durationMs: number = 0
): Promise<void> => {
  try {
    await fetch(`${API_BASE}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_message: userMessage,
        bot_response: botResponse,
        session_id: sessionId,
        duration_ms: durationMs,
      }),
    });
  } catch {
    // Fire-and-forget
  }
};

export type DemoType = 'hallucination' | 'pii' | 'prompt_injection' | 'input_pii';

export interface DemoTurn {
  question: string;
  answer: string;
}

export interface DemoResult {
  success: boolean;
  turns?: DemoTurn[];
  demoType?: DemoType;
}

/**
 * Log a pre-configured demo trace to Galileo.
 * Returns all conversation turns so the UI can display them in chat.
 */
export const logDemoToGalileo = async (
  demoType: DemoType,
  index: number = 0,
  sessionId?: string
): Promise<DemoResult> => {
  try {
    const response = await fetch(`${API_BASE}/log-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo_type: demoType, index, session_id: sessionId }),
    });
    const data = await response.json();
    return {
      success: data.success === true,
      turns: data.turns,
      demoType: data.demo_type,
    };
  } catch {
    console.warn('Backend not running. Start: python3 "Bank Assistant/server/app.py"');
    return { success: false };
  }
};
