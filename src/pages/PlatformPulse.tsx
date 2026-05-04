import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { User, Post } from '../types';
import { Users, IndianRupee, MessageSquare, CheckCircle, ArrowLeft, ShieldAlert, Trash2, ExternalLink, Activity, Tag, Info, ShieldCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { ADMIN_EMAILS } from '../constants';

export default function PlatformPulse() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = !!user?.isAdmin;
  const [users, setUsers] = useState<User[]>([]);
  const [reportedPosts, setReportedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'network' | 'moderation' | 'growth'>('network');

  // Business metrics calculation
  const totalUsers = users.length;
  const totalPendingRewards = users.reduce((acc, curr) => acc + (curr.walletBalance || 0), 0);
  
  // Simulated Revenue (For Demonstration - Professional Scale)
  const estimatedAdRevenue = users.reduce((acc, curr) => acc + ((curr.postCount || 0) * 0.5) + (totalUsers * 0.1), 0);
  const platformProfit = estimatedAdRevenue - totalPendingRewards;

  useEffect(() => {
    // Basic stats are public for transparency
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });

    // Moderation queue is for admins only, but we show a count for transparency
    const qReports = query(collection(db, 'posts'), where('reports', '!=', []));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      const sorted = postsData.sort((a, b) => (b.reports?.length || 0) - (a.reports?.length || 0));
      setReportedPosts(sorted);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubReports();
    };
  }, []);

  // Moderation queue is for everyone to see for transparency
  const handleDeletePost = async (postId: string) => {
    if (!isAdmin) {
      alert("Admin authorization required for node deletion.");
      return;
    }
    if (!window.confirm("Remove this post from network?")) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
       console.error("Deletion error:", error);
    }
  };

  const handlePayUser = async (targetUser: User) => {
    if (!isAdmin) {
      alert("Admin authorization required for payout processing.");
      return;
    }
    if (!window.confirm(`Disburse payout of ₹${(targetUser.walletBalance || 0).toFixed(2)} to ${targetUser.displayName}?`)) return;

    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, { walletBalance: 0 });
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase tracking-tighter italic mb-2">Access Restricted</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
            Administrative credentials required for terminal access. Return to main node.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 w-full bg-gray-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
          >
            DISCONNECT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 pb-32 max-w-[500px] mx-auto overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform text-blue-600" />
            {t('nav_feed').toUpperCase()}
          </button>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-black tracking-tighter text-gray-900 italic uppercase">{t('nav_pulse')}</h1>
              <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold tracking-widest uppercase text-xs">Real-Time</div>
            </div>
            <p className="text-gray-400 text-sm font-medium">Platform transparency, network health, and community integrity.</p>
          </div>
        </header>

        {/* Visibility Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white p-5 rounded-[28px] pro-shadow border border-gray-100 ring-1 ring-black/[0.02]">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                 <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{totalUsers}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">Active Nodes</p>
           </div>
           
           <div className="bg-white p-5 rounded-[28px] pro-shadow border border-gray-100 ring-1 ring-black/[0.02]">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                 <Activity className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">100%</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">Uptime Sync</p>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
           <button 
             onClick={() => setActiveTab('network')}
             className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'network' ? 'bg-white text-blue-600 pro-shadow shadow-sm' : 'text-gray-400'}`}
           >
             Network
           </button>
           <button 
             onClick={() => setActiveTab('moderation')}
             className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'moderation' ? 'bg-white text-blue-600 pro-shadow shadow-sm' : 'text-gray-400'}`}
           >
             Safety
           </button>
           <button 
             onClick={() => setActiveTab('growth')}
             className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'growth' ? 'bg-white text-blue-600 pro-shadow shadow-sm' : 'text-gray-400'}`}
           >
             Yield
           </button>
        </div>

        <section className="space-y-6">
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Contributor Index
                </h3>
                <div className="space-y-1">
                  {users.slice(0, 5).map((u, i) => (
                    <div key={u.uid} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-8 h-8 rounded-full border border-gray-100" alt="" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none">{u.displayName}</p>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight mt-1">{u.location?.areaName || 'Local Node'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-bold text-gray-900">{u.postCount || 0}</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-0.5">Posts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {users.filter(u => (u.walletBalance || 0) > 0).length > 0 && (
                <div className="bg-white p-6 rounded-[32px] pro-shadow border border-blue-100 bg-blue-50/10">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Payout Pipeline</h3>
                  <div className="space-y-3">
                    {users.filter(u => (u.walletBalance || 0) > 0).map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-blue-50">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{u.displayName}</p>
                          <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-emerald-600">₹{(u.walletBalance || 0).toFixed(2)}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handlePayUser(u); }}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase disabled:opacity-50"
                            disabled={!isAdmin}
                          >
                            PAY
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'moderation' && (
             <div className="space-y-4">
               <div className="bg-white p-8 rounded-[32px] pro-shadow border border-gray-100 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center ${reportedPosts.length > 0 ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                     {reportedPosts.length > 0 ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">
                    {reportedPosts.length > 0 ? 'Anomalies' : 'Safe Index'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-2 px-8 leading-relaxed font-medium">
                    {reportedPosts.length > 0 
                      ? `${reportedPosts.length} nodes have been flagged by the community for verification.`
                      : 'Community reports are currently zero. The network integrity is verified.'}
                  </p>
               </div>

               {reportedPosts.length > 0 && (
                 <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] px-2 mb-2">High Priority Flagged Items</h4>
                   {reportedPosts.map(post => (
                     <div key={post.id} className="bg-white p-5 rounded-[28px] pro-shadow border border-gray-100 ring-1 ring-red-500/5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                           <div className="flex items-center gap-3">
                              <img src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}`} className="w-8 h-8 rounded-full border border-gray-100" alt="" />
                              <div>
                                 <p className="text-[11px] font-bold text-gray-900 leading-tight">{post.authorName}</p>
                                 <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-0.5">{post.reports?.length} Reports</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => handleDeletePost(post.id)}
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                            disabled={!isAdmin}
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                           <p className="text-xs text-gray-600 font-medium italic leading-relaxed line-clamp-4">
                              "{post.content}"
                           </p>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          )}

          {activeTab === 'growth' && (
             <div className="space-y-4">
                <div className="bg-gray-900 p-8 rounded-[40px] text-white pro-shadow relative overflow-hidden ring-1 ring-white/10">
                   <div className="relative z-10">
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-8">Asset Model</h3>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                           <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Platform Earn</span>
                           <span className="text-xl font-bold tracking-tight">₹{estimatedAdRevenue.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                           <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Creator Yield</span>
                           <span className="text-xl font-bold tracking-tight">₹{totalPendingRewards.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Growth Margin</span>
                           <span className="text-xl font-bold text-blue-400 tracking-tight">₹{platformProfit.toFixed(0)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-10 grid grid-cols-2 gap-3">
                         <div className="bg-white/5 backdrop-blur p-4 rounded-2xl border border-white/10">
                            <h4 className="text-[8px] font-black text-gray-500 uppercase mb-2">Primary Index</h4>
                            <p className="text-[10px] font-bold text-white/80 uppercase">Ad Revenue Share</p>
                         </div>
                         <div className="bg-white/5 backdrop-blur p-4 rounded-2xl border border-white/10">
                            <h4 className="text-[8px] font-black text-gray-500 uppercase mb-2">Node Feature</h4>
                            <p className="text-[10px] font-bold text-white/80 uppercase">Business Promos</p>
                         </div>
                      </div>
                   </div>
                   <Activity className="absolute -bottom-10 -right-10 w-48 h-48 text-white/[0.02] rotate-12" />
                </div>

                <div className="bg-white p-8 rounded-[32px] pro-shadow border border-gray-100">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Info className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 italic">TRANSPARENCY PROTOCOL</h4>
                   </div>
                   <p className="text-[11px] text-gray-500 font-medium leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                     InformMe operates on a decentralized data contribution model. All financials shown are platform estimates based on network engagement metrics. Our goal is to build a self-sustaining local information infrastructure.
                   </p>
                </div>
             </div>
          )}
        </section>
      </div>
    </div>
  );
}
