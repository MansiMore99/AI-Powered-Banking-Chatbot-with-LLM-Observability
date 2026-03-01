export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  demoTag?: 'hallucination' | 'pii' | 'prompt_injection' | 'input_pii';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}
