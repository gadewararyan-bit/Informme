import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { chatWithAIStream } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const AIChat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isPremium = user?.isPremium || false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    // Placeholder for AI streaming message
    const aiPlaceholder: Message = {
      role: 'model',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      const chatHistory = messages.filter(m => !m.isStreaming).map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: currentInput });

      await chatWithAIStream(
        chatHistory,
        (fullText) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'model') {
              lastMsg.content = fullText;
            }
            return newMessages;
          });
          setIsLoading(false); // Stop loading pulse as soon as first chunk arrives
        },
        user?.language || 'en',
        isPremium
      );
      
      // Mark streaming as finished
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg) lastMsg.isStreaming = false;
        return newMessages;
      });

    } catch (error: any) {
      console.error('Chat Error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'model') {
          lastMsg.content = error.message || "Connection lost. Please try again.";
          lastMsg.isStreaming = false;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#F8F9FA] flex flex-col pb-20 overflow-hidden relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-6 shrink-0 z-10 pro-shadow">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center pro-shadow ring-4 ring-gray-900/10">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-tighter italic text-gray-900">AI Oracle</h1>
                <span className="bg-indigo-50 text-indigo-600 border-indigo-100 px-2 py-0.5 rounded-full tracking-widest uppercase border text-[9px] font-black">
                  GEMINI ACTIVE
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                Powered by Gemini 3.1 Neural Core
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">System Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
            <Sparkles className="w-16 h-16 text-indigo-600 mb-6" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 mb-2">How can I assist?</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Ask anything to begin session</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[90%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center pro-shadow transition-transform hover:scale-110
                  ${message.role === 'user' ? 'bg-gray-900' : 'bg-indigo-600'}`}
                >
                  {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                <div className={`p-6 rounded-[32px] pro-shadow relative
                  ${message.role === 'user' 
                    ? 'bg-white text-gray-900 rounded-tr-none border border-gray-100' 
                    : 'bg-white rounded-tl-none border border-indigo-100 ring-4 ring-indigo-50/30'}`}
                >
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-gray-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-strong:text-indigo-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded whitespace-pre-wrap">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="text-[8px] text-gray-300 uppercase font-black tracking-widest">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.role === 'model' && (
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center pro-shadow animate-pulse">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="bg-white px-6 py-4 rounded-full border border-indigo-100 pro-shadow">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-20 p-6 bg-transparent w-full max-w-4xl mx-auto z-10">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-white border border-gray-100 p-6 rounded-[32px] font-bold text-sm pr-20 pro-shadow focus:outline-none focus:ring-4 focus:ring-indigo-600/5 placeholder:text-gray-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 pro-shadow"
          >
            <Send className="w-5 h-5 translate-x-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
