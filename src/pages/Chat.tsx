import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Chat, Message } from '../types';
import { Search, Send, MapPin, User as UserIcon } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex bg-white overflow-hidden sm:rounded-[32px] sm:my-4 sm:shadow-2xl sm:border sm:border-gray-100">
      {/* Chat List */}
      <div className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col ${selectedChat ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search friends..." 
              className="w-full bg-gray-50 border-none rounded-xl pl-10 text-sm focus:ring-[#FF9933]/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {chats.length > 0 ? chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-all ${selectedChat === chat.id ? 'bg-gray-50' : ''}`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <h4 className="font-bold text-gray-900 text-sm truncate">Chat with Friend</h4>
                <p className="text-xs text-gray-400 truncate">{chat.lastMessage || 'Start a conversation'}</p>
              </div>
            </button>
          )) : (
            <div className="text-center py-20 px-6">
              <MessageCircle className="w-12 h-12 text-gray-100 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No messages yet. Connect with locals to start chatting!</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden sm:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-50 flex items-center gap-4 bg-white/80 backdrop-blur-md">
              <button 
                onClick={() => setSelectedChat(null)}
                className="sm:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Friend Name</h3>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                      msg.senderId === user?.uid 
                      ? 'bg-[#FF9933] text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-50 flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-[#FF9933]/20"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#138808] text-white p-3 rounded-2xl hover:bg-[#138808]/90 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50/30">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                 <MessageCircle className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-medium tracking-tight">Select a friend to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function MessageCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
