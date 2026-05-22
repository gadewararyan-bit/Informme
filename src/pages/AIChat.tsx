import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, HelpCircle, ChevronLeft } from 'lucide-react';
import { chatWithAIStream } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/common/LocationPicker';

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
      <header className="bg-white border-b border-gray-100 p-6 shrink-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-gray-100 sm:hidden">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#0A1128] text-white rounded-xl sm:rounded-2xl flex items-center justify-center pro-shadow">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black italic tracking-tighter text-[#0A1128]">INFORMME AI</h1>
                <span className="hidden sm:block bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full tracking-widest uppercase text-[10px] font-black border border-indigo-100">
                  AI READY
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 hidden sm:block">
                OFFICIAL AI ASSISTANT
              </p>
            </div>
          </div>
          <LocationPicker />
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-12 space-y-8 max-w-4xl mx-auto w-full scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <h2 className="text-6xl font-black italic uppercase tracking-tighter text-[#BCC1C8] mb-4">HOW CAN I HELP YOU?</h2>
            <p className="text-sm font-bold text-[#BCC1C8] uppercase tracking-[0.3em]">ASK ANY QUESTION TO START</p>
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
                <div className={`p-6 rounded-[32px] pro-shadow relative
                  ${message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white rounded-tl-none border border-gray-100'}`}
                >
                  <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter whitespace-pre-wrap ${message.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <div className={`mt-4 flex items-center justify-between border-t pt-3 ${message.role === 'user' ? 'border-white/10' : 'border-gray-50'}`}>
                    <span className={`text-[8px] uppercase font-black tracking-widest ${message.role === 'user' ? 'text-white/40' : 'text-gray-300'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
            <div className="bg-white px-6 py-4 rounded-full border border-gray-100 pro-shadow">
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-20 px-6 pb-12 pt-4 bg-transparent w-full max-w-4xl mx-auto z-10">
        <form onSubmit={handleSend} className="relative bg-white rounded-[40px] border border-gray-100 pro-shadow overflow-hidden p-2 flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent px-6 py-4 font-bold text-base focus:outline-none placeholder:text-gray-200 text-gray-900"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 pro-shadow"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
