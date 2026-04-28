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
        className="fixed top-0 left-0 right-0 z-[60] p-4"
      >
        <div className="max-w-2xl mx-auto bg-red-600 border-4 border-black text-white p-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 bg-black/20 animate-pulse">
            <span className="text-[8px] font-black uppercase tracking-widest px-2">EMERGENCY</span>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-white p-2 rounded-lg shrink-0">
               <AlertTriangle className="w-6 h-6 text-red-600 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black uppercase italic text-sm mb-1 tracking-tight">Active Emergency Alert</h4>
              <p className="text-xs font-bold leading-tight line-clamp-2 mb-2 opacity-90">
                {latestEmergency.content}
              </p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(`/post/${latestEmergency.id}`)}
                  className="flex items-center gap-1.5 bg-white text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setDismissed(latestEmergency.id)}
                  className="text-[10px] font-bold uppercase underline opacity-70 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
