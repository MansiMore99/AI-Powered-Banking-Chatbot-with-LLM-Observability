import { GoogleGenAI, Chat } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

let chatSession: Chat | null = null;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const initializeChat = () => {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is missing in .env file.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
    },
  });

  return chatSession;
};

// Non-streaming version for reliability
export const sendMessage = async (message: string): Promise<string> => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session.");
  }

  const response = await chatSession.sendMessage({ message });
  return response.text ?? 'No response received.';
};

// Streaming version
export const sendMessageStream = async (message: string) => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session.");
  }

  const result = await chatSession.sendMessageStream({ message });
  return result;
};

export const isChatInitialized = () => chatSession !== null;
