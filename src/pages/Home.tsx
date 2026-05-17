import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { MapPin, Info, Activity, Newspaper, Calendar, Cloud, ChevronRight, X, Tag, IndianRupee, ShieldAlert, Users, MessageSquare, ArrowLeft, ArrowRight, Star, ShoppingBag, Sparkles, Zap } from 'lucide-react';
import { getLocalInfo } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import LocationPicker from '../components/common/LocationPicker';

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = !!user?.isAdmin;
  const [posts, setPosts] = useState<Post[]>([]);
  const [dealsCount, setDealsCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localData, setLocalData] = useState<any>(null);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [selectedHeadline, setSelectedHeadline] = useState<any>(null);

  const categoryPosts = {
    news: posts.filter(p => !p.type || p.type === 'news' || p.type === 'general'),
    market: posts.filter(p => p.type === 'market'),
    safety: posts.filter(p => p.type === 'alert'),
    deals: dealsCount
  };

  const navigateToSection = (section: 'news' | 'market' | 'safety' | 'deals') => {
    if (section === 'deals') {
      navigate('/deals');
    } else {
      navigate(`/section/${section}`);
    }
  };

  useEffect(() => {
    // Fetch total user count for community transparency
    const fetchUserCount = async () => {
      try {
        const { getCountFromServer } = await import('firebase/firestore');
        const coll = collection(db, 'users');
        const snapshot = await getCountFromServer(coll);
        setUserCount(snapshot.data().count);
      } catch (err) {
        console.error("Error fetching count", err);
      }
    };
    fetchUserCount();

    const fetchDealsCount = async () => {
      try {
        const { getCountFromServer } = await import('firebase/firestore');
        const coll = collection(db, 'deals');
        const snapshot = await getCountFromServer(coll);
        setDealsCount(snapshot.data().count);
      } catch (err) {
        console.error("Error fetching deals count", err);
      }
    };
    fetchDealsCount();

    const fetchLocalInfo = async () => {
      const areaName = user?.location?.areaName || 'Mumbai';
      const language = user?.language || 'en';
      const cacheKey = `local_info_${areaName}_${language}`;
      
      const cached = localStorage.getItem(cacheKey);
      let isFresh = false;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000)) {
            setLocalData(parsed.data);
            isFresh = true;
          } else if (parsed.weather) {
            setLocalData(parsed);
          }
        } catch (e) {
           console.error("Cache parse error", e);
        }
      }

      if (!isFresh) {
        setLoadingLocal(true);
        try {
          const data = await getLocalInfo(areaName, language);
          if (data) {
            setLocalData(data);
          }
        } catch (err) {
          console.error("Error fetching local info:", err);
        } finally {
          setLoadingLocal(false);
        }
      }
    };
    fetchLocalInfo();
  }, [user?.location?.areaName, user?.language]);

  useEffect(() => {
    if (!user?.location?.areaName) return;

    const q = query(
      collection(db, 'posts'),
      where('location.areaName', '==', user.location.areaName)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        let postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        // Sort in-memory to avoid index requirement for location + createdAt
        postsData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : Date.now());
          const timeB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : Date.now());
          return timeB - timeA;
        });

        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        console.error("Feed fetch error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.location?.areaName]);

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* App Header */}
      <header className="pt-4 sm:pt-12 px-4 sm:px-10 pb-8 flex flex-col gap-8 relative max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex flex-col flex-1 w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-6 overflow-x-auto no-scrollbar py-1 w-full flex-nowrap min-h-[40px]">
            <motion.span 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wider pro-shadow"
            >
               <Activity className="w-3 h-3" />
               <span className="whitespace-nowrap">SECURE CONNECTION: ACTIVE</span>
            </motion.span>
            <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-wider pro-shadow">
               <Users className="w-3 h-3 text-blue-500" />
               <span className="whitespace-nowrap">{userCount} {t('verified_users')}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-6xl md:text-8xl font-black tracking-tighter text-gray-900 flex flex-wrap gap-x-3 sm:gap-x-4 items-center">
            <span>INFORM</span>
            <span className="bg-gradient-to-r from-saffron via-white to-india-green bg-clip-text text-transparent">ME</span>
          </h1>
          
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <LocationPicker />

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl pro-shadow">
               <Activity className="w-4 h-4 text-saffron" />
               <span className="text-xs font-bold text-gray-700 uppercase">LIVE NETWORK</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end w-full md:w-auto bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 min-w-[200px]">
          <div className="flex items-center gap-4">
            <div className="text-5xl md:text-6xl font-bold tracking-tighter text-gray-900">
              {localData?.weather?.temp || '--°'}
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl">
               <Cloud className={`w-8 h-8 text-blue-500 ${loadingLocal ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center md:items-end">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{localData?.weather?.condition || 'Live Weather'}</p>
             <p className="text-sm font-black text-emerald-500 uppercase mt-1">HIN / MAR / ENG</p>
          </div>
        </div>
      </div>
    </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:px-10 space-y-12">
        {/* Interactive Sections Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* News Section */}
          <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigateToSection('news')}
            className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 cursor-pointer group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Newspaper className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Local News</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{categoryPosts.news.length} Reports Online</p>
            </div>
            <Activity className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-50 opacity-20 group-hover:scale-110 transition-transform" />
          </motion.div>

          {/* Market Section */}
          <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigateToSection('market')}
            className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 cursor-pointer group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all">
                <IndianRupee className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Local Prices</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{categoryPosts.market.length} Prices Available</p>
            </div>
            <Tag className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-50 opacity-20 group-hover:scale-110 transition-transform" />
          </motion.div>

          {/* Safety Section */}
          <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigateToSection('safety')}
            className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 cursor-pointer group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-all">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Safety & Alerts</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{categoryPosts.safety.length} Critical Alerts</p>
            </div>
            <Activity className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-50 opacity-20 group-hover:scale-110 transition-transform" />
          </motion.div>

          {/* Deals Section */}
          <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigateToSection('deals')}
            className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 cursor-pointer group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Local Deals</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{categoryPosts.deals} Offers Live</p>
            </div>
            <Tag className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-50 opacity-20 group-hover:scale-110 transition-transform" />
          </motion.div>

          {/* Events Section */}
          <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigate('/events')}
            className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 cursor-pointer group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Events</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local Gatherings</p>
            </div>
            <Users className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-50 opacity-20 group-hover:scale-110 transition-transform" />
          </motion.div>

          {/* Health Section */}
          <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigate('/health')}
            className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 cursor-pointer group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Health</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnostic Insights</p>
            </div>
            <Activity className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-50 opacity-20 group-hover:scale-110 transition-transform" />
          </motion.div>

          {/* AI Lab Section */}
          <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigate('/learn')}
            className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 cursor-pointer group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Star className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">English Lab</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Learn & Grow</p>
            </div>
            <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-50 opacity-20 group-hover:scale-110 transition-transform" />
          </motion.div>

          {/* AI Chat Section */}
          <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigate('/ai-chat')}
            className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 cursor-pointer group overflow-hidden relative"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">AI Assistant</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">24/7 Smart Guide</p>
            </div>
            <Zap className="absolute -bottom-6 -right-6 w-32 h-32 text-gray-50 opacity-20 group-hover:scale-110 transition-transform" />
          </motion.div>
        </section>

        {/* Regular Global Feed Below */}
        <section className="pt-12 border-t border-gray-100">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black italic tracking-tighter text-gray-900 uppercase">Latest Feed</h2>
            <div className="flex p-1 bg-gray-100 rounded-2xl gap-1">
               <button className="px-5 py-2 bg-white rounded-xl text-xs font-bold text-blue-600 pro-shadow">LIVE</button>
               <button onClick={() => navigate('/pulse')} className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase">Network Pulse</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-[40px] animate-pulse pro-shadow" />
              ))
            ) : posts.length > 0 ? (
              posts.slice(0, 100).map((post, index) => (
                <div key={post.id} className="contents">
                  <PostCard post={post} />
                  {index === 2 && (
                    <div className="bg-gradient-to-br from-gray-900 to-indigo-900 p-8 rounded-[40px] text-white pro-shadow relative overflow-hidden group">
                       <div className="relative z-10">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2 block">SPONSORED</span>
                          <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Partner with Us</h4>
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed mb-4">Promote your business to people in this area.</p>
                          <button className="text-[10px] font-black uppercase tracking-widest bg-white text-gray-900 px-6 py-2.5 rounded-xl hover:scale-105 transition-all">Contact Us</button>
                       </div>
                       <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12 group-hover:rotate-45 transition-transform" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 px-6 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 pro-shadow">
                  <Activity className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900 mb-2">No Posts Yet</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">No news found in <span className="text-indigo-600">{user?.location?.areaName || 'your area'}</span> yet. Be the first to share something!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
