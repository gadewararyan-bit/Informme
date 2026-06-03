import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Chat, Message } from '../types';
import { Search, Send, User as UserIcon, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch chats
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chat[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Parse query params to start dynamic chat from a regional alert post
  useEffect(() => {
    if (!user || loading) return;
    const params = new URLSearchParams(window.location.search);
    const targetUid = params.get('userId');
    const targetName = params.get('userName');
    if (!targetUid || targetUid === user.uid) return;

    // Check if chat already exists
    const existingChat = chats.find(c => 
      c.participants.includes(user.uid) && c.participants.includes(targetUid)
    );

    if (existingChat) {
      if (selectedChat !== existingChat.id) {
        setSelectedChat(existingChat.id);
      }
    } else {
      const createDirectChat = async () => {
        try {
          const namesMap = {
            [user.uid]: user.displayName || 'Regional Citizen',
            [targetUid]: targetName || 'Citizen Partner'
          };
          const docRef = await addDoc(collection(db, 'chats'), {
            participants: [user.uid, targetUid],
            updatedAt: serverTimestamp(),
            lastMessage: 'Chat initialized',
            participantNamesMap: namesMap
          });
          setSelectedChat(docRef.id);
        } catch (e) {
          console.error("Error starting direct chat session:", e);
        }
      };
      createDirectChat();
    }
  }, [chats, loading, user]);

  // Fetch messages if chat selected
  useEffect(() => {
    if (!selectedChat) return;
    const q = query(
      collection(db, `chats/${selectedChat}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    const msg = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, `chats/${selectedChat}/messages`), {
        senderId: user.uid,
        content: msg,
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error("Message send failed:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-100px)] flex bg-white overflow-hidden sm:rounded-[40px] sm:my-6 pro-shadow border border-gray-100">
      {/* Chat List */}
      <div className={`w-full sm:w-96 flex-shrink-0 border-r border-gray-50 flex flex-col bg-[#F8F9FA]/50 ${selectedChat ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Direct</h1>
            <div className="w-10 h-10 bg-white rounded-xl pro-shadow border border-gray-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-100 pro-shadow placeholder:text-gray-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-hide">
          {chats.length > 0 ? chats.map(chat => {
            const partnerName = (() => {
              if (chat.participantNamesMap) {
                const otherUid = chat.participants.find(p => p !== user?.uid);
                if (otherUid && chat.participantNamesMap[otherUid]) {
                  return chat.participantNamesMap[otherUid];
                }
              }
              return 'Citizen Contact';
            })();

            return (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-[28px] transition-all group ${
                  selectedChat === chat.id 
                  ? 'bg-white pro-shadow border border-indigo-50 ring-4 ring-indigo-50/30' 
                  : 'hover:bg-white/60'
                }`}
              >
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center relative pro-shadow ring-2 ring-white">
                  <span className="text-sm font-black uppercase text-indigo-800">{partnerName.slice(0, 2)}</span>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <h4 className="font-black text-gray-900 text-[11px] uppercase tracking-widest truncate mb-0.5">{partnerName}</h4>
                  <p className="text-[10px] font-bold text-gray-400 truncate leading-none uppercase italic">{chat.lastMessage || 'Initialize stream...'}</p>
                </div>
              </button>
            );
          }) : (
            <div className="text-center py-20 px-8">
              <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-6 pro-shadow border border-dashed border-gray-200">
                <MessageCircle className="w-8 h-8 text-gray-100" />
              </div>
              <p className="text-gray-900 font-black uppercase text-[10px] tracking-widest mb-2 italic">Encrypted Inbox</p>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-tight leading-relaxed">Secure peer-to-peer transmission layer is ready.</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedChat ? 'hidden sm:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="sm:hidden p-3 bg-gray-50 rounded-2xl text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center pro-shadow ring-2 ring-white">
                  <UserIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">
                    {(() => {
                      const activeChatObj = chats.find(c => c.id === selectedChat);
                      if (activeChatObj && activeChatObj.participantNamesMap) {
                        const otherUid = activeChatObj.participants.find(p => p !== user?.uid);
                        if (otherUid && activeChatObj.participantNamesMap[otherUid]) {
                          return activeChatObj.participantNamesMap[otherUid];
                        }
                      }
                      return 'Active Stream';
                    })()}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Secured</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8F9FA]/30 scrollbar-hide">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-6 py-4 rounded-[28px] pro-shadow relative
                      ${msg.senderId === user?.uid 
                      ? 'bg-gray-900 text-white rounded-tr-none border border-gray-800' 
                      : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                      <div className={`mt-2 text-[8px] font-black uppercase tracking-tighter opacity-40 ${msg.senderId === user?.uid ? 'text-white' : 'text-gray-400'}`}>
                        {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-8 bg-white border-t border-gray-50">
              <form onSubmit={sendMessage} className="relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Inject data stream..."
                  className="w-full bg-[#F8F9FA] border border-gray-50 rounded-[32px] pl-6 pr-20 py-5 text-sm font-bold focus:ring-4 focus:ring-black/5 focus:border-gray-200 focus:bg-white transition-all pro-shadow placeholder:text-gray-200"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 bg-gray-900 text-white rounded-[24px] flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 pro-shadow"
                >
                  <Send className="w-5 h-5 translate-x-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50/10">
            <div className="text-center">
              <div className="w-24 h-24 bg-white rounded-[40px] pro-shadow flex items-center justify-center mx-auto mb-8 border border-gray-50">
                 <MessageCircle className="w-10 h-10 text-indigo-600/20" />
              </div>
              <h4 className="text-lg font-black uppercase italic tracking-tighter text-gray-900 mb-2">Initialize Transport</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Select a verification node to commence transmission</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
