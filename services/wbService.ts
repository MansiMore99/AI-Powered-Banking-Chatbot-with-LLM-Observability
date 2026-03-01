/**
 * W&B + ElevenLabs Service
 * - Fetches W&B Weave trace URL for the "View traces" link
 * - Logs demo scenarios to W&B via the backend
 * - Transcribes audio via ElevenLabs STT
 */

const API_BASE = '/api';

export const fetchWbUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE}/wb-url`);
    const data = await response.json();
    return data.url || null;
  } catch {
    return null;
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

export const logDemoToWb = async (
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
    console.warn('Backend not running. Start: cd server && bash start.sh');
    return { success: false };
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Transcription failed');
  }
  return data.text;
};
