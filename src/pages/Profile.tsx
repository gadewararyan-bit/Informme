import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, signOut } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { LogOut, Settings as SettingsIcon, MapPin, Calendar, Edit3, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { ADMIN_EMAIL } from '../constants';

export default function Profile() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = (user?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) || 
                  (auth.currentUser?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching profile posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-screen">
      {/* Profile Header */}
      <div className="bg-white border-b-[6px] border-black p-4 sm:p-10 pt-16 relative overflow-hidden">
        {/* Design Accents */}
        <div className="absolute top-0 left-0 w-32 h-2 bg-saffron" />
        <div className="absolute top-0 right-0 w-32 h-2 bg-india-green" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10">
          <div className="relative">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&size=128`} 
              alt={user.displayName}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-4 border-black brutalist-shadow object-cover"
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl sm:text-[60px] leading-[0.8] font-black uppercase tracking-tighter italic">{user.displayName}</h1>
              {isAdmin && (
                <div className="bg-india-green text-white px-2 py-0.5 rounded border-2 border-black flex items-center gap-1 brutalist-shadow shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Owner</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-6">
              <span className="bg-black text-white px-3 py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{user.email}</span>
              <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                <MapPin className="w-3 h-3" />
                {user.location?.areaName || "Mumbai, India"}
              </span>
            </div>
            
            <p className="text-sm sm:text-xl font-bold leading-tight max-w-xl italic text-gray-700 px-4 sm:px-0">
              "{user.bio || "Local explorer and community member. Informing India, one update at a time."}"
            </p>

            <div className="flex gap-4 mt-8 flex-wrap justify-center sm:justify-start">
              <NavLink to="/settings">
                <button className="flex items-center gap-2 bg-black text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-gray-800 transition-all brutalist-shadow active:shadow-none">
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-india-green text-white px-5 sm:px-8 py-3 sm:py-4 border-4 border-black font-black uppercase tracking-widest text-xs sm:text-sm hover:bg-green-700 transition-all shadow-[12px_12px_0_0_rgba(0,0,0,1)] active:shadow-none translate-x-0 translate-y-0 active:translate-x-2 active:translate-y-2 group">
                    <ShieldAlert className="w-5 h-5 text-white group-hover:scale-125 transition-transform" />
                    Admin Panel (Owner)
                  </button>
                </NavLink>
              )}
              <NavLink to="/settings">
                <button className="flex items-center gap-2 bg-white border-4 border-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-blue-50 transition-all active:scale-[0.98]">
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
              </NavLink>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white border-4 border-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="flex sm:flex-col gap-6 items-center border-t sm:border-t-0 sm:border-l border-black/10 pt-6 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-center">
            <div className="text-center group cursor-pointer" title={`${100 - ((user.postCount || 0) % 100)} more posts for next reward!`}>
              <div className="text-3xl sm:text-4xl font-black italic leading-none">{user.postCount || 0}</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Total Posts</div>
            </div>
            <div className="w-px sm:h-px sm:w-full bg-black/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black italic leading-none text-india-green">₹{user.earnings || 0}</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Earnings</div>
            </div>
          </div>
        </div>

        {/* Rewards Progress Banner */}
        <div className="mt-10 p-4 border-4 border-black bg-blue-50 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full -mr-12 -mt-12" />
          <div className="relative z-10">
            <h3 className="font-black uppercase italic text-sm tracking-tighter">Contributor Reward Program</h3>
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-none mt-1">Get ₹10 every 100 useful posts!</p>
          </div>
          
          <div className="relative z-10 w-full sm:w-64 flex flex-col gap-1">
             <div className="flex justify-between text-[8px] font-black uppercase">
               <span>Progress: {(user.postCount || 0) % 100}/100</span>
               <span>{100 - ((user.postCount || 0) % 100)} to go</span>
             </div>
             <div className="h-4 bg-white border-2 border-black overflow-hidden">
               <div 
                 className="h-full bg-india-green border-r-2 border-black transition-all" 
                 style={{ width: `${(user.postCount || 0) % 100}%` }}
               />
             </div>
          </div>

          <button 
            onClick={() => {
              if ((user.earnings || 0) >= 10) {
                 alert("Reward redemption initiated! Our team will verify your contributions and reach out to your linked account for processing ₹" + user.earnings);
              }
            }}
            disabled={(user.earnings || 0) < 10}
            className={`relative z-10 px-4 py-2 border-2 border-black font-black uppercase text-[10px] tracking-widest transition-all ${
              (user.earnings || 0) >= 10 
              ? 'bg-saffron text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]' 
              : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
            }`}
          >
            Redeem Now
          </button>
        </div>
      </div>

      {/* User Activity Feed */}
      <main className="flex-1 p-4 sm:p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase">Activity</h2>
          <div className="p-1 px-3 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400">
            Timeline
          </div>
        </div>

        <div className="max-w-2xl">
          {loading ? (
            <div className="w-full h-80 bg-gray-100 animate-pulse rounded-2xl border-2 border-black" />
          ) : posts.length > 0 ? (
            posts.map(post => <div key={post.id}><PostCard post={post} /></div>)
          ) : (
            <div className="text-center py-20 bg-[#F5F5F5] rounded-3xl border-4 border-dashed border-gray-200">
              <p className="text-lg font-black uppercase text-gray-400">You haven't posted yet.</p>
              <button className="mt-4 text-xs font-black uppercase tracking-widest border-b-2 border-black">Create your first update</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
