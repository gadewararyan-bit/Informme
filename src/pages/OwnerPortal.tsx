import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { User, Post, Deal } from '../types';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  CheckCircle, 
  ArrowLeft, 
  Trash2, 
  ShieldCheck, 
  Database, 
  LayoutDashboard, 
  TrendingUp, 
  Filter, 
  Percent, 
  CreditCard, 
  Save, 
  Phone,
  Coins,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import SeedingTool from '../components/admin/SeedingTool';
import { ADMIN_EMAILS } from '../constants';

export default function OwnerPortal() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = !!user?.isAdmin || (user?.email ? ADMIN_EMAILS.includes(user.email.trim().toLowerCase()) : false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [reportedPosts, setReportedPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'content' | 'seeding' | 'royalties'>('overview');

  // Aryan's Payment Configuration States
  const [upiId, setUpiId] = useState(() => localStorage.getItem('owner_upi_id') || 'aryangadewar@okaxis');
  const [bankDetails, setBankDetails] = useState(() => localStorage.getItem('owner_bank_details') || 'Aryan Gadewar, State Bank of India, Acc: 30491029301, IFSC: SBIN0001234');

  const savePayoutConfig = () => {
    localStorage.setItem('owner_upi_id', upiId);
    localStorage.setItem('owner_bank_details', bankDetails);
    alert("Aryan's Payout accounts successfully linked & saved!");
  };

  // Metrics
  const totalUsers = users.length;
  const totalPosts = users.reduce((acc, curr) => acc + (curr.postCount || 0), 0);
  const estimatedRevenue = totalPosts * 0.5 + totalUsers * 0.5;

  // Calculate 2% Royalty sum from signed deals
  const totalRoyaltyDue = deals.reduce((acc, deal) => {
    if (deal.hasSignedProfitAgreement) {
      const units = deal.expectedUnitsPerMonth || 0;
      const profitPerUnit = deal.expectedProfitPerUnit || 0;
      const dealProfit = units * profitPerUnit;
      return acc + (dealProfit * 0.02);
    }
    return acc;
  }, 0);

  useEffect(() => {
    if (!isAdmin) return;

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    });

    const qReports = query(collection(db, 'posts'), where('reports', '!=', []));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReportedPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    const qAllPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubAllPosts = onSnapshot(qAllPosts, (snapshot) => {
      setAllPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    const qDeals = query(collection(db, 'deals'), orderBy('createdAt', 'desc'), limit(100));
    const unsubDeals = onSnapshot(qDeals, (snapshot) => {
      setDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal)));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubReports();
      unsubAllPosts();
      unsubDeals();
    };
  }, [isAdmin]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Permanent deletion from network?")) return;
    await deleteDoc(doc(db, 'posts', postId));
  };

  const handleUpdatePayoutStatus = async (dealId: string, status: 'pending' | 'partially_paid' | 'fully_paid', verifiedAmount: number) => {
    try {
      await updateDoc(doc(db, 'deals', dealId), {
        payoutStatus: status,
        adminVerifiedAmount: verifiedAmount
      });
    } catch (err) {
      console.error("Error updating payout status:", err);
      alert("Unable to write settlement status block to Firestore.");
    }
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
             { label: 'Active Deals', val: deals.length, icon: Coins, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Partner Royalties (2%)', val: `₹${totalRoyaltyDue.toLocaleString(undefined, {maximumFractionDigits:0})}`, icon: Percent, color: 'text-orange-600', bg: 'bg-orange-50' }
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
             { id: 'royalties', label: 'Partner Royalties', icon: Coins },
             { id: 'content', label: 'Posts', icon: Database },
             { id: 'moderation', label: 'Safety', icon: ShieldAlert },
             { id: 'seeding', label: 'AI Seed', icon: TrendingUp }
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
                     <div className="flex justify-between items-center pt-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Projected Net Profit</span>
                        <span className="text-3xl font-black text-emerald-400">₹{estimatedRevenue.toFixed(0)}</span>
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
                       <th className="px-8 py-6">Contributions</th>
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
                         <td className="px-8 py-6 font-bold text-emerald-600">{u.postCount || 0} Posts</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'content' && (
             <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                   <h3 className="text-xl font-black italic tracking-tighter uppercase">Recent Network Posts</h3>
                   <span className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[10px] font-black uppercase text-gray-400">{allPosts.length} Displayed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      <tr>
                        <th className="px-8 py-6">Author</th>
                        <th className="px-8 py-6">Content Preview</th>
                        <th className="px-8 py-6">Metrics</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {allPosts.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <img src={post.authorPhoto || ''} className="w-8 h-8 rounded-full bg-gray-100" alt="" />
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{post.authorName}</p>
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-gray-500 font-medium max-w-xs">
                            <p className="line-clamp-2">{post.content}</p>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex gap-4 font-black">
                                <span className="text-blue-600">{post.likes?.length || 0} L</span>
                                <span className="text-purple-600">{post.commentCount || 0} C</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             {post.reports && post.reports.length > 0 ? (
                               <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">Flagged</span>
                             ) : (
                               <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Clean</span>
                             )}
                          </td>
                          <td className="px-8 py-6">
                             <button 
                               onClick={() => handleDeletePost(post.id)}
                               className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 rounded-lg"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
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

          {activeTab === 'royalties' && (
            <div className="space-y-8 animate-fade-in text-[#0D1B2A]">
               {/* Payout Details Config */}
               <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-xl font-black italic tracking-tighter uppercase">Aryan's Payout Coordinates</h3>
                     </div>
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-relaxed">
                        These destination accounts are displayed to partner stores during campaign agreement signings.
                     </p>

                     <div className="space-y-3">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-slate-400">Owner GPay / UPI Address</label>
                           <input
                             type="text"
                             value={upiId}
                             onChange={(e) => setUpiId(e.target.value)}
                             placeholder="aryangadewar@okaxis"
                             className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-slate-400">Owner Bank Transfer Details</label>
                           <textarea
                             rows={3}
                             value={bankDetails}
                             onChange={(e) => setBankDetails(e.target.value)}
                             placeholder="Aryan Gadewar, SBI Acc..."
                             className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-xs font-medium focus:ring-1 ring-indigo-500 outline-none resize-none"
                           />
                        </div>
                        <button
                          onClick={savePayoutConfig}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all pro-shadow"
                        >
                           <Save className="w-3.5 h-3.5" /> Save Coordinates
                        </button>
                     </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[32px] text-white flex flex-col justify-between">
                     <div>
                        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Revenue Status</span>
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase mt-4 mb-2">Royalty Ledger</h4>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                           All businesses must report their approximate sales volume/net margins. You are legally entitled to receive <b className="text-indigo-400">2%</b> of net campaign revenues derived from customers using local vouchers.
                        </p>
                     </div>
                     <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Expected Payouts In Escrow</p>
                           <p className="text-4xl font-black text-emerald-400">₹{totalRoyaltyDue.toLocaleString()}</p>
                        </div>
                        <Coins className="w-12 h-12 text-white/5" />
                     </div>
                  </div>
               </div>

               {/* Agreements Ledger List */}
               <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                     <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" /> Signed Royalty Portfolios
                     </h3>
                     <span className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[9px] font-black uppercase text-gray-400">
                        {deals.filter(d => d.hasSignedProfitAgreement).length} signed campaigns
                     </span>
                  </div>

                  {deals.filter(d => d.hasSignedProfitAgreement).length === 0 ? (
                    <div className="py-24 text-center">
                       <Percent className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-pulse" />
                       <h4 className="text-sm font-black uppercase text-gray-300 tracking-widest">No Signed Deals Discovered</h4>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Voucher agreements will pop up once stores publish campaign deals.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100">
                             <tr>
                                <th className="px-8 py-5">Merchant / Deal details</th>
                                <th className="px-8 py-5 text-center">Est. Earnings Ledger</th>
                                <th className="px-8 py-5 text-center">2% Royalty Share</th>
                                <th className="px-8 py-5">Digital Signatures</th>
                                <th className="px-8 py-5 text-center">Clearing Status</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {deals.filter(d => d.hasSignedProfitAgreement).map(deal => {
                                const dealProfit = (deal.expectedUnitsPerMonth || 0) * (deal.expectedProfitPerUnit || 0);
                                const royaltyDue = dealProfit * 0.02;
                                
                                return (
                                   <tr key={deal.id} className="hover:bg-gray-50/50 transition-all font-medium text-xs text-gray-700">
                                      <td className="px-8 py-6">
                                         <div>
                                            <p className="font-extrabold text-gray-900 text-sm">{deal.businessName}</p>
                                            <p className="text-[10px] font-bold text-indigo-600 mt-0.5">{deal.title} ({deal.category})</p>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                               <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                               {deal.location?.areaName}
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                         <div className="space-y-0.5">
                                            <p className="font-bold text-gray-900">₹{dealProfit.toLocaleString()}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                               {deal.expectedUnitsPerMonth} units &bull; ₹{deal.expectedProfitPerUnit}/u
                                            </p>
                                         </div>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                         <div className="bg-indigo-50 text-indigo-700 font-extrabold text-sm py-1.5 px-3 rounded-xl inline-block">
                                            ₹{royaltyDue.toLocaleString()}
                                         </div>
                                      </td>
                                      <td className="px-8 py-6">
                                         <div>
                                            <p className="font-mono text-[10px] font-black italic uppercase tracking-wider text-gray-500">
                                               🖋️ SIGNED BY: {deal.signerName}
                                            </p>
                                            {deal.signerPhone && (
                                               <a 
                                                 href={`https://wa.me/${deal.signerPhone.replace(/[^0-9]/g, '')}`}
                                                 target="_blank"
                                                 rel="noreferrer"
                                                 className="mt-1 flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                                               >
                                                  <Phone className="w-3 h-3" /> Chat: {deal.signerPhone}
                                               </a>
                                            )}
                                         </div>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                         <div className="flex flex-col items-center gap-2">
                                            <select
                                              value={deal.payoutStatus || 'pending'}
                                              onChange={(e) => handleUpdatePayoutStatus(deal.id, e.target.value as any, deal.adminVerifiedAmount || 0)}
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-gray-700 outline-none"
                                            >
                                               <option value="pending">🟡 Pending Payout</option>
                                               <option value="partially_paid">🟠 Partially Paid</option>
                                               <option value="fully_paid">🟢 Cleared & Fully Paid</option>
                                            </select>
                                            <div className="flex items-center gap-1">
                                               <span className="text-[9px] text-gray-400 font-bold uppercase">Paid: ₹</span>
                                               <input 
                                                 type="number"
                                                 value={deal.adminVerifiedAmount || 0}
                                                 onChange={(e) => handleUpdatePayoutStatus(deal.id, deal.payoutStatus || 'pending', parseInt(e.target.value) || 0)}
                                                 className="w-16 bg-gray-50 border border-gray-100 text-center rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-700" 
                                               />
                                            </div>
                                         </div>
                                      </td>
                                   </tr>
                                );
                             })}
                          </tbody>
                       </table>
                    </div>
                  )}
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
