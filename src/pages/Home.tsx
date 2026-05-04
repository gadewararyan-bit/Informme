import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { MapPin, Info, Activity, Newspaper, Calendar, Cloud, ChevronRight, X, Tag, IndianRupee, ShieldAlert, Users, MessageSquare, ArrowLeft, ArrowRight, Star, ShoppingBag, Sparkles } from 'lucide-react';
import { getLocalInfo } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection as fbCollection, query as fbQuery, orderBy as fbOrderBy, limit as fbLimit, onSnapshot as fbOnSnapshot } from 'firebase/firestore';

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
  const [isChangingCity, setIsChangingCity] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [selectedHeadline, setSelectedHeadline] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<'news' | 'market' | 'safety' | 'deals' | null>(null);

  const commonCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];

  const categoryPosts = {
    news: posts.filter(p => !p.type || p.type === 'news'),
    market: posts.filter(p => p.type === 'market'),
    safety: posts.filter(p => p.type === 'alert'),
    deals: dealsCount
  };

  const navigateToSection = (section: 'news' | 'market' | 'safety' | 'deals') => {
    if (section === 'deals') {
      navigate('/deals');
    } else {
      setSelectedSection(section);
    }
  };

  const handleCityChange = async (city: string) => {
    if (!user) return;
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'location.areaName': city
      });
      setIsChangingCity(false);
    } catch (err) {
      console.error('Error updating city:', err);
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
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        console.error("Feed fetch error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.language]);

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
               <span className="whitespace-nowrap">{t('secure_node_active')}</span>
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl pro-shadow">
               <MapPin className="w-4 h-4 text-india-green" />
               <span className="text-xs font-bold text-gray-700 uppercase">{user?.location?.areaName || 'Detecting Location...'}</span>
               <button 
                 onClick={() => setIsChangingCity(!isChangingCity)}
                 className="ml-2 p-1 hover:bg-gray-50 rounded-lg text-blue-600 transition-colors"
               >
                 <ChevronRight className={`w-4 h-4 transition-transform ${isChangingCity ? 'rotate-90' : ''}`} />
               </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl pro-shadow">
               <Activity className="w-4 h-4 text-saffron" />
               <span className="text-xs font-bold text-gray-700 uppercase">LIVE NETWORK</span>
            </div>

            {isChangingCity && (
              <div className="absolute top-full left-4 mt-2 w-72 bg-white rounded-2xl pro-shadow border border-gray-100 p-4 z-50">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Search city..."
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:ring-2 ring-blue-100 outline-none"
                  />
                  <button 
                    onClick={() => handleCityChange(newCity)}
                    className="bg-blue-600 text-white px-3 py-2 text-xs font-bold rounded-xl"
                  >
                    GO
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {commonCities.map(city => (
                    <button
                      key={city}
                      onClick={() => handleCityChange(city)}
                      className="text-[10px] text-left hover:bg-gray-50 p-2 rounded-lg font-bold text-gray-600 truncate"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{localData?.weather?.condition || 'Real-time Atmos'}</p>
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
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Market Watch</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{categoryPosts.market.length} Prices Indexed</p>
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
        </section>

        {/* Dynamic Detail Panel (The One Frame Concept) */}
        <AnimatePresence>
          {selectedSection && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-[48px] pro-shadow border border-gray-100 overflow-hidden relative"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-4">
                      {selectedSection === 'news' && <Newspaper className="w-8 h-8 text-blue-600" />}
                      {selectedSection === 'market' && <IndianRupee className="w-8 h-8 text-orange-600" />}
                      {selectedSection === 'safety' && <ShieldAlert className="w-8 h-8 text-rose-600" />}
                      <div>
                         <h2 className="text-4xl font-black italic tracking-tighter uppercase">
                            {selectedSection === 'news' ? 'Local News Bureau' : selectedSection === 'market' ? 'Local Commodity Index' : 'Emergency & Local Alerts'}
                         </h2>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Deep Intelligence for {user?.location?.areaName || 'Your Vicinity'}</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => setSelectedSection(null)}
                    className="p-4 bg-gray-50 rounded-[20px] text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedSection && selectedSection !== 'deals' && (categoryPosts[selectedSection] as Post[]).length > 0 ? (
                    (categoryPosts[selectedSection] as Post[]).slice(0, 50).map((post) => (
                      <div 
                        key={post.id}
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="bg-gray-50 p-6 rounded-[32px] hover:bg-white border border-transparent hover:border-gray-100 hover:pro-shadow transition-all cursor-pointer group"
                      >
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{post.authorName}</span>
                            <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-900 transition-colors" />
                         </div>
                         <h4 className="font-bold text-gray-900 mb-3 leading-snug line-clamp-2">{post.content}</h4>
                         {post.priceData && (
                            <div className="mt-auto flex items-baseline gap-1">
                               <span className="text-xl font-black text-gray-900">₹{post.priceData.price}</span>
                               <span className="text-[9px] font-black text-gray-400 uppercase">/ {post.priceData.unit}</span>
                            </div>
                         )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                       <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">No primary data nodes found in this sector.</p>
                       {isAdmin && (
                         <div className="mt-6 p-12 border-2 border-dashed border-gray-200 rounded-[40px] max-w-md mx-auto">
                            <p className="text-xs font-bold text-gray-400 mb-6 italic">Developer Tip: Go to Profile &rarr; Admin Privileges to seed 500 sample posts instantly.</p>
                            <button 
                              onClick={() => navigate('/profile')}
                              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all pro-shadow"
                            >
                              Sync 500 Posts Now
                            </button>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2 block">SPONSORED NODE</span>
                          <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Partner with InformMe</h4>
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed mb-4">Promote your local business to 500+ active users in this sector.</p>
                          <button className="text-[10px] font-black uppercase tracking-widest bg-white text-gray-900 px-6 py-2.5 rounded-xl hover:scale-105 transition-all">Contact Sales</button>
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
                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900 mb-2">Network Idle</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">No primary data nodes found in this sector. Propagation will begin once users interact with the local node.</p>
                
                {isAdmin && (
                  <div className="mt-8 pt-8 border-t border-gray-100 max-w-sm mx-auto">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 italic">Creator Protocol: Initialize with 100+ simulated nodes.</p>
                    <button 
                      onClick={() => navigate('/profile')}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all pro-shadow flex items-center gap-2 mx-auto"
                    >
                      Sync 100 Posts Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
