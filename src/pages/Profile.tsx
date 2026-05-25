import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, signOut } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { LogOut, Settings as SettingsIcon, MapPin, Calendar, Edit3, ShieldAlert, ShieldCheck, Activity, Info, Grid, List, Layout, ArrowLeft, MessageSquare, Zap, Crown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ADMIN_EMAILS } from '../constants';

import SeedingTool from '../components/admin/SeedingTool';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'services'>('posts');

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email.trim().toLowerCase()) : false;

  useEffect(() => {
    if (!user) return;

    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(postsQuery, 
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        console.error("Profile posts fetch error:", error);
        // If index is missing, try falling back to simple where
        if (error.message.includes('index')) {
          const fallbackQuery = query(
            collection(db, 'posts'),
            where('authorId', '==', user.uid)
          );
          onSnapshot(fallbackQuery, (fallbackSnapshot) => {
            const postsData = fallbackSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Post[];
            // Sort locally
            postsData.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            });
            setPosts(postsData);
            setLoading(false);
          });
        }
      }
    );

    return () => unsubscribePosts();
  }, [user]);

  const handleLogout = () => signOut(auth);

  if (!user) return null;

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F8F9FA] max-w-[500px] mx-auto overflow-hidden">
      {/* Profile Header */}
      <div className="p-6 pt-10">
        <div className="flex items-center gap-6 mb-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[32px] overflow-hidden pro-shadow ring-4 ring-white">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            {isAdmin && (
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl border-2 border-white pro-shadow">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{user.displayName}</h1>
              {isAdmin && (
                <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase mb-1">
                  ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-tight">{user.location?.areaName || "Your Location"}</span>
            </div>
            
              <div className="flex gap-4 mt-6">
              <div>
                <p className="text-lg font-black text-gray-900 leading-none">{user.postCount || 0}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('contributions')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white p-5 rounded-[28px] pro-shadow border border-gray-100 mb-8">
           <p className="text-gray-600 text-xs font-medium leading-relaxed italic">
             "{user.bio || "Active local news contributor focusing on verified updates for the community."}"
           </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
           <button 
             onClick={() => navigate('/settings')}
             className="bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-colors"
           >
             {t('edit_profile')}
           </button>
           <button 
             onClick={handleLogout}
             className="bg-white text-red-600 border border-red-100 py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
           >
             <LogOut className="w-4 h-4" />
             {t('logout')}
           </button>
        </div>

        {/* Manage App Section (Always Visible for Admins) */}
        {isAdmin && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Manage App</h3>
              </div>
              <button 
                onClick={() => navigate('/owner-portal')}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                Open Owner Portal
              </button>
            </div>
            <SeedingTool />
          </div>
        )}
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-gray-100 px-6">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'posts' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          {t('gallery')}
          {activeTab === 'posts' && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'services' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          {t('ai_tooling')}
          {activeTab === 'services' && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button 
          onClick={() => navigate('/pulse')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-blue-600 transition-colors`}
        >
          {t('nav_pulse')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' ? (
            <motion.div 
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-50 rounded-3xl animate-pulse" />)}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4 pb-12">
                   {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              ) : (
                <div className="py-20 text-center">
                   <Grid className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No posts yet</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pb-12"
            >
              {/* No more Admin section here, it is moved up */}
              <div 
                onClick={() => navigate('/health')}
                className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-emerald-100 transition-all"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                       <Activity className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-gray-900 leading-none">{t('diagnostic_insights')}</h4>
                       <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">Healthy Living Tips</p>
                    </div>
                 </div>
                 <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                 </div>
              </div>

              <div 
                onClick={() => navigate('/ai-chat')}
                className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-purple-100 transition-all"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                       <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-gray-900 leading-none">{t('ai_intelligence')}</h4>
                       <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">AI Assistant & Guide</p>
                    </div>
                 </div>
                 <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:text-purple-500 group-hover:bg-purple-50 transition-all">
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
