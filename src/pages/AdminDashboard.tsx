import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { Users, IndianRupee, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ADMIN_EMAIL } from '../constants';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email?.trim().toLowerCase() !== ADMIN_EMAIL.trim().toLowerCase()) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
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

  if (user?.email?.trim().toLowerCase() !== ADMIN_EMAIL.trim().toLowerCase()) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 mb-2 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Admin Dashboard</h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Manage Rewards & Users</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white border-4 border-black p-4 brutalist-shadow text-center min-w-[120px]">
              <div className="text-2xl font-black italic">{users.length}</div>
              <div className="text-[8px] font-black uppercase text-gray-400">Total Users</div>
            </div>
            <div className="bg-india-green border-4 border-black p-4 brutalist-shadow text-center min-w-[120px] text-white">
              <div className="text-2xl font-black italic">₹{users.reduce((acc, curr) => acc + (curr.earnings || 0), 0)}</div>
              <div className="text-[8px] font-black uppercase opacity-80">Pending Payouts</div>
            </div>
          </div>
        </header>

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
      </div>
    </div>
  );
}
