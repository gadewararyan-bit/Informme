import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, signOut } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { LogOut, Settings as SettingsIcon, MapPin, Calendar, Edit3, ShieldAlert, ShieldCheck, Activity, Info, Grid, List, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL } from '../constants';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'services'>('posts');

  const isAdmin = user?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
    <div className="w-full flex flex-col min-h-screen relative overflow-hidden bg-white">
      {/* Profile Header (Instagram-ish) */}
      <div className="p-4 sm:p-10 pt-12">
        <div className="flex items-start gap-6 sm:gap-12 mb-8">
          {/* Avatar Area */}
          <div className="flex flex-col items-center shrink-0">
             <div className="relative">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&size=128`} 
                  alt={user.displayName}
                  className="w-20 h-20 sm:w-36 sm:h-36 rounded-full border-4 border-black object-cover"
                />
                {isAdmin && (
                  <div className="absolute -bottom-1 -right-1 bg-india-green text-white p-1 rounded-full border-2 border-black">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                )}
             </div>
             {isAdmin && (
               <button 
                onClick={() => navigate('/admin')}
                className="mt-2 bg-red-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded border border-black brutalist-shadow-sm flex items-center gap-1 hover:bg-red-700 transition-colors"
               >
                 <ShieldAlert className="w-2 h-2" />
                 Admin
               </button>
             )}
          </div>

          {/* Stats Area */}
          <div className="flex-1 pt-2 sm:pt-6">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter truncate max-w-[150px] sm:max-w-none">{user.displayName}</h1>
              {isAdmin && (
                <span className="text-[8px] font-black uppercase text-india-green border border-india-green px-1.5 py-0.5 rounded">Owner</span>
              )}
            </div>
            
            <div className="flex gap-6 sm:gap-12">
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-2xl font-black italic">{user.postCount || 0}</div>
                <div className="text-[8px] font-black uppercase text-gray-400">Posts</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-2xl font-black italic text-india-green">₹{user.earnings || 0}</div>
                <div className="text-[8px] font-black uppercase text-gray-400">Earnings</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-2xl font-black italic text-blue-600">Lvl {Math.floor((user.postCount || 0) / 10) + 1}</div>
                <div className="text-[8px] font-black uppercase text-gray-400">Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-1 mb-8">
          <h2 className="text-sm font-black uppercase italic tracking-widest">{user.displayName}</h2>
          <p className="text-xs sm:text-sm font-medium italic text-gray-700 leading-tight">
            {user.bio || "Local news contributor and community member."}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-400">
            <MapPin className="w-3 h-3" />
            {user.location?.areaName || "Mumbai, India"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-8">
          <NavLink to="/settings" className="flex-1">
            <button className="w-full bg-black text-white py-2.5 rounded-lg font-black uppercase tracking-widest text-[10px] sm:text-xs">
              Edit Profile
            </button>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className="flex-1">
              <button className="w-full bg-india-green text-white py-2.5 rounded-lg border-2 border-black font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2">
                <ShieldAlert className="w-3 h-3" />
                Admin Panel
              </button>
            </NavLink>
          )}
          <button 
            onClick={handleLogout}
            className="px-4 bg-white border-2 border-black rounded-lg font-black uppercase tracking-widest text-[10px] hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Banner (Rewards) */}
        <div className="p-4 border-2 border-black bg-gray-50 rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-[10px] font-black uppercase italic tracking-tighter">Reward Progress</h3>
              <p className="text-[8px] font-bold text-gray-500 uppercase">{(user.postCount || 0) % 100}/100 posts for ₹10</p>
            </div>
            {(user.earnings || 0) >= 10 && (
              <button className="text-[8px] font-black uppercase bg-saffron text-white px-2 py-1 rounded border border-black animate-pulse">Claim</button>
            )}
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black rounded-full" 
              style={{ width: `${(user.postCount || 0) % 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t-2 border-black mt-4">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex flex-col items-center py-3 transition-colors ${activeTab === 'posts' ? 'border-t-2 border-black -mt-[2px]' : 'text-gray-400'}`}
        >
          <Grid className="w-5 h-5 mb-1" />
          <span className="text-[8px] font-black uppercase">Your Posts</span>
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`flex-1 flex flex-col items-center py-3 transition-colors ${activeTab === 'services' ? 'border-t-2 border-black -mt-[2px]' : 'text-gray-400'}`}
        >
          <Layout className="w-5 h-5 mb-1" />
          <span className="text-[8px] font-black uppercase">Services</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' ? (
            <motion.div 
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              {loading ? (
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 pb-24">
                  {posts.map(post => <PostCard key={post.id} post={post} compact />)}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Grid className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-black uppercase text-gray-400 tracking-widest italic">No posts yet.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-6 pb-24"
            >
              <h2 className="text-lg font-black uppercase italic tracking-tight border-b-2 border-black pb-2">AI Tools</h2>
              
              <div className="space-y-4">
                <div 
                  onClick={() => navigate('/health')}
                  className="p-4 bg-india-green border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] cursor-pointer group active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black text-white italic leading-none mb-1 uppercase">Health Advice</h3>
                    <p className="text-[8px] font-bold text-white uppercase tracking-widest opacity-80">AI Weight & Diet Tips</p>
                  </div>
                  <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center">
                    <Activity className="w-5 h-5 text-black" />
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/ai-chat')}
                  className="p-4 bg-purple-600 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] cursor-pointer group active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black text-white italic leading-none mb-1 uppercase">AI Assistant</h3>
                    <p className="text-[8px] font-bold text-white uppercase tracking-widest opacity-80">Step-by-Step Guidance</p>
                  </div>
                  <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center">
                    <Info className="w-5 h-5 text-black" />
                  </div>
                </div>
              </div>

               <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                  <p className="text-[10px] font-black uppercase text-gray-400">More services coming soon</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
