import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { MapPin, Info, Activity, Newspaper, Calendar, Cloud, ChevronRight, X, Tag, IndianRupee, ShieldAlert, Users, MessageSquare, ArrowLeft, ArrowRight, Star, ShoppingBag, Sparkles, Zap, Search, Phone, Copy, Check } from 'lucide-react';
import { getLocalInfo } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import LocationPicker from '../components/common/LocationPicker';
import { ADMIN_EMAILS } from '../constants';

export default function Home() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = !!user?.isAdmin || 
                  (user?.email ? ADMIN_EMAILS.includes(user.email.trim().toLowerCase()) : false) || 
                  (user?.displayName ? user.displayName.toLowerCase().trim() === 'aryan gadewar' : false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [dealsCount, setDealsCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localData, setLocalData] = useState<any>(null);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [selectedHeadline, setSelectedHeadline] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Owner Contact / Sponsor Details States
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [ownerConfig, setOwnerConfig] = useState(() => ({
    upiId: localStorage.getItem('owner_upi_id') || '8600869341@okaxis',
    phone: localStorage.getItem('owner_phone') || '+918600869341'
  }));

  useEffect(() => {
    const unsubOwner = onSnapshot(doc(db, 'system_config', 'owner_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOwnerConfig({
          upiId: data.upiId || '8600869341@okaxis',
          phone: data.phone || '+918600869341'
        });
      }
    });
    return () => unsubOwner();
  }, []);

  const filteredPosts = posts.filter(post => {
    // Category filtering
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'news') {
        const type = post.type || 'news';
        if (type !== 'news' && type !== 'general') return false;
      } else {
        if (post.type !== selectedCategory) return false;
      }
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const contentMatch = post.content?.toLowerCase().includes(q) || false;
      const authorMatch = post.authorName?.toLowerCase().includes(q) || false;
      const priceMatch = post.priceData?.item?.toLowerCase().includes(q) || false;
      const venueMatch = post.eventDetails?.venue?.toLowerCase().includes(q) || false;
      return contentMatch || authorMatch || priceMatch || venueMatch;
    }

    return true;
  });

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
          if (parsed.timestamp && (Date.now() - parsed.timestamp < 1 * 60 * 60 * 1000)) {
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
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black italic tracking-tighter text-gray-900 uppercase">
                {language === 'mr' ? 'लेटेस्ट फीड' : language === 'hi' ? 'ताज़ा फीड' : 'Latest Feed'}
              </h2>
              <div className="flex p-1 bg-gray-100 rounded-2xl gap-1 shrink-0">
                 <button className="px-5 py-2 bg-white rounded-xl text-xs font-bold text-blue-600 pro-shadow">LIVE</button>
                 <button onClick={() => navigate('/pulse')} className="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase">Network Pulse</button>
              </div>
            </div>

            {/* Premium Search and Filtering Controls Row */}
            <div className="w-full bg-white p-5 rounded-[32px] border border-gray-100 pro-shadow flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'mr' 
                      ? "बातम्या, कार्यक्रम, बाजारभाव किंवा शब्द शोधा..." 
                      : language === 'hi' 
                        ? "समाचार, कार्यक्रम, बाजार भाव या शब्द खोजें..." 
                        : "Search news, events, market, or keywords..."
                  }
                  className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-50 rounded-2xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all uppercase tracking-wider"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Horizontal Category Filtering */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto py-1 scroll-smooth">
                {[
                  { id: 'all', en: 'All Feed', mr: 'सर्व फीड', hi: 'सभी फीड' },
                  { id: 'news', en: 'News', mr: 'बातम्या', hi: 'समाचार' },
                  { id: 'event', en: 'Events', mr: 'कार्यक्रम', hi: 'आयोजन' },
                  { id: 'alert', en: 'Alerts', mr: 'इशारे', hi: 'चेतावनियाँ' },
                  { id: 'market', en: 'Market', mr: 'बाजार भाव', hi: 'बाज़ार भाव' },
                  { id: 'weather', en: 'Weather', mr: 'हवामान', hi: 'मौसम' }
                ].map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const label = language === 'mr' ? cat.mr : language === 'hi' ? cat.hi : cat.en;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex-shrink-0 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
                        isActive
                          ? 'bg-gray-900 border-gray-900 text-white pro-shadow scale-102 font-black'
                          : 'bg-gray-50 border-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-[40px] animate-pulse pro-shadow" />
              ))
            ) : filteredPosts.length > 0 ? (
              filteredPosts.slice(0, 100).map((post, index) => (
                <div key={post.id} className="contents">
                  <PostCard post={post} />
                  {index === 2 && (
                    <div className="bg-gradient-to-br from-gray-900 to-indigo-900 p-8 rounded-[40px] text-white pro-shadow relative overflow-hidden group">
                       <div className="relative z-10">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2 block">SPONSORED</span>
                          <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Partner with Us</h4>
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed mb-4">Promote your business to people in this area.</p>
                          <button 
                            onClick={() => setPartnerModalOpen(true)}
                            className="text-[10px] font-black uppercase tracking-widest bg-white text-gray-900 px-6 py-2.5 rounded-xl hover:scale-105 transition-all cursor-pointer"
                          >
                            Contact Us
                          </button>
                       </div>
                       <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12 group-hover:rotate-45 transition-transform" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 px-6 text-center bg-white rounded-[40px] border border-gray-100 pro-shadow">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 pr-0.5">
                  <Search className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900 mb-2">
                  {language === 'mr' ? 'काहीही सापडले नाही' : language === 'hi' ? 'कुछ नहीं मिला' : 'No Details Found'}
                </h3>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                  {language === 'mr' 
                    ? "तुमच्या शोध किंवा निवडलेल्या कैटेगरीशी जुळणारे कोणतेही पोस्ट सापडले नाही. कृपया पुन्हा प्रयत्न करा!" 
                    : language === 'hi'
                      ? "आपकी खोज या चयनित वर्ग से कोई पोस्ट मेल नहीं खाती। कृपया फिर से प्रयास करें!"
                      : "No posts found matching your search. Clear your filters or try another query!"}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Sponsor modal */}
      <AnimatePresence>
        {partnerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPartnerModalOpen(false)}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[40px] px-8 py-10 w-full max-w-lg pro-shadow border border-gray-100 relative z-10 overflow-hidden text-[#0D1B2A]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setPartnerModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto pro-shadow text-white">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                
                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900">
                  {language === 'mr' ? 'आपला व्यवसाय वाढवा' : language === 'hi' ? 'अपना व्यवसाय बढ़ाएं' : 'Promote Your Business'}
                </h3>
                
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                  {language === 'mr' 
                    ? 'या भागातील हजारो नागरिकांपर्यंत तुमच्या व्यवसायाची जाहिरात पोहोचवा!' 
                    : language === 'hi'
                      ? 'इस क्षेत्र के हजारों नागरिकों तक अपने व्यवसाय का विज्ञापन पहुंचाएं!'
                      : 'Reach thousands of active local citizens in this area with dynamic sponsors!'}
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {/* Call & WhatsApp Box */}
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                    {language === 'mr' ? 'थेट संपर्क साधा' : language === 'hi' ? 'सीधा संपर्क करें' : 'Direct Contacts (Owner)'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Call Owner Button */}
                    <a
                      href={`tel:${ownerConfig.phone}`}
                      className="flex items-center justify-center gap-2 px-5 py-4 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-all pro-shadow cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-indigo-500" />
                      {language === 'mr' ? 'कॉल करा' : language === 'hi' ? 'कॉल करें' : 'Call Owner'}
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/${ownerConfig.phone.replace(/[^0-9]/g, '')}?text=Hi%20Aryan,%20I%20want%20to%20partner%20with%20InformMe%20for%20advertising%20my%20business!`}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="flex items-center justify-center gap-2 px-5 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all pro-shadow cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {language === 'mr' ? 'व्हॉट्सॲप' : language === 'hi' ? 'व्हाट्सएप' : 'WhatsApp'}
                    </a>
                  </div>
                </div>

                {/* UPI Support Box */}
                <div className="bg-indigo-950 text-white rounded-3xl p-6 relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">
                      {language === 'mr' ? 'पेमेंट आणि मदत' : language === 'hi' ? 'भुगतान और सहायता' : 'Campaign Payments & Support'}
                    </span>
                    
                    <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold leading-relaxed">
                      {language === 'mr' 
                        ? 'थेट पेमेंट किंवा सपोर्टसाठी यूपीआय वापरा:' 
                        : language === 'hi'
                          ? 'सीधे भुगतान या सहायता के लिए यूपीआई का उपयोग करें:'
                          : 'Use UPI ID for campaign bookings or instant activation:'}
                    </p>

                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3">
                      <code className="text-[11px] font-mono text-indigo-200 font-bold select-all break-all pr-2">
                        {ownerConfig.upiId}
                      </code>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ownerConfig.upiId);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer flex-shrink-0"
                        title="Copy UPI Address"
                      >
                        {copiedUpi ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  INFORMME NETWORK • ACTIVE 24/7
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
