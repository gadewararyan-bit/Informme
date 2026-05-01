import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { User, Post } from '../types';
import { Users, Activity, ShieldAlert, CheckCircle, ArrowLeft, Trash2, ShieldCheck, Database, LayoutDashboard, TrendingUp, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import SeedingTool from '../components/admin/SeedingTool';

export default function OwnerPortal() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = !!user?.isAdmin;
  
  const [users, setUsers] = useState<User[]>([]);
  const [reportedPosts, setReportedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'seeding'>('overview');

  // Metrics
  const totalUsers = users.length;
  const totalPosts = users.reduce((acc, curr) => acc + (curr.postCount || 0), 0);
  const totalPendingPayouts = users.reduce((acc, curr) => acc + (curr.walletBalance || 0), 0);
  const estimatedRevenue = totalPosts * 0.5 + totalUsers * 0.5;

  useEffect(() => {
    if (!isAdmin) return;

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    });

    const qReports = query(collection(db, 'posts'), where('reports', '!=', []));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReportedPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubReports();
    };
  }, [isAdmin]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Permanent deletion from network?")) return;
    await deleteDoc(doc(db, 'posts', postId));
  };

  const handlePayUser = async (targetUser: User) => {
    if (!window.confirm(`Settle ₹${(targetUser.walletBalance || 0).toFixed(2)} for ${targetUser.displayName}?`)) return;
    await updateDoc(doc(db, 'users', targetUser.uid), { walletBalance: 0 });
  };

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 flex-col p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Unauthorized Terminal</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-xs">
          This secure node is reserved for platform owners only.
        </p>
        <button onClick={() => navigate('/')} className="mt-8 bg-black text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFEFE] pb-24">
      {/* Sidebar-style Nav for Desktop, Top for mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">System Root Active</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-gray-900 uppercase">Owner Portal</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate('/')}
               className="px-6 py-3 bg-white rounded-2xl border border-gray-100 pro-shadow text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all"
             >
               <ArrowLeft className="w-3 h-3" /> User Mode
             </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
           {[
             { label: 'Total Nodes', val: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Network Output', val: totalPosts, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
             { label: 'Safety Index', val: reportedPosts.length === 0 ? '100%' : `${100 - reportedPosts.length}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Yield Margin', val: `₹${(estimatedRevenue - totalPendingPayouts).toFixed(0)}`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100">
               <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                 <stat.icon className="w-5 h-5" />
               </div>
               <p className="text-2xl font-black tracking-tighter text-gray-900">{stat.val}</p>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
             </div>
           ))}
        </div>

        {/* Local Navigation */}
        <div className="flex flex-wrap gap-2 mb-10 bg-gray-100/50 p-1.5 rounded-3xl w-fit">
           {[
             { id: 'overview', label: 'Overview', icon: LayoutDashboard },
             { id: 'users', label: 'User Management', icon: Users },
             { id: 'moderation', label: 'Safety & Guard', icon: ShieldAlert },
             { id: 'seeding', label: 'Auto Seeding', icon: Database }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab.id ? 'bg-white text-blue-600 pro-shadow' : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               <tab.icon className="w-3.5 h-3.5" />
               {tab.label}
             </button>
           ))}
        </div>

        <main className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-gray-900 p-10 rounded-[48px] text-white overflow-hidden relative">
                 <div className="relative z-10">
                   <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Platform Economy</h3>
                   <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-10 text-white/40">Current Fiscal Projection</p>
                   
                   <div className="space-y-6">
                     <div className="flex justify-between items-center py-4 border-b border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Gross Ad Revenue</span>
                        <span className="text-2xl font-black">₹{estimatedRevenue.toFixed(0)}</span>
                     </div>
                     <div className="flex justify-between items-center py-4 border-b border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">User Disbursal</span>
                        <span className="text-2xl font-black text-rose-400">₹{totalPendingPayouts.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center pt-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Net Profit</span>
                        <span className="text-3xl font-black text-emerald-400">₹{(estimatedRevenue - totalPendingPayouts).toFixed(0)}</span>
                     </div>
                   </div>
                 </div>
                 <Activity className="absolute -bottom-10 -right-10 w-64 h-64 text-white/[0.03] rotate-12" />
               </div>

               <div className="bg-white p-10 rounded-[48px] pro-shadow border border-gray-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Node Growth (Last 5)</h3>
                  <div className="space-y-2">
                    {users.slice(0, 5).map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                        <div className="flex items-center gap-4">
                          <img src={u.photoURL || ''} className="w-10 h-10 rounded-xl pro-shadow" alt="" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{u.displayName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-indigo-600">{u.postCount || 0} P</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                     <tr>
                       <th className="px-8 py-6">User / Node</th>
                       <th className="px-8 py-6">Email Index</th>
                       <th className="px-8 py-6">Points</th>
                       <th className="px-8 py-6">Earnings</th>
                       <th className="px-8 py-6">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {users.map(u => (
                       <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <img src={u.photoURL || ''} className="w-10 h-10 rounded-xl" alt="" />
                             <div>
                               <p className="text-sm font-bold text-gray-900">{u.displayName}</p>
                               <p className="text-[10px] font-black text-gray-400 uppercase">{u.location?.areaName || 'Remote'}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-6 text-xs text-gray-500 font-medium">{u.email}</td>
                         <td className="px-8 py-6 font-bold text-indigo-600">{(u.engagementPoints || 0) + (u.points || 0)}</td>
                         <td className="px-8 py-6 font-bold text-emerald-600">₹{((u.walletBalance || 0) + (u.earnings || 0)).toFixed(2)}</td>
                         <td className="px-8 py-6">
                            {((u.walletBalance || 0) + (u.earnings || 0)) > 0 && (
                              <button 
                                onClick={() => handlePayUser(u)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
                              >
                                Settle
                              </button>
                            )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'moderation' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportedPosts.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] pro-shadow border border-gray-100">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Network Clean</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No anomalies detected in community nodes.</p>
                  </div>
                ) : (
                  reportedPosts.map(post => (
                    <div key={post.id} className="bg-white p-6 rounded-[32px] pro-shadow border-l-4 border-red-500">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <img src={post.authorPhoto || ''} className="w-8 h-8 rounded-full" alt="" />
                            <div>
                               <p className="text-xs font-bold">{post.authorName}</p>
                               <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{post.reports?.length} Reports</p>
                            </div>
                         </div>
                         <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                      <p className="text-sm font-medium text-gray-600 italic bg-gray-50 p-4 rounded-xl border border-gray-100">"{post.content}"</p>
                    </div>
                  ))
                )}
             </div>
          )}

          {activeTab === 'seeding' && (
            <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 p-10">
               <div className="mb-8">
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Automated Node Deployment</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Seed the network with local AI-generated headlines.</p>
               </div>
               <SeedingTool />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
