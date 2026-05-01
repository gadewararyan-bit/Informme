import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';

export default function EmergencyAlert() {
  const navigate = useNavigate();
  const [latestEmergency, setLatestEmergency] = useState<Post | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('type', '==', 'alert'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        const post = posts.find(p => p.isUrgent);

        if (post) {
          // Check if it's recent (within 12 hours)
          const postTime = post.createdAt?.toDate?.()?.getTime() || Date.now();
          const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
          
          if (postTime > twelveHoursAgo && post.id !== dismissed) {
            setLatestEmergency(post);
          } else {
            setLatestEmergency(null);
          }
        } else {
          setLatestEmergency(null);
        }
      } else {
        setLatestEmergency(null);
      }
    }, (error) => {
      console.error("Emergency Alert Listener Error:", error);
    });

    return () => unsubscribe();
  }, [dismissed]);

  if (!latestEmergency) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-6 left-0 right-0 z-[60] px-6 pointer-events-none"
      >
        <div className="max-w-[450px] mx-auto bg-red-600/95 backdrop-blur-xl rounded-[32px] text-white p-6 pro-shadow border border-white/20 pointer-events-auto relative overflow-hidden group">
          {/* Animated subtle background wave */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="absolute top-0 right-0 bg-white/20 px-4 py-1.5 rounded-bl-[20px] backdrop-blur-md border-l border-b border-white/10">
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Priority Alpha</span>
          </div>
          
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 pro-shadow">
               <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black uppercase italic text-xs mb-1.5 tracking-widest text-white/60">System Security Alert</h4>
              <p className="text-sm font-bold leading-relaxed line-clamp-3 mb-4 text-white">
                {latestEmergency.content}
              </p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(`/post/${latestEmergency.id}`)}
                  className="flex items-center gap-2 bg-white text-red-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest pro-shadow hover:scale-105 active:scale-95 transition-all"
                >
                  Intercept <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setDismissed(latestEmergency.id)}
                  className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
