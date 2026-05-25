import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_EMAILS } from '../../constants';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { IndianRupee, Users, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminFooter() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    profit: 0,
    creators: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  const isAdmin = !!user?.isAdmin || 
                  (user?.email ? ADMIN_EMAILS.includes(user.email.trim().toLowerCase()) : false) || 
                  (user?.displayName ? user.displayName.toLowerCase().trim() === 'aryan gadewar' : false);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      
      const totalUsers = users.length;
      const totalPendingRewards = users.reduce((acc, curr: any) => acc + (curr.earnings || 0), 0);
      const estimatedAdRevenue = users.reduce((acc, curr: any) => acc + ((curr.postCount || 0) * 1.5) + (totalUsers * 0.2), 0);
      const platformProfit = estimatedAdRevenue - totalPendingRewards;
      const creators = users.filter((u: any) => (u.postCount || 0) > 0).length;

      setMetrics({
        totalUsers,
        profit: platformProfit,
        creators
      });
      setIsVisible(true);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!isAdmin || !isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[500px] px-4 pointer-events-none z-50">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-900/95 backdrop-blur-xl text-white border border-white/10 rounded-3xl px-6 py-3 flex items-center justify-between pointer-events-auto pro-shadow ring-1 ring-white/5"
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase text-gray-500 tracking-widest leading-none mb-0.5">Network Nodes</span>
              <span className="text-[11px] font-black italic tracking-tighter leading-none">{metrics.totalUsers}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/20">
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase text-gray-500 tracking-widest leading-none mb-0.5">Verifiers</span>
              <span className="text-[11px] font-black italic tracking-tighter leading-none">{metrics.creators}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 shadow-inner">
          <div className="w-6 h-6 bg-emerald-500 text-white rounded-lg flex items-center justify-center pro-shadow">
            <IndianRupee className="w-3 h-3" />
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase text-emerald-400 tracking-widest leading-none mb-0.5">Est. Yield</span>
            <span className="text-[11px] font-black italic tracking-tighter leading-none text-white">₹{metrics.profit.toFixed(0)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
