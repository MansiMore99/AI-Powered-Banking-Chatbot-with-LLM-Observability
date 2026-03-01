/**
 * Mistral Chat Service
 * Maintains conversation history client-side and sends it to the
 * Flask backend (/api/chat) which calls Mistral + logs to W&B Weave.
 */

type Role = 'user' | 'assistant';

interface ChatMessage {
  role: Role;
  content: string;
}

let conversationHistory: ChatMessage[] = [];

export const initializeChat = () => {
  conversationHistory = [];
};

export const sendMessage = async (message: string, sessionId?: string): Promise<string> => {
  conversationHistory.push({ role: 'user', content: message });

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: conversationHistory,
      session_id: sessionId,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Chat request failed');
  }

  conversationHistory.push({ role: 'assistant', content: data.text });
  return data.text;
};

export const isChatInitialized = () => true;
