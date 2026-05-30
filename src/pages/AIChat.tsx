import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, Sparkles, ChevronLeft, 
  MessageSquare, Plus, X, Search, MessageSquareCode, CheckCircle2,
  Gift, Copy, Share2, Coins, Check
} from 'lucide-react';
import { chatWithAIStream } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/common/LocationPicker';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, getDocs, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatDistanceToNow } from 'date-fns';

interface AIMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface FriendMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: any;
  participants: string[];
  read: boolean;
}

interface ChatSession {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
  participantDetails?: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
    };
  };
}

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  bio?: string;
  location?: {
    areaName: string;
  };
}

const AIChat: React.FC = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();

  // Active Top Tab: 'ai' or 'friends'
  const [activeTab, setActiveTab] = useState<'ai' | 'friends'>('ai');

  // --- AI Chat States ---
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  // --- Friends Chat States ---
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [friendMessages, setFriendMessages] = useState<FriendMessage[]>([]);
  const [friendInput, setFriendInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Contacts Modal States
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchContactQuery, setSearchContactQuery] = useState('');

  const friendEndRef = useRef<HTMLDivElement>(null);
  const isPremium = user?.isPremium || false;

  // Auto Scroll Helpers
  const scrollAiToBottom = () => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollFriendToBottom = () => {
    friendEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'ai') {
      scrollAiToBottom();
    }
  }, [aiMessages, activeTab]);

  useEffect(() => {
    if (activeTab === 'friends' && selectedChatId) {
      scrollFriendToBottom();
    }
  }, [friendMessages, selectedChatId, activeTab]);

  // --- Fetch Contacts List (On Demand when Friends Tab is opened) ---
  useEffect(() => {
    if (!user || activeTab !== 'friends') return;

    const fetchAllAppUsers = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        const list: UserProfile[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.uid && data.uid !== user.uid) {
            list.push({
              uid: data.uid,
              displayName: data.displayName || 'User Node',
              photoURL: data.photoURL || '',
              email: data.email || '',
              bio: data.bio || '',
              location: data.location || { areaName: '' }
            });
          }
        });
        setAllUsers(list);
      } catch (err) {
        console.error("Failed to load app users:", err);
      }
    };

    fetchAllAppUsers();
  }, [user, activeTab]);

  // --- Real-time User Conversations List (WhatsApp Style) ---
  useEffect(() => {
    if (!user || activeTab !== 'friends') return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeChats = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data
        } as ChatSession;
      });
      setChats(activeChats);
      setLoadingChats(false);
    }, (err) => {
      console.error("Failed to stream conversions list:", err);
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  // --- Real-time Conversation Message Listener ---
  useEffect(() => {
    if (!selectedChatId || activeTab !== 'friends') {
      setFriendMessages([]);
      return;
    }

    const q = query(
      collection(db, `chats/${selectedChatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as FriendMessage[];
      setFriendMessages(msgs);
    }, (err) => {
      console.error("Failed to stream chat messages:", err);
    });

    return () => unsubscribe();
  }, [selectedChatId, activeTab]);

  // --- AI Chat Logic ---
  const handleAISend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: aiInput.trim(),
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    const currentInput = aiInput.trim();
    setAiInput('');
    setIsAiLoading(true);

    const aiPlaceholder: AIMessage = {
      role: 'model',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setAiMessages(prev => [...prev, aiPlaceholder]);

    try {
      const chatHistory = aiMessages.filter(m => !m.isStreaming).map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: currentInput });

      await chatWithAIStream(
        chatHistory,
        (fullText) => {
          setAiMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === 'model') {
              lastMsg.content = fullText;
            }
            return newMessages;
          });
          setIsAiLoading(false);
        },
        user?.language || 'en',
        isPremium
      );
      
      setAiMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg) lastMsg.isStreaming = false;
        return newMessages;
      });

    } catch (error: any) {
      console.error('AI Stream Error:', error);
      setAiMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'model') {
          lastMsg.content = error.message || "Connection lost. Please try again.";
          lastMsg.isStreaming = false;
        }
        return newMessages;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Friend Chat Messaging Helpers & Submission ---
  const handleSendFriendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendInput.trim() || !selectedChatId || !user) return;

    const currentChat = chats.find(c => c.id === selectedChatId);
    if (!currentChat) return;

    const recipientId = currentChat.participants.find(p => p !== user.uid);
    if (!recipientId) return;

    const messageText = friendInput.trim();
    setFriendInput('');

    try {
      // Must post standard participants, senderId pattern so firestore.rules validates it smoothly
      await addDoc(collection(db, `chats/${selectedChatId}/messages`), {
        senderId: user.uid,
        content: messageText,
        createdAt: serverTimestamp(),
        participants: [user.uid, recipientId],
        read: false
      });
      
      // Update local storage/visual details if possible
    } catch (err) {
      console.error("Message transmission failed:", err);
    }
  };

  // --- Dynamic Chat Contact Resolver (Fallback Aware) ---
  const getRecipientDetails = (chat: ChatSession) => {
    const friendId = chat.participants.find(id => id !== user?.uid);
    if (!friendId) return { displayName: 'Secure Peer', photoURL: '' };

    if (chat.participantDetails && chat.participantDetails[friendId]) {
      return {
        displayName: chat.participantDetails[friendId].displayName,
        photoURL: chat.participantDetails[friendId].photoURL || ''
      };
    }

    const matchedUser = allUsers.find(u => u.uid === friendId);
    if (matchedUser) {
      return {
        displayName: matchedUser.displayName,
        photoURL: matchedUser.photoURL || ''
      };
    }

    return {
      displayName: `User (${friendId.substring(0, 6)})`,
      photoURL: ''
    };
  };

  // --- Initiate WhatsApp style Friend Chat ---
  const startUserChat = async (targetContact: UserProfile) => {
    setIsNewChatModalOpen(false);
    if (!user) return;

    // Check if chat session already exists between this pair
    const oldSession = chats.find(c => 
      c.participants.includes(user.uid) && c.participants.includes(targetContact.uid)
    );

    if (oldSession) {
      setSelectedChatId(oldSession.id);
      return;
    }

    // Provision a clean new peer-to-peer session
    try {
      const sessionData = {
        participants: [user.uid, targetContact.uid],
        participantDetails: {
          [user.uid]: {
            displayName: user.displayName || 'Me',
            photoURL: user.photoURL || ''
          },
          [targetContact.uid]: {
            displayName: targetContact.displayName,
            photoURL: targetContact.photoURL || ''
          }
        },
        updatedAt: serverTimestamp(),
        lastMessage: 'Conversation opened'
      };

      const docRef = await addDoc(collection(db, 'chats'), sessionData);
      setSelectedChatId(docRef.id);
    } catch (err) {
      console.error("Error provisioning chat session:", err);
    }
  };

  // Utilities for rendering formatting
  const formatMsgRelativeTime = (timeData: any) => {
    if (!timeData) return '';
    try {
      const date = timeData.toDate ? timeData.toDate() : new Date(timeData);
      return formatDistanceToNow(date, { addSuffix: false });
    } catch {
      return '';
    }
  };

  // Searches/Filters
  const filteredChats = chats.filter(chat => {
    const details = getRecipientDetails(chat);
    return details.displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredUsers = allUsers.filter(u => 
    u.displayName.toLowerCase().includes(searchContactQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchContactQuery.toLowerCase())
  );

  const selectedChatDetails = selectedChatId ? getRecipientDetails(chats.find(c => c.id === selectedChatId)!) : null;

  return (
    <div className="h-[100dvh] bg-[#F8F9FA] flex flex-col pb-20 overflow-hidden relative font-sans">
      {/* Primary Header */}
      <header className="bg-white border-b border-gray-100 p-6 shrink-0 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-gray-100 sm:hidden">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0A1128] text-white rounded-xl flex items-center justify-center shadow-lg">
              {activeTab === 'ai' ? <Bot className="w-5 h-5 sm:w-6 sm:h-6" /> : <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black italic tracking-tighter text-[#0A1128] uppercase">
                  {activeTab === 'ai' ? 'INFORMME AI' : 'INFORMME CHAT'}
                </h1>
                <span className={`bg-indigo-50 px-2 py-0.5 rounded-full tracking-widest uppercase text-[8px] font-black border ${activeTab === 'ai' ? 'text-indigo-600 border-indigo-100' : 'text-emerald-600 border-emerald-100'}`}>
                  {activeTab === 'ai' ? 'AI READY' : 'P2P ENABLED'}
                </span>
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 hidden sm:block">
                {activeTab === 'ai' ? 'OFFICIAL SYSTEM AI CONCIERGE' : 'REAL-TIME LOCAL MESSAGING NETWORK'}
              </p>
            </div>
          </div>
          <LocationPicker />
        </div>
      </header>

      {/* Main Mode Swapper / Switch Tabs */}
      <div className="bg-white border-b border-gray-100 p-2 shrink-0 z-10">
        <div className="flex bg-gray-100 p-1 rounded-2xl max-w-md mx-auto border border-gray-200/50 shadow-sm">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-[#0A1128] text-white shadow-md shadow-gray-300'
                : 'text-gray-500 hover:text-gray-900 bg-transparent'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            {language === 'mr' ? '🤖 एआय असिस्टंट' : language === 'hi' ? '🤖 एआई असिस्टेंट' : '🤖 AI Partner'}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'text-gray-500 hover:text-gray-900 bg-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {language === 'mr' ? '💬 मित्र चॅट' : language === 'hi' ? '💬 मित्र चैट' : '💬 Friends Chat'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-6xl mx-auto overflow-hidden flex relative">
        <AnimatePresence mode="wait">
          {activeTab === 'ai' ? (
            /* ====================================
               🤖 MODE A: GEMINI SYSTEM ASSISTANT
               ==================================== */
            <motion.div 
              key="ai-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col h-full overflow-hidden w-full relative"
            >
              {/* Message Thread Scroll */}
              <div className="flex-1 overflow-y-auto px-6 pt-8 pb-60 space-y-6 w-full scrollbar-hide">
                {aiMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-16">
                    <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-[#BCC1C8] mb-2">
                      {language === 'mr' ? 'मी तुम्हाला काय मदत करू?' : 'HOW CAN I HELP YOU?'}
                    </h2>
                    <p className="text-[10px] font-bold text-[#BCC1C8] uppercase tracking-[0.25em]">
                      {language === 'mr' ? 'कोणताही प्रश्न विचारा' : 'ASK ANY QUESTION TO COMMENCE'}
                    </p>
                  </div>
                )}
                <AnimatePresence>
                  {aiMessages.map((message, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`p-5 rounded-[28px] pro-shadow relative
                          ${message.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white rounded-tl-none border border-gray-100 text-gray-800'}`}
                        >
                          <div className={`prose prose-sm max-w-none prose-p:leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'}`}>
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                          <div className={`mt-3 flex items-center justify-between border-t pt-2 ${message.role === 'user' ? 'border-white/10' : 'border-gray-50'}`}>
                            <span className={`text-[8px] uppercase font-black tracking-widest ${message.role === 'user' ? 'text-white/40' : 'text-gray-300'}`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white px-5 py-3.5 rounded-2xl border border-gray-100 pro-shadow">
                      <div className="flex gap-1.5">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={aiEndRef} />
              </div>

              {/* Bottom Fixed Bar */}
              <div className="fixed bottom-[112px] left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] z-[999] px-2 py-1">
                <form onSubmit={handleAISend} className="relative bg-white rounded-full border border-gray-200 shadow-xl p-1.5 flex items-center ring-1 ring-black/[0.03]">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={language === 'mr' ? 'एआय ला काहीही विचारा...' : 'Ask AI anything...'}
                    className="flex-1 bg-transparent px-5 py-3 text-sm font-semibold focus:outline-none placeholder:text-gray-300 text-gray-900"
                    disabled={isAiLoading}
                  />
                  <button
                    type="submit"
                    disabled={!aiInput.trim() || isAiLoading}
                    className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 shadow-md shadow-blue-200"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* ========================================================
               💬 MODE B: WHATSAPP STYLE REAL-TIME FRIENDS MESSAGE LAYER
               ======================================================== */
            <motion.div
              key="friends-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex h-full overflow-hidden relative w-full"
            >
              {/* 1. Left Conversation List Pane (Hide on mobile if chat is selected) */}
              <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-gray-100 flex flex-col bg-white transition-all duration-300 ${
                selectedChatId ? 'hidden md:flex' : 'flex'
              }`}>
                {/* Search Conversations Header */}
                <div className="p-4 shrink-0 border-b border-gray-50 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                      {language === 'mr' ? 'माझे चॅट्स' : language === 'hi' ? 'मेरे चैट्स' : 'My Conversations'}
                    </h3>
                    <button
                      onClick={() => setIsNewChatModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-150 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {language === 'mr' ? 'नवीन' : 'NEW'}
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'mr' ? 'संभाषणे शोधा...' : 'Search conversations...'}
                      className="w-full bg-[#F8F9FA] border border-gray-50 rounded-xl pl-10 pr-4 py-2 text-[11px] font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 shadow-none placeholder:text-gray-300"
                    />
                  </div>
                </div>

                {/* Discussions List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-[#F8F9FA]/40 scrollbar-hide">
                  {loadingChats ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Loading Node Streams...</span>
                    </div>
                  ) : filteredChats.length > 0 ? (
                    filteredChats.map(chatItem => {
                      const chatDetails = getRecipientDetails(chatItem);
                      const isSelected = selectedChatId === chatItem.id;
                      return (
                        <button
                          key={chatItem.id}
                          onClick={() => setSelectedChatId(chatItem.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border text-left cursor-pointer group ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-100 shadow-sm ring-1 ring-emerald-50'
                              : 'bg-white hover:bg-white/90 border-transparent hover:border-gray-100 hover:shadow-xs'
                          }`}
                        >
                          <div className="w-11 h-11 bg-gray-100 rounded-xl ring-2 ring-white/80 shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                            {chatDetails.photoURL ? (
                              <img src={chatDetails.photoURL} alt={chatDetails.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-5 h-5 text-gray-300" />
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-gray-900 text-xs truncate capitalize leading-tight group-hover:text-emerald-700 transition-colors">
                                {chatDetails.displayName}
                              </h4>
                              {chatItem.updatedAt && (
                                <span className="text-[7.5px] font-black uppercase text-gray-300 shrink-0">
                                  {formatMsgRelativeTime(chatItem.updatedAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium truncate leading-normal">
                              {chatItem.lastMessage || 'Connected to transport..'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 px-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-gray-100 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-5 h-5 text-gray-200" />
                      </div>
                      <p className="text-gray-900 font-extrabold uppercase text-[9px] tracking-wider mb-1">
                        {language === 'mr' ? 'चॅट्स सापडले नाहीत' : 'No Friends Chats Ready'}
                      </p>
                      <p className="text-gray-400 text-[8px] font-bold uppercase tracking-normal leading-relaxed mb-4 max-w-[150px] mx-auto">
                        {language === 'mr' ? 'तुमच्या मित्रांशी बोलायला चॅट सुरू करा' : 'Start your first WhatsApp-style direct chat.'}
                      </p>
                      <button
                        onClick={() => setIsNewChatModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-sm shadow-emerald-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {language === 'mr' ? 'नवीन शोधून बोला' : 'Start P2P Transmission'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Right Conversation Message Thread Pane */}
              <div className={`flex-1 flex flex-col bg-white transition-all duration-300 ${
                !selectedChatId ? 'hidden md:flex' : 'flex'
              }`}>
                {selectedChatId && selectedChatDetails ? (
                  <>
                    {/* Selected Contact Header */}
                    <div className="p-4 border-b border-gray-100 shrink-0 bg-white shadow-xs z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedChatId(null)}
                          className="md:hidden p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 bg-gray-100 rounded-xl relative shadow-xs flex items-center justify-center overflow-hidden">
                          {selectedChatDetails.photoURL ? (
                            <img src={selectedChatDetails.photoURL} alt={selectedChatDetails.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs text-gray-900 capitalize tracking-tight leading-none mb-1">
                            {selectedChatDetails.displayName}
                          </h3>
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-widest">
                              {language === 'mr' ? 'सुरक्षित थेट चॅट' : 'Secured Link'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest hidden sm:inline-block">
                          WHATSAPP P2P
                        </span>
                      </div>
                    </div>

                    {/* Chat Messages List (WhatsApp bubbles style) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA]/40 scrollbar-hide">
                      {friendMessages.length > 0 ? (
                        friendMessages.map((msg, index) => {
                          const isMe = msg.senderId === user?.uid;
                          return (
                            <div 
                              key={msg.id || index}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl relative shadow-xs border ${
                                isMe 
                                  ? 'bg-emerald-600 text-white rounded-tr-none border-emerald-500'
                                  : 'bg-white text-gray-950 rounded-tl-none border-gray-150'
                              }`}>
                                <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <div className={`mt-1.5 text-[7px] font-black uppercase tracking-tighter text-right flex items-center justify-end gap-1 ${
                                  isMe ? 'text-emerald-100/70' : 'text-gray-400'
                                }`}>
                                  <span>{formatMsgRelativeTime(msg.createdAt)}</span>
                                  {isMe && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-100" />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                          <MessageSquareCode className="w-8 h-8 text-emerald-600/30 mb-2.5" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                            {language === 'mr' ? 'कोणताही मेसेज नाही. पहिला मेसेज पाठवून चॅट सुरू करा!' : 'Send a secure peer message to initiate the feed stream.'}
                          </p>
                        </div>
                      )}
                      <div ref={friendEndRef} />
                    </div>

                    {/* Bottom Friends Chat Input Bar */}
                    <div className="p-4 bg-white border-t border-gray-50 z-10">
                      <form onSubmit={handleSendFriendMessage} className="relative flex items-center bg-[#F8F9FA] rounded-[24px] border border-gray-150 p-1">
                        <input
                          type="text"
                          value={friendInput}
                          onChange={(e) => setFriendInput(e.target.value)}
                          placeholder={language === 'mr' ? 'मेसेज लिहा आणि पाठवा...' : 'Type and transmit message...'}
                          className="flex-1 bg-transparent px-4 py-2 text-xs font-bold focus:outline-none placeholder:text-gray-300 text-gray-900"
                        />
                        <button
                          type="submit"
                          disabled={!friendInput.trim()}
                          className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-25 shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/15">
                    <div className="w-16 h-16 bg-white border border-gray-50 rounded-[28px] shadow-sm flex items-center justify-center mx-auto mb-5">
                      <MessageSquare className="w-7 h-7 text-emerald-600/20" />
                    </div>
                    <h4 className="text-sm font-black uppercase italic tracking-tight text-[#0A1128] mb-1">
                      {language === 'mr' ? 'एक चॅट निवडा' : 'Select a Private Thread'}
                    </h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                      {language === 'mr' ? 'मित्रांशी बोलण्यासाठी डाव्या बाजूने चॅट सुरू करा किंवा निवडा' : 'Click on any registered contact stream in your sidebar node to interface.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Start Chat / Contact Picker Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-[#0A1128] uppercase">
                  {language === 'mr' ? 'नवीन चॅट सुरू करा' : language === 'hi' ? 'नया चैट शुरू करें' : 'Start New Chat'}
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">
                  {language === 'mr' ? 'आपल्या मित्रांची यादी' : language === 'hi' ? 'अपने दोस्तों की सूची' : 'Select a contact to message'}
                </p>
              </div>
              <button 
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-50 bg-[#F8F9FA]/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                  type="text"
                  value={searchContactQuery}
                  onChange={(e) => setSearchContactQuery(e.target.value)}
                  placeholder={language === 'mr' ? 'नाव किंवा ईमेल शोधा...' : language === 'hi' ? 'नाम या ईमेल खोजें...' : 'Search by name or email...'}
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 shadow-sm placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(userItem => (
                  <button
                    key={userItem.uid}
                    onClick={() => startUserChat(userItem)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-emerald-50/40 hover:border-emerald-100 transition-all border border-transparent text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center relative shadow-sm ring-2 ring-white overflow-hidden flex-shrink-0">
                      {userItem.photoURL ? (
                        <img src={userItem.photoURL} alt={userItem.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-xs truncate capitalize leading-tight">{userItem.displayName}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">{userItem.bio || userItem.email || 'No bio available'}</p>
                      {userItem.location?.areaName && (
                        <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          📍 {userItem.location.areaName}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <User className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                    {language === 'mr' ? 'कोणीही मित्र सापडले नाही' : language === 'hi' ? 'कोई मित्र नहीं मिला' : 'No match found'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIChat;
