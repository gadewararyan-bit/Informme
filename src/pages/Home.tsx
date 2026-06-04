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
import { ADMIN_EMAILS, INDIAN_STATES, STATE_FEATURE_TEMPLATES, STATE_MILESTONE_LEVELS } from '../constants';

function playAlertBuzzer() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc1.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.5);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc2.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.5);

    for (let t = 0.5; t < 3.0; t += 0.5) {
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime + t);
      osc1.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + t + 0.5);
    }

    gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 3.0);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();

    setTimeout(() => {
      try {
        osc1.stop();
        osc2.stop();
        audioCtx.close();
      } catch (e) {}
    }, 3000);
  } catch (err) {
    console.warn("Audio Context could not play:", err);
  }
}

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
  const [stateStats, setStateStats] = useState<{[key: string]: number}>({});
  const [stateShouts, setStateShouts] = useState<any[]>([]);
  const [newShoutContent, setNewShoutContent] = useState('');
  const [copiedStateLink, setCopiedStateLink] = useState(false);
  
  // Dynamic Milestone Config hooks
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('old_is_gold');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  
  const userStateCode = user?.homeState || user?.location?.homeState;
  const stateData = userStateCode ? INDIAN_STATES.find(s => s.code === userStateCode) : undefined;
  const registeredCount = userStateCode ? (stateStats[userStateCode] || 0) : 0;
  const targetPop = stateData?.targetPopulation || 2000000;
  const pct = Math.min(100, Math.round((registeredCount / targetPop) * 100));

  const [userStateConfig, setUserStateConfig] = useState<{[key: string]: string}>({
    level1: 'old_is_gold',
    level2: 'weather_pest',
    level3: 'traditional_medicine',
    level4: 'legal_aid',
    level5: 'property_marketplace',
    level6: 'lost_found',
    level7: 'youth_sports',
    level8: 'gram_polls',
    level9: 'cattle_trade',
    level10: 'audio_bulletin'
  });

  const [activeAlertZonePost, setActiveAlertZonePost] = useState<any | null>(null);
  const alertedPostIdsRef = React.useRef<Set<string>>(new Set());
  const initialLoadTimeRef = React.useRef<number>(Date.now());


  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats: {[key: string]: number} = {};
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const st = data.homeState || data.location?.homeState;
        if (st) {
          stats[st] = (stats[st] || 0) + 1;
        }
      });
      setStateStats(stats);
    }, (err) => {
      console.error("Error fetching state stats:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Load State-Specific Milestone Config
  useEffect(() => {
    const userState = user?.homeState || user?.location?.homeState;
    if (!userState) return;

    const docRef = doc(db, 'state_milestone_configs', userState);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.mappings) {
          setUserStateConfig(data.mappings);
          // Set initial set selected feature to level 1 config
          const firstFeature = data.mappings.level1 || 'old_is_gold';
          setSelectedFeatureId(firstFeature);
        }
      }
    }, (err) => {
      console.error("Error loading milestone config:", err);
    });
    return () => unsubscribe();
  }, [user?.homeState, user?.location?.homeState]);

  useEffect(() => {
    const userState = user?.homeState || user?.location?.homeState;
    if (!userState) return;

    const q = query(
      collection(db, 'posts'),
      where('isStateFeature', '==', true),
      where('homeState', '==', userState)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🚨 ALERT ZONE EVALUATION ENGINE 🚨
      const ALERT_ZONE_FEATURE_IDS = ['weather_pest', 'property_marketplace', 'lost_found'];
      shouts.forEach((sht: any) => {
        if (!user || sht.authorId === user.uid) return;
        if (!ALERT_ZONE_FEATURE_IDS.includes(sht.featureId)) return;

        const postTime = sht.createdAt?.seconds 
          ? sht.createdAt.seconds * 1000 
          : (sht.createdAt instanceof Date ? sht.createdAt.getTime() : (sht.createdAt ? new Date(sht.createdAt).getTime() : 0));

        // Trigger alarm for recent, unalerted posts (created within the last 15 seconds) or newer than page load
        const isRecent = postTime > initialLoadTimeRef.current - 15050;

        if (isRecent && !alertedPostIdsRef.current.has(sht.id)) {
          alertedPostIdsRef.current.add(sht.id);
          playAlertBuzzer();
          setActiveAlertZonePost(sht);
        }
      });

      shouts.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return timeB - timeA;
      });

      // Filter based on currently active/selected feature id
      const filtered = shouts.filter((sh: any) => {
        if (sh.featureId) {
          return sh.featureId === selectedFeatureId;
        }
        // Fallback for older legacy shouts: show them under level 1
        const level1Feat = userStateConfig.level1 || 'old_is_gold';
        return selectedFeatureId === level1Feat;
      });

      setStateShouts(filtered);
    }, (err) => {
      console.error("Error loading state shouts in Home:", err);
    });

    return () => unsubscribe();
  }, [user?.homeState, user?.location?.homeState, selectedFeatureId, userStateConfig, user]);

  const handleAddShout = async (e: React.FormEvent) => {
    e.preventDefault();
    const userState = user?.homeState || user?.location?.homeState;
    if (!userState || !newShoutContent.trim() || !user) return;

    try {
      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || 'Regional Citizen',
        authorPhoto: user.photoURL || null,
        content: newShoutContent.trim(),
        type: 'general',
        isStateFeature: true,
        homeState: userState,
        featureId: selectedFeatureId,
        createdAt: new Date(),
        likes: [],
        commentCount: 0,
        location: {
          areaName: user?.location?.areaName || 'Local Region'
        }
      });
      setNewShoutContent('');
    } catch (err) {
      console.error("Error posting state shout:", err);
    }
  };

  // Owner Contact / Sponsor Details States
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [ownerConfig, setOwnerConfig] = useState(() => ({
    upiId: localStorage.getItem('owner_upi_id') || '8600869341@upi',
    phone: localStorage.getItem('owner_phone') || '+918600869341'
  }));

  useEffect(() => {
    const unsubOwner = onSnapshot(doc(db, 'system_config', 'owner_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOwnerConfig({
          upiId: data.upiId || '8600869341@upi',
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

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'volume': return <Sparkles className="w-4 h-4 text-indigo-500" />;
      case 'mandi': return <ShoppingBag className="w-4 h-4 text-amber-500" />;
      case 'blood': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'book': return <Info className="w-4 h-4 text-blue-500" />;
      case 'jobs': return <Users className="w-4 h-4 text-emerald-500" />;
      case 'gift': return <Tag className="w-4 h-4 text-purple-500" />;
      case 'tractor': return <Activity className="w-4 h-4 text-indigo-500" />;
      case 'art': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'bus': return <MapPin className="w-4 h-4 text-cyan-500" />;
      case 'compass': return <Sparkles className="w-4 h-4 text-cyan-600" />;
      case 'bell': return <Zap className="w-4 h-4 text-yellow-550 animate-pulse" />;
      case 'home': return <MapPin className="w-4 h-4 text-sky-500" />;
      case 'swap': return <Tag className="w-4 h-4 text-amber-600" />;
      case 'health': return <Activity className="w-4 h-4 text-red-500" />;
      case 'map': return <MapPin className="w-4 h-4 text-teal-500" />;
      case 'shield': return <ShieldAlert className="w-4 h-4 text-orange-500" />;
      case 'cattle': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'leaf': return <Sparkles className="w-4 h-4 text-green-500" />;
      case 'drop': return <Cloud className="w-4 h-4 text-blue-400" />;
      case 'sparkles': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'scale': return <Info className="w-4 h-4 text-indigo-600" />;
      case 'search': return <Search className="w-4 h-4 text-indigo-500" />;
      case 'award': return <Star className="w-4 h-4 text-yellow-550" />;
      case 'check': return <Check className="w-4 h-4 text-emerald-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* App Header */}
      <header className="pt-4 sm:pt-12 px-4 sm:px-10 pb-8 flex flex-col gap-8 relative max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex flex-col flex-1 w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 overflow-x-auto no-scrollbar py-1 w-full flex-nowrap min-h-[40px]">
              <span className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50/80 border border-blue-100 rounded-full text-[10px] font-black text-blue-700 uppercase tracking-widest pro-shadow">
                👋 {user?.displayName ? `HELLO, ${user.displayName.toUpperCase()}` : 'WELCOME, GUEST'}
              </span>
              <span className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-medium text-gray-500 uppercase tracking-wider pro-shadow">
                <Users className="w-3 h-3 text-emerald-500" />
                <span className="whitespace-nowrap">{userCount} {t('verified_users')}</span>
              </span>
            </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <h1 className="text-3xl sm:text-6xl md:text-8xl font-black tracking-tighter text-gray-900 flex flex-wrap gap-x-3 sm:gap-x-4 items-center">
              <span>INFORM</span>
              <span className="bg-gradient-to-r from-saffron via-white to-india-green bg-clip-text text-transparent">ME</span>
            </h1>

            {userStateCode && stateData && (
              <button
                onClick={() => setShowMilestoneModal(true)}
                className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-[24px] shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-indigo-500/10"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-saffron"></span>
                </span>
                <span>{language === 'mr' ? `${stateData.nameMr} टप्पे` : `${stateData.nameEn} Milestones`}</span>
                <span className="bg-white/20 text-white px-2.5 py-1 rounded-xl text-[10px] font-mono font-black">{pct}%</span>
              </button>
            )}
          </div>
          
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:px-10 space-y-12">        {/* State-specific Launch Activation Dashboard */}
        {!user?.homeState && !user?.location?.homeState && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-8 rounded-[40px] border border-indigo-100 pro-shadow relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-black uppercase text-[10px] tracking-widest rounded-full">
                📍 Launch Protocol
              </span>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-indigo-950 mt-4">
                {language === 'mr' ? 'विशेष राज्यस्तरीय सेवा सुरू करा' : 'Unlock Your State-Specific Feature!'}
              </h2>
              <p className="text-sm font-bold text-indigo-500/80 uppercase tracking-tight mt-2 leading-relaxed">
                {language === 'mr' 
                  ? 'तुमच्या राज्याचे लोकसंख्येचे प्रमाण १०% ते ८०% गाठेल तेव्हा टप्प्याटप्प्याने २४ विशेष फिचर्स अनलॉक होतील! प्रगती पाहण्यासाठी तुमचे राहते राज्य निवडा.' 
                  : 'Get exclusive access to state-wide marketplace hubs and regional forums as your state progresses from 10% to 80% adoption! Enter your residing state in Settings to track progress.'}
              </p>
              <button 
                onClick={() => navigate('/settings')}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                Set Residing State <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-indigo-500/5 rotate-12" />
          </div>
        )}


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

      {/* 🚨 ALERT ZONE EMERGENCY OVERLAY MODAL 🚨 */}
      <AnimatePresence>
        {activeAlertZonePost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-md w-full rounded-[40px] border-4 border-rose-600 p-8 pro-shadow relative overflow-hidden text-center space-y-6"
            >
              {/* Spinning alert rings */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-pulse" />
              
              <div className="relative mx-auto w-24 h-24 bg-rose-50 border-4 border-rose-600/30 rounded-[32px] flex items-center justify-center animate-bounce">
                <ShieldAlert className="w-12 h-12 text-rose-600 animate-pulse" />
                <span className="absolute inset-0 rounded-[32px] border-4 border-rose-600 animate-ping opacity-60" />
              </div>

              <div>
                <span className="px-3.5 py-1.5 bg-rose-50 border border-rose-100 text-[10px] font-extrabold text-rose-600 tracking-widest uppercase rounded-full animate-pulse">
                  🚨 {language === 'mr' ? 'तात्काळ प्रादेशिक चेतावणी!' : 'Emergency Region Alert!'}
                </span>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mt-4 leading-none">
                  {language === 'mr' ? 'सतर्कता क्षेत्र चेतावणी' : 'Alert Zone Warning'}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {language === 'mr' ? '३ सेकंदाचा अलार्म तुमच्या राज्यात सुरवात झाला!' : '3-Second Buzzer Broadcasted in Your State!'}
                </p>
              </div>

              <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100/50 space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xs font-black text-rose-700 capitalize">
                    {activeAlertZonePost.authorName}
                  </span>
                  <span className="text-[8px] font-black tracking-widest uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                    {activeAlertZonePost.location?.areaName || 'Local Worker'}
                  </span>
                </div>
                <p className="text-xs text-gray-800 font-bold leading-relaxed italic select-all">
                  "{activeAlertZonePost.content}"
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={() => {
                    navigate(`/chat?userId=${activeAlertZonePost.authorId}&userName=${encodeURIComponent(activeAlertZonePost.authorName)}`);
                    setActiveAlertZonePost(null);
                  }}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-250 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  {language === 'mr' ? 'थेट चॅट सुरू करा' : 'Start Secure Chat Now'}
                </button>
                <button
                  onClick={() => setActiveAlertZonePost(null)}
                  className="w-full py-3 hover:bg-gray-100 font-black text-[10px] uppercase text-gray-400 tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  {language === 'mr' ? 'बंद करा' : 'Dismiss Alert'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 STATE MILESTONE TRACKER OVERLAY MODAL 🔮 */}
      <AnimatePresence>
        {showMilestoneModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white max-w-4xl w-full rounded-[40px] p-6 sm:p-8 pro-shadow border border-gray-100 relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6 z-10">
                <div>
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold uppercase text-[10px] tracking-widest rounded-full">
                     ⚡ State Milestone Tracker
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter mt-3 flex items-center gap-2 text-slate-900">
                    <span>{language === 'mr' ? stateData?.nameMr : stateData?.nameEn}</span>
                    <span className="text-indigo-600 font-black">({pct}%)</span>
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                    {language === 'mr' ? 'गाव व राज्य स्तरावर लोकमत व विकास टप्पे' : 'Provincial adoption census & system milestones'}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Zone */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-6">
                {/* Population and share board */}
                <div className="bg-gradient-to-br from-indigo-50/40 to-blue-50/20 border border-indigo-100/60 rounded-[32px] p-6 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase text-indigo-950 tracking-wider">
                        {language === 'mr' ? 'राज्य जनगणना उद्दिष्ट व प्रगती' : 'State adoption census goals'}
                      </h3>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                        {language === 'mr' ? `नोंदणी प्रगती: ${registeredCount.toLocaleString('en-IN')} / ${targetPop.toLocaleString('en-IN')} नागरिक` : `Progress: ${registeredCount.toLocaleString('en-IN')} / ${targetPop.toLocaleString('en-IN')} registered`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const shareText = `Join India Informer to help unlock ${stateData?.nameEn}'s exclusive dynamic community module! Unlock state alerts, wholesale network and direct forums. Register here: ${window.location.origin}`;
                        navigator.clipboard.writeText(shareText);
                        setCopiedStateLink(true);
                        setTimeout(() => setCopiedStateLink(false), 2000);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] w-full md:w-auto px-5 py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 pro-shadow cursor-pointer"
                    >
                      {copiedStateLink ? 'Link Copied!' : 'Invite Citizens'} <Copy className="w-3" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black uppercase text-gray-500 tracking-wider">
                    <span>{language === 'mr' ? 'प्रगती टक्केवारी' : 'Progress Rate'}</span>
                    <span className="text-indigo-600">{pct}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden relative border border-gray-50 p-0.5">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Progressive Milestones Board */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">
                     {language === 'mr' ? '१० प्रगतिशील अनलॉकिंग टप्पे (निवडण्यासाठी क्लिक करा)' : '10 Progressive Unlocking Milestones (Click Unlocked to Open)'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {STATE_MILESTONE_LEVELS.map((ml) => {
                        const levelKey = `level${ml.level}`;
                        const featureId = userStateConfig[levelKey];
                        const milestoneFeature = STATE_FEATURE_TEMPLATES.find(f => f.id === featureId);
                        const neededUsers = (ml.pct / 100) * targetPop;
                        const isUnlocked = registeredCount >= neededUsers;
                        const targetMembers = neededUsers;
                        const isSelected = selectedFeatureId === featureId;

                        return (
                           <div
                             key={ml.level}
                             onClick={() => {
                               if (isUnlocked && featureId) {
                                 setSelectedFeatureId(featureId);
                               }
                             }}
                             className={`p-4 rounded-3xl border transition-all text-left flex items-start gap-4 ${
                               isUnlocked 
                                 ? isSelected 
                                   ? 'bg-emerald-600 border-emerald-700 text-white shadow-md cursor-pointer scale-[1.01] ring-4 ring-emerald-100' 
                                   : 'bg-emerald-50/40 hover:bg-emerald-100 hover:border-emerald-200 border-emerald-100 text-slate-850 cursor-pointer'
                                 : 'bg-gray-50/60 border-gray-100 text-gray-400'
                             }`}
                           >
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                               isUnlocked 
                                 ? isSelected 
                                   ? 'bg-white text-emerald-600'
                                   : 'bg-emerald-500 text-white' 
                                 : 'bg-gray-200 text-gray-500'
                             }`}>
                               {ml.level}
                             </div>
                             
                             <div className="flex-1 space-y-1">
                               <div className="flex items-center justify-between gap-2">
                                 <h5 className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-white' : isUnlocked ? 'text-slate-900' : 'text-gray-400'}`}>
                                   {milestoneFeature ? (language === 'mr' ? milestoneFeature.titleMr : milestoneFeature.titleEn) : 'Feature Module'}
                                 </h5>
                                 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isSelected ? 'bg-emerald-700 text-white' : isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
                                   {ml.pct}%
                                 </span>
                               </div>
                               <p className={`text-[10px] leading-normal ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                                 {milestoneFeature ? (language === 'mr' ? milestoneFeature.descMr : milestoneFeature.descEn) : ''}
                               </p>
                               <div className="pt-2 border-t border-gray-100/40 flex justify-between items-center text-[9px] font-bold">
                                 <span className={isSelected ? 'text-white' : isUnlocked ? 'text-emerald-600' : 'text-gray-400'}>
                                   {isSelected ? (language === 'mr' ? '● चालू आहे' : '● Active Now') : isUnlocked ? (language === 'mr' ? '✓ अनलॉक केले' : '✓ Unlocked') : `${neededUsers.toLocaleString('en-IN')} ${language === 'mr' ? 'नागरिक लक्ष्य' : 'Citizens'}`}
                                 </span>
                                 {!isUnlocked && (
                                   <span className="text-orange-500">
                                      {language === 'mr' ? `अजून हवे: ${(neededUsers - registeredCount).toLocaleString('en-IN')}` : `Need ${(neededUsers - registeredCount).toLocaleString('en-IN')}`}
                                   </span>
                                 )}
                               </div>
                             </div>
                           </div>
                        );
                     })}
                  </div>
                </div>

                {/* Active Selected Feature Workspace */}
                <div className="border-t border-gray-100 pt-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold uppercase text-[10px] tracking-widest rounded-lg">
                       📍 {language === 'mr' ? 'निवडलेले सक्रिय फिचर' : 'Selected Active Module'}
                    </span>
                  </div>
                  {(() => {
                    const currentActiveFeature = STATE_FEATURE_TEMPLATES.find(f => f.id === selectedFeatureId);
                    const milestoneIndex = STATE_MILESTONE_LEVELS.findIndex(ml => userStateConfig[`level${ml.level}`] === selectedFeatureId);
                    const activeLevelInfo = milestoneIndex !== -1 ? STATE_MILESTONE_LEVELS[milestoneIndex] : null;

                    if (!currentActiveFeature) return null;
                    const neededUsers = activeLevelInfo ? (activeLevelInfo.pct / 100) * targetPop : 0;
                    const isUnlocked = activeLevelInfo && registeredCount >= neededUsers;

                    return (
                      <div className="bg-emerald-50/20 p-6 rounded-[32px] border border-emerald-100/60 transition-all">
                        {isUnlocked ? (
                          <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center pro-shadow shrink-0">
                                   {getFeatureIcon(currentActiveFeature.icon)}
                                </div>
                                <div className="text-left">
                                  <h3 className="text-sm font-black uppercase tracking-wide text-gray-900 leading-none">
                                    {language === 'mr' ? currentActiveFeature.titleMr : currentActiveFeature.titleEn}
                                  </h3>
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">
                                    {language === 'mr' ? 'अधिकृत प्रादेशिक सेवा सक्रिय!' : 'Official State Service Active!'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xl text-left">
                              {language === 'mr' ? currentActiveFeature.descMr : currentActiveFeature.descEn}
                            </p>

                            {/* State discussion forum form */}
                            <form onSubmit={handleAddShout} className="mb-4">
                              <div className="bg-white p-3 rounded-2xl border border-gray-100 pro-shadow flex items-center gap-3">
                                <input 
                                  type="text" 
                                  value={newShoutContent}
                                  onChange={(e) => setNewShoutContent(e.target.value)}
                                  placeholder={language === 'mr' ? currentActiveFeature.placeholderMr : currentActiveFeature.placeholderEn}
                                  className="bg-transparent border-none text-sm font-bold flex-1 focus:ring-0 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-none focus:ring-transparent"
                                  required
                                />
                                <button
                                  type="submit"
                                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer shrink-0"
                                >
                                  Shout
                                </button>
                              </div>
                            </form>

                            {/* Shouts Feed */}
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-3">
                              {stateShouts.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 font-bold uppercase text-[10px] tracking-wider bg-white rounded-2xl border border-gray-50">
                                  No updates yet for this feature. Be the first to start the feed!
                                </div>
                              ) : (
                                stateShouts.map((shout) => (
                                  <div key={shout.id} className="bg-white p-4 rounded-2xl border border-gray-50 pro-shadow text-left">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-900">{shout.authorName}</span>
                                        <span className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 text-[8px] font-bold text-gray-400 rounded uppercase">
                                          {shout.location?.areaName || 'Residency User'}
                                        </span>
                                      </div>
                                      <span className="text-[9px] font-bold text-gray-300 uppercase">
                                        {shout.createdAt?.toDate ? shout.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed text-left">{shout.content}</p>

                                    {/* Alert Zone Custom Dynamic Chat Action Bar */}
                                    {['weather_pest', 'property_marketplace', 'lost_found'].includes(selectedFeatureId) && (
                                      <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between flex-wrap gap-2">
                                        <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                                          {language === 'mr' ? 'सतर्कता विभाग कृती' : 'Alert Zone Active'}
                                        </span>
                                        {shout.authorId !== user?.uid ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowMilestoneModal(false);
                                              navigate(`/chat?userId=${shout.authorId}&userName=${encodeURIComponent(shout.authorName)}`);
                                            }}
                                            className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                                          >
                                            <MessageSquare className="w-3 h-3" />
                                            {language === 'mr' ? 'थेट चॅट सुरू करा' : 'Direct Chat'}
                                          </button>
                                        ) : (
                                          <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                                            {language === 'mr' ? 'तुमची पोस्ट' : 'Your Alert Post'}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-gray-500 space-y-6 max-w-md mx-auto">
                             <div className="relative mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
                                <span className="text-3xl text-red-500">🔒</span>
                             </div>

                             <h3 className="text-base font-black uppercase tracking-wide text-gray-900 leading-none">
                                {language === 'mr' ? 'हे फिचर सध्या कुलूपबंद आहे' : 'This feature is currently locked'}
                             </h3>

                             <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                                {language === 'mr' 
                                  ? `जेव्हा या राज्याची लोकसंख्या किमान ${neededUsers.toLocaleString('en-IN')} नागरिक होईल, तेव्हा हे फिचर थेट अनलॉक केले जाईल. इतर नागरिकांना आमंत्रित करा!`
                                  : `When this state's citizen count reaches at least ${neededUsers.toLocaleString('en-IN')} citizens, this feature will be added instantly. Invite others to unlock!`}
                             </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Other States progressive slider list */}
                <div className="border-t border-gray-100 pt-6 mt-6 text-left space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">
                     {language === 'mr' ? 'इतर राज्यांची प्रगती स्थिती' : 'Adoption Rates In Other States'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {INDIAN_STATES.filter(s => s.code !== userStateCode).map(other => {
                      const oCount = stateStats[other.code] || 0;
                      const oPct = Math.min(100, Math.round((oCount / other.targetPopulation) * 100));

                      return (
                        <div key={other.code} className="bg-white p-4 rounded-3xl border border-gray-100 pro-shadow flex flex-col justify-between text-left">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{other.code}</span>
                              <span className="text-[8px] font-bold text-gray-400 bg-gray-50 px-1 py-0.5 rounded uppercase">{oPct}%</span>
                            </div>
                            <h4 className="text-xs font-black uppercase text-gray-900 leading-tight">
                              {language === 'mr' ? other.nameMr : other.nameEn}
                            </h4>
                          </div>
                          <div className="mt-4">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">
                              {oCount.toLocaleString('en-IN')} / {other.targetPopulation.toLocaleString('en-IN')} {language === 'mr' ? 'नागरिक' : 'Citizens'}
                            </p>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                              <div className="h-full bg-indigo-500" style={{ width: `${oPct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Footer text */}
              <div className="mt-6 pt-4 border-t border-gray-100 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  India Informme State Growth Framework
                </p>
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shrink-0"
                >
                  {language === 'mr' ? 'बंद करा' : 'Got it'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
