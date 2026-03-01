import React from 'react';
import { Message } from '../types';
import { User, Bot, AlertTriangle, ShieldAlert, Siren, UserX } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Simple markdown parser for bold text and bullet points
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        return (
          <li key={i} className="ml-4 list-disc my-1">
            {parseBold(content)}
          </li>
        );
      }
      // Handle paragraphs
      return <p key={i} className="min-h-[1rem] mb-1">{parseBold(line)}</p>;
    });
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const DEMO_STYLES: Record<string, { bubble: string; border: string; textColor: string; mutedColor: string; label: string; icon: React.ReactNode }> = {
    hallucination: {
      bubble:     'bg-amber-50 text-slate-800 border-2 border-amber-200',
      border:     'border-amber-200',
      textColor:  'text-amber-600',
      mutedColor: 'text-amber-400',
      label:      'Hallucination Demo',
      icon:       <AlertTriangle size={12} className="text-amber-500" />,
    },
    pii: {
      bubble:     'bg-red-50 text-slate-800 border-2 border-red-200',
      border:     'border-red-200',
      textColor:  'text-red-500',
      mutedColor: 'text-red-400',
      label:      'PII Leak Demo',
      icon:       <ShieldAlert size={12} className="text-red-500" />,
    },
    prompt_injection: {
      bubble:     'bg-violet-50 text-slate-800 border-2 border-violet-200',
      border:     'border-violet-200',
      textColor:  'text-violet-600',
      mutedColor: 'text-violet-400',
      label:      'Prompt Injection Demo',
      icon:       <Siren size={12} className="text-violet-500" />,
    },
    input_pii: {
      bubble:     'bg-orange-50 text-slate-800 border-2 border-orange-200',
      border:     'border-orange-200',
      textColor:  'text-orange-600',
      mutedColor: 'text-orange-400',
      label:      'Input PII Demo',
      icon:       <UserX size={12} className="text-orange-500" />,
    },
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div 
          className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isUser 
              ? 'bg-brand-600 text-white rounded-tr-none' 
              : message.demoTag
                ? DEMO_STYLES[message.demoTag].bubble + ' rounded-tl-none'
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
          }`}
        >
          {/* Demo badge for bot messages */}
          {!isUser && message.demoTag && (
            <div className={`flex items-center gap-1.5 mb-2 pb-2 border-b ${DEMO_STYLES[message.demoTag].border}`}>
              {DEMO_STYLES[message.demoTag].icon}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${DEMO_STYLES[message.demoTag].textColor}`}>
                {DEMO_STYLES[message.demoTag].label}
              </span>
              <span className={`text-[9px] ml-auto ${DEMO_STYLES[message.demoTag].mutedColor}`}>
                Logged to Galileo
              </span>
            </div>
          )}
          <div className={isUser ? 'text-white' : 'text-slate-800'}>
            {formatText(message.text)}
          </div>
          {message.isStreaming && (
             <div className="flex space-x-1 mt-2 h-2 items-center">
               <div className="w-1.5 h-1.5 bg-current rounded-full typing-dot opacity-70"></div>
               <div className="w-1.5 h-1.5 bg-current rounded-full typing-dot opacity-70"></div>
               <div className="w-1.5 h-1.5 bg-current rounded-full typing-dot opacity-70"></div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
