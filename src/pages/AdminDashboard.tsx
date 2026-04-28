import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, deleteDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User, Post } from '../types';
import { Users, IndianRupee, MessageSquare, CheckCircle, ArrowLeft, ShieldAlert, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ADMIN_EMAIL } from '../constants';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [reportedPosts, setReportedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');

  useEffect(() => {
    if (user?.email?.trim().toLowerCase() !== ADMIN_EMAIL.trim().toLowerCase()) {
      navigate('/');
      return;
    }

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });

    const qReports = query(collection(db, 'posts'), where('reports', '!=', []));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      // Sort by report count on client side since Firestore doesn't support array length queries well
      const sorted = postsData.sort((a, b) => (b.reports?.length || 0) - (a.reports?.length || 0));
      setReportedPosts(sorted);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubReports();
    };
  }, [user, navigate]);

  const handlePayUser = async (targetUser: User) => {
    if (!window.confirm(`Mark ₹${targetUser.earnings} as paid for ${targetUser.displayName}? This will reset their earnings to 0.`)) return;

    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        earnings: 0
      });
      alert('Payment processed successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this reported post?")) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      alert("Post deleted successfully.");
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleClearReports = async (postId: string) => {
    if (!window.confirm("Clear all reports for this post? Use this if you've verified the post is REAL.")) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        reports: []
      });
      alert("Reports cleared.");
    } catch (error) {
      console.error("Error clearing reports:", error);
    }
  };

  if (user?.email?.trim().toLowerCase() !== ADMIN_EMAIL.trim().toLowerCase()) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 mb-2 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Admin Dashboard</h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Quality Control & Rewards</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white border-4 border-black p-4 brutalist-shadow text-center min-w-[120px]">
              <div className="text-2xl font-black italic">{users.length}</div>
              <div className="text-[8px] font-black uppercase text-gray-400">Total Users</div>
            </div>
            <div className={`border-4 border-black p-4 brutalist-shadow text-center min-w-[120px] ${reportedPosts.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-white'}`}>
              <div className="text-2xl font-black italic">{reportedPosts.length}</div>
              <div className="text-[8px] font-black uppercase opacity-80">Reported Posts</div>
            </div>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 border-4 border-black font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'users' ? 'bg-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]' : 'bg-white text-gray-400 hover:text-black hover:border-black'}`}
          >
            Users & Payments
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 border-4 border-black font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-[4px_4px_0_0_rgba(220,38,38,1)]' : 'bg-white text-gray-400 hover:text-red-600 hover:border-red-600'}`}
          >
            <ShieldAlert className="w-4 h-4" />
            Reported Content
            {reportedPosts.length > 0 && <span className="bg-white text-red-600 px-1.5 rounded-full text-[10px]">{reportedPosts.length}</span>}
          </button>
        </div>

        {activeTab === 'users' ? (
          <div className="bg-white border-4 border-black brutalist-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white uppercase text-[10px] font-black tracking-widest">
                    <th className="p-4">User</th>
                    <th className="p-4">Posts</th>
                    <th className="p-4">Pending Rewards</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} className="w-10 h-10 border-2 border-black rounded-sm" alt="" />
                          ) : (
                            <div className="w-10 h-10 border-2 border-black bg-saffron flex items-center justify-center font-black">
                              {u.displayName[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-black text-sm uppercase">{u.displayName}</div>
                            <div className="text-[10px] font-bold text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span className="font-black italic text-lg">{u.postCount || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-india-green" />
                          <span className={`font-black italic text-lg ${ (u.earnings || 0) > 0 ? 'text-india-green' : 'text-gray-300'}`}>
                            ₹{u.earnings || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handlePayUser(u)}
                          disabled={(u.earnings || 0) === 0}
                          className={`px-4 py-2 border-2 border-black font-black uppercase text-[10px] tracking-widest transition-all ${
                            (u.earnings || 0) > 0 
                            ? 'bg-black text-white hover:bg-gray-800 active:translate-y-1' 
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          { (u.earnings || 0) > 0 ? 'Mark Paid' : 'No Dues' }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reportedPosts.length === 0 ? (
              <div className="bg-white border-4 border-dashed border-gray-200 p-20 text-center rounded-3xl">
                <CheckCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-xl font-black uppercase text-gray-300 italic tracking-widest">All clean. No reports.</p>
              </div>
            ) : (
              reportedPosts.map((post) => (
                <div key={post.id} className="bg-white border-4 border-black p-4 sm:p-6 brutalist-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-100 overflow-hidden">
                         <img src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}`} alt="" />
                       </div>
                       <div>
                         <p className="font-black text-xs uppercase italic">{post.authorName}</p>
                         <p className="text-[8px] font-bold text-red-500 uppercase flex items-center gap-1">
                           <ShieldAlert className="w-2.5 h-2.5" />
                           {post.reports?.length} Reports
                         </p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="p-2 border-2 border-black bg-gray-50 hover:bg-white rounded-lg transition-colors"
                        title="View Post"
                       >
                         <ExternalLink className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleClearReports(post.id)}
                        className="px-3 py-1 border-2 border-black bg-white hover:bg-green-500 hover:text-white rounded-lg font-black uppercase text-[10px] transition-colors"
                       >
                         Verify Real
                       </button>
                       <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 border-2 border-black bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                        title="Delete Post"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-700 bg-gray-50 border-2 border-black p-4 rounded-xl italic">
                    "{post.content}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
