import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, X, BarChart3, ExternalLink, AlertTriangle, ShieldAlert, ChevronDown, Siren, UserX, Mic, MicOff } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { Message } from './types';
import { INITIAL_MESSAGE, QUICK_ACTIONS } from './constants';
import { sendMessage, initializeChat } from './services/mistralService';
import { fetchWbUrl, logDemoToWb, transcribeAudio, DemoType } from './services/wbService';

// Generate a unique session ID for this browser session
const SESSION_ID = `securebank-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wbUrl, setWbUrl] = useState<string | null>(null);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat and Galileo on mount
  useEffect(() => {
    try {
      initializeChat();
      setMessages([
        {
          id: 'init',
          role: 'model',
          text: INITIAL_MESSAGE,
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      console.error("Failed to init chat", e);
    }

    // Fetch W&B Weave trace URL for the header link
    fetchWbUrl().then((url) => {
      if (url) setWbUrl(url);
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Create placeholder for bot response
    const botMessageId = (Date.now() + 1).toString();
    const botMessagePlaceholder: Message = {
      id: botMessageId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, botMessagePlaceholder]);

    const startTime = Date.now();

    try {
      const responseText = await sendMessage(text, SESSION_ID);
      const durationMs = Date.now() - startTime;
      console.debug(`Response in ${durationMs}ms`);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, text: responseText, isStreaming: false }
            : msg
        )
      );

    } catch (error: any) {
      console.error("Error in chat:", error);
      const errorMsg = error?.message || error?.toString() || "Unknown error";
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === botMessageId 
            ? { ...msg, text: `Error: ${errorMsg}`, isStreaming: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      if (window.innerWidth > 768) {
        inputRef.current?.focus();
      }
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const transcript = await transcribeAudio(audioBlob);
          if (transcript.trim()) setInputValue(transcript.trim());
        } catch (err) {
          console.error('Transcription failed:', err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogDemo = async (demoType: DemoType, index: number = 0) => {
    setShowDemoMenu(false);
    setDemoStatus('logging');
    const result = await logDemoToWb(demoType, index, SESSION_ID);

    if (result.success && result.turns && result.turns.length > 0) {
      // Inject all conversation turns into the chat UI
      const newMessages: Message[] = [];
      result.turns.forEach((turn, i) => {
        const ts = Date.now() + i * 2;
        newMessages.push({
          id: `demo-q-${ts}`,
          role: 'user',
          text: turn.question,
          timestamp: new Date(),
          demoTag: demoType,
        });
        newMessages.push({
          id: `demo-a-${ts + 1}`,
          role: 'model',
          text: turn.answer,
          timestamp: new Date(),
          demoTag: demoType,
        });
      });
      setMessages((prev) => [...prev, ...newMessages]);
      setDemoStatus('success');
    } else {
      setDemoStatus('error');
    }
    setTimeout(() => setDemoStatus(null), 3000);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar actions={QUICK_ACTIONS} onActionClick={handleQuickAction} />
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
              <Menu size={24} />
            </button>
            <span className="font-bold text-brand-700">SecureBank</span>
          </div>
        </div>

        {/* W&B Tracing Bar */}
        <div className="bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 border-b border-orange-100 px-4 py-2.5 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            {/* Left: W&B link */}
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">W&B Tracing</span>
              {wbUrl && (
                <a
                  href={wbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-xs text-orange-500 hover:text-orange-800 underline underline-offset-2 flex items-center gap-1 transition-colors"
                >
                  View traces on W&B <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Right: Demo buttons */}
            <div className="relative flex items-center gap-2">
              {demoStatus === 'success' && (
                <span className="text-[10px] text-emerald-600 font-medium animate-pulse">Logged to Galileo!</span>
              )}
              {demoStatus === 'error' && (
                <span className="text-[10px] text-red-500 font-medium">Failed - start backend</span>
              )}
              {demoStatus === 'logging' && (
                <span className="text-[10px] text-indigo-500 font-medium animate-pulse">Logging...</span>
              )}
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1 text-[11px] font-semibold bg-white text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
              >
                Log Demo <ChevronDown size={12} />
              </button>

              {/* Demo dropdown */}
              {showDemoMenu && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 max-h-[70vh] overflow-y-auto">
                  <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hallucination Demos</p>
                  <button onClick={() => handleLogDemo('hallucination', 0)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                    Senior Joint Account (wrong docs)
                  </button>
                  <button onClick={() => handleLogDemo('hallucination', 1)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                    ACH Limits (wrong amounts)
                  </button>
                  <button onClick={() => handleLogDemo('hallucination', 2)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                    Wire Cancellation (wrong policy)
                  </button>

                  <div className="border-t border-slate-100 my-1" />
                  <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">PII Leak Demos</p>
                  <button onClick={() => handleLogDemo('pii', 0)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-red-50 flex items-center gap-2">
                    <ShieldAlert size={13} className="text-red-500 flex-shrink-0" />
                    SSN + Personal Details Leaked
                  </button>
                  <button onClick={() => handleLogDemo('pii', 1)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-red-50 flex items-center gap-2">
                    <ShieldAlert size={13} className="text-red-500 flex-shrink-0" />
                    Account + Card Number Leaked
                  </button>

                  <div className="border-t border-slate-100 my-1" />
                  <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Prompt Injection Demos</p>
                  <button onClick={() => handleLogDemo('prompt_injection', 0)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-violet-50 flex items-center gap-2">
                    <Siren size={13} className="text-violet-500 flex-shrink-0" />
                    System Prompt Override Attack
                  </button>
                  <button onClick={() => handleLogDemo('prompt_injection', 1)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-violet-50 flex items-center gap-2">
                    <Siren size={13} className="text-violet-500 flex-shrink-0" />
                    Social Engineering via Roleplay
                  </button>

                  <div className="border-t border-slate-100 my-1" />
                  <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Input PII Demos</p>
                  <button onClick={() => handleLogDemo('input_pii', 0)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-orange-50 flex items-center gap-2">
                    <UserX size={13} className="text-orange-500 flex-shrink-0" />
                    User Shares Credit Card (no warning)
                  </button>
                  <button onClick={() => handleLogDemo('input_pii', 1)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-orange-50 flex items-center gap-2">
                    <UserX size={13} className="text-orange-500 flex-shrink-0" />
                    User Shares SSN (agent processes it)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto relative">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="relative flex items-center"
            >
              <input
                ref={inputRef}
                type="text"
                value={isTranscribing ? 'Transcribing...' : inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type or speak your message..."
                className="w-full pl-4 pr-24 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-700 placeholder-slate-400 shadow-sm transition-all"
                disabled={isLoading || isTranscribing}
              />
              {/* Mic button */}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading || isTranscribing}
                title={isRecording ? 'Stop recording' : 'Speak your message'}
                className={`absolute right-12 p-2 rounded-lg transition-all duration-200 ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-md'
                    : isTranscribing
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              {/* Send button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading || isTranscribing}
                className={`absolute right-2 p-2 rounded-lg transition-all duration-200 ${
                  inputValue.trim() && !isLoading && !isTranscribing
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send size={20} />
              </button>
            </form>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              AI-generated responses. Verify critical details with a branch representative.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
