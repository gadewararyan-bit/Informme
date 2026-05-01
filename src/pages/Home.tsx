import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { MapPin, Info, Activity, Newspaper, Calendar, Cloud, ChevronRight, X, Tag, IndianRupee, ShieldAlert, Users, MessageSquare, ArrowLeft } from 'lucide-react';
import { getLocalInfo } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ADMIN_EMAILS } from '../constants';

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = !!user?.isAdmin;
  const [posts, setPosts] = useState<Post[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localData, setLocalData] = useState<any>(null);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [isChangingCity, setIsChangingCity] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [selectedHeadline, setSelectedHeadline] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const commonCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];

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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 md:px-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-8 space-y-16">
          {/* Headlines Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                 <Newspaper className="w-7 h-7 text-blue-600" />
                 Platform Headlines
              </h2>
              <p className="text-gray-400 text-sm font-medium">Verified local insights generated via AI nodes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loadingLocal && !localData ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-44 bg-white rounded-3xl animate-pulse pro-shadow" />
              ))
            ) : localData?.news && localData.news.length > 0 ? localData.news.slice(0, 4).map((item: any, i: number) => (
              <motion.div 
                key={i} 
                className="bg-white p-6 rounded-3xl pro-shadow border border-gray-100 ring-1 ring-black/[0.02] hover:ring-blue-500/50 transition-all cursor-pointer group"
                whileHover={{ y: -4 }}
                onClick={() => setSelectedHeadline(item)}
              >
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{item.title}</h4>
                <p className="text-[11px] font-medium text-gray-400 leading-relaxed line-clamp-3">{item.summary}</p>
              </motion.div>
            )) : (
              <div className="col-span-full py-16 bg-white rounded-[40px] border border-dashed border-gray-200 text-center flex flex-col items-center justify-center pro-shadow">
                <Newspaper className="w-12 h-12 text-gray-100 mb-4" />
                <p className="text-sm font-bold text-gray-300 uppercase tracking-widest leading-relaxed">No local headlines currently indexed for this area.</p>
              </div>
            )}
          </div>
        </section>

        {/* Market Rates Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                 <Tag className="w-7 h-7 text-orange-500" />
                 Market Hub
              </h2>
              <p className="text-gray-400 text-sm font-medium">Real-time commodity valuation from local operators.</p>
            </div>
          </div>
          
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x no-scrollbar">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-64 h-36 bg-white rounded-3xl animate-pulse pro-shadow shrink-0" />
              ))
            ) : posts.filter(p => p.type === 'market' && p.priceData).slice(0, 10).map((post) => (
              <motion.div 
                key={post.id} 
                className="w-64 shrink-0 bg-white p-6 rounded-3xl pro-shadow border border-gray-100 snap-start active:scale-95 transition-transform cursor-pointer"
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-tight truncate flex-1">{post.priceData?.item}</h4>
                  <div className="p-1.5 bg-orange-50 rounded-lg">
                    <Tag className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-auto">
                   <span className="text-2xl font-bold text-gray-900">₹{post.priceData?.price}</span>
                   <span className="text-[10px] font-bold text-gray-400 uppercase">per {post.priceData?.unit}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 mt-2 truncate uppercase">{post.authorName}</p>
              </motion.div>
            ))}
            {posts.filter(p => p.type === 'market').length === 0 && !loading && (
              <div className="w-full bg-white border border-dashed border-gray-200 p-12 rounded-[40px] text-center pro-shadow">
                 <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Market Feed: Standing By</p>
              </div>
            )}
          </div>
        </section>

        {/* Global Feed */}
        <section className="bg-white rounded-[40px] p-6 md:p-10 pro-shadow border border-gray-100">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">COMMUNITY INTEL</h2>
            <div className="flex p-1 bg-gray-50 rounded-2xl gap-1">
               <button className="px-5 py-2 bg-white rounded-xl text-xs font-bold text-blue-600 pro-shadow">RECENT</button>
               <button className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">TOP</button>
            </div>
          </div>

          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-full h-44 bg-gray-50 animate-pulse rounded-3xl" />
              ))
            ) : posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} compact />)
            ) : (
              <div className="text-center py-20">
                <Info className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                <p className="text-gray-300 font-bold uppercase tracking-widest">Awaiting primary data streams...</p>
              </div>
            )}
          </div>
        </section>
        </div>

        {/* Right Sidebar - AI Tooling */}
        <aside className="md:col-span-4 space-y-8 sticky top-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">{t('ai_tooling')}</h3>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/health')}
              className="w-full bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-emerald-100 transition-all text-left"
            >
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                     <Activity className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-gray-900 leading-none">{t('diagnostic_insights')}</h4>
                     <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">AI Health & Wellness</p>
                  </div>
               </div>
               <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
               </div>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/ai-chat')}
              className="w-full bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-purple-100 transition-all text-left"
            >
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                     <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-gray-900 leading-none">{t('ai_intelligence')}</h4>
                     <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">Smart Agent Guide</p>
                  </div>
               </div>
               <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:text-purple-500 group-hover:bg-purple-50 transition-all">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
               </div>
            </motion.button>
          </div>

          <div className="bg-gray-900 p-8 rounded-[40px] text-white pro-shadow relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Network Status</h4>
              <p className="text-2xl font-black italic tracking-tighter mb-4">SYSTEM NOMINAL</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Nodes Active: {userCount}</span>
              </div>
            </div>
            <Activity className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
          </div>
        </aside>
      </main>
    </div>
  );
}
