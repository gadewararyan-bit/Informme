import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { chatWithAI } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `Hello! I am AI Informer, developed by Aryan. How can I help you today? You can ask me about local news, health tips, or anything else about India!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: userMessage.content });

      const response = await chatWithAI(chatHistory, user?.language || 'en');
      
      const aiMessage: Message = {
        role: 'model',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b-4 border-black p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 border-2 border-black rounded-xl brutalist-shadow">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter italic">AI Informer</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Powered by Gemini • Dev: Aryan</p>
            </div>
          </div>
          <div className="bg-purple-100 px-3 py-1 border-2 border-black rounded-full flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span className="text-[10px] font-black uppercase text-purple-600">Smart Assistant</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center brutalist-shadow
                  ${message.role === 'user' ? 'bg-blue-500' : 'bg-purple-500'}`}
                >
                  {message.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-4 rounded-2xl border-4 border-black font-bold text-sm leading-relaxed brutalist-shadow
                  ${message.role === 'user' ? 'bg-white' : 'bg-purple-50'}`}
                >
                  {message.content}
                  <div className="mt-2 text-[8px] text-gray-400 uppercase font-black">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center bg-purple-500 brutalist-shadow">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="p-4 rounded-2xl border-4 border-black bg-purple-50 font-black text-[10px] uppercase tracking-widest brutalist-shadow animate-pulse">
                Thinking...
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-20 p-4 sm:p-6 bg-transparent w-full max-w-4xl mx-auto z-10">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="w-full bg-white border-4 border-black p-5 rounded-3xl font-bold text-sm pr-16 brutalist-shadow focus:outline-none focus:ring-0 placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black text-white rounded-2xl border-2 border-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-3 flex justify-center gap-4">
          <button 
            type="button"
            onClick={() => setInput("What's the news in my area?")}
            className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-white border-2 border-black px-3 py-1 rounded-full hover:bg-gray-50 active:translate-y-0.5 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          >
            Local News
          </button>
          <button 
            type="button"
            onClick={() => setInput("Give me a health tip")}
            className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-white border-2 border-black px-3 py-1 rounded-full hover:bg-gray-50 active:translate-y-0.5 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          >
            Health Tips
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
