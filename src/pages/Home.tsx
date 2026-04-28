import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Info, Activity, Newspaper, Calendar, Cloud, ChevronRight, X, Tag, IndianRupee, ShieldAlert } from 'lucide-react';
import { getLocalInfo } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

import { ADMIN_EMAIL } from '../constants';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const [posts, setPosts] = useState<Post[]>([]);
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
    const fetchLocalInfo = async () => {
      if (user?.location?.areaName) {
        // Try to load from cache first for instant UI
        const cacheKey = `local_info_${user.location.areaName}_${user.language || 'en'}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            setLocalData(JSON.parse(cached));
          } catch (e) {
             console.error("Cache parse error", e);
          }
        }

        setLoadingLocal(true);
        const data = await getLocalInfo(user.location.areaName, user.language || 'en');
        if (data) {
          setLocalData(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
        setLoadingLocal(false);
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Show all posts, translation is handled in PostCard
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.language]);

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* App Header */}
      <header className="pt-6 px-4 sm:px-10 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-[6px] border-black pb-6 gap-6 relative">
        {isAdmin && (
          <button 
            onClick={() => navigate('/admin')}
            className="absolute top-2 right-4 bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded border border-black brutalist-shadow-sm flex items-center gap-1 hover:bg-red-700 transition-colors z-10"
          >
            <ShieldAlert className="w-3 h-3" />
            Admin Dashboard
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="text-5xl sm:text-[80px] leading-[0.85] font-black uppercase tracking-tighter italic">
            inform<span className="text-saffron">m</span><span className="text-india-green">e</span>
          </h1>
          <div className="flex flex-wrap gap-x-2 gap-y-2 mt-4 sm:mt-6 font-bold text-[9px] sm:text-xs uppercase tracking-widest relative">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-india-green" />
              <span className="max-w-[80px] truncate">{user?.location?.areaName || 'Your Location'}</span>
              {user?.location?.pinCode && <span className="opacity-60 ml-0.5">[{user.location.pinCode}]</span>}
            </span>
            <span className="text-gray-300">/</span>
            <button 
              onClick={() => setIsChangingCity(!isChangingCity)}
              className="px-2 py-0.5 border-2 border-black hover:bg-black hover:text-white transition-colors text-[8px] sm:text-xs"
            >
              CHANGE
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-gray-300">/</span>
              <span className="text-india-green">Live Updates</span>
            </div>
            <span className="text-gray-300">/</span>
            <span className="bg-black text-white px-2 py-0.5 rounded-sm uppercase">{user?.language || 'en'}</span>

            {isChangingCity && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white border-4 border-black p-4 z-50 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Enter City"
                    className="flex-1 border-2 border-black px-2 py-1 text-xs"
                  />
                  <button 
                    onClick={() => handleCityChange(newCity)}
                    className="bg-black text-white px-2 py-1 text-[10px]"
                  >
                    OK
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {commonCities.map(city => (
                    <button
                      key={city}
                      onClick={() => handleCityChange(city)}
                      className="text-[10px] text-left hover:bg-saffron p-1 border border-transparent hover:border-black"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end w-full sm:w-auto">
          <div className="text-5xl sm:text-7xl font-black leading-none">{localData?.weather?.temp || '--°'}</div>
          <div className="text-[10px] sm:text-xs uppercase font-bold tracking-tight bg-black text-white px-3 py-1.5 mt-2 flex items-center gap-2">
            {localData?.weather?.condition || user?.location?.areaName || 'Loading...'}
            <Cloud className="w-4 h-4" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:p-10 space-y-12">
        {/* Headlines Section */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-2">
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase flex items-center gap-2">
               <Newspaper className="w-6 h-6 text-saffron" />
               Headlines
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingLocal ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse border-2 border-black" />
              ))
            ) : localData?.news?.slice(0, 4).map((item: any, i: number) => (
              <motion.div 
                key={i} 
                className="bg-[#F5F5F5] p-5 rounded-2xl border-2 border-black hover:bg-white transition-all group cursor-pointer"
                whileHover={{ y: -2 }}
                onClick={() => setSelectedHeadline(item)}
              >
                <p className="text-[8px] font-black uppercase text-saffron mb-2 tracking-widest">Flash News • {user?.location?.areaName}</p>
                <h4 className="text-sm sm:text-base font-black leading-tight mb-2 group-hover:italic">{item.title}</h4>
                <p className="text-[10px] font-bold text-gray-500 leading-tight line-clamp-2">{item.summary}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Headline Detail Modal */}
        {selectedHeadline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedHeadline(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-white border-4 border-black p-6 rounded-3xl brutalist-shadow relative z-10"
            >
              <button 
                onClick={() => setSelectedHeadline(null)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              <p className="text-[10px] font-black uppercase text-saffron mb-2 tracking-widest">Local Breaking News</p>
              <h3 className="text-2xl font-black italic uppercase leading-none mb-4">{selectedHeadline.title}</h3>
              <div className="bg-gray-50 border-2 border-black p-4 rounded-xl mb-6">
                <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                  {selectedHeadline.summary}
                </p>
              </div>
              <button 
                onClick={() => setSelectedHeadline(null)}
                className="w-full bg-black text-white py-3 font-black uppercase tracking-widest border-2 border-black hover:bg-gray-900 transition-colors"
              >
                Close Header
              </button>
            </motion.div>
          </div>
        )}

        {/* Market Rates Section */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-2">
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase flex items-center gap-2">
               <Tag className="w-6 h-6 text-saffron" />
               Live Market Rates
            </h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-48 h-32 bg-gray-100 rounded-2xl animate-pulse border-2 border-black shrink-0" />
              ))
            ) : posts.filter(p => p.type === 'market' && p.priceData).slice(0, 8).map((post, i) => (
              <motion.div 
                key={post.id} 
                className="w-48 shrink-0 bg-white p-4 rounded-2xl border-2 border-black snap-start brutalist-shadow cursor-pointer hover:bg-saffron/5"
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <p className="text-[8px] font-black uppercase text-gray-400 mb-1 tracking-widest">{post.authorName}</p>
                <h4 className="font-black text-xs leading-tight uppercase truncate mb-2">{post.priceData?.item}</h4>
                <div className="flex items-center justify-between mt-auto">
                   <div className="flex items-center text-sm font-black italic">
                      <IndianRupee className="w-3 h-3" />
                      {post.priceData?.price}
                   </div>
                   <span className="text-[8px] font-bold text-gray-400 uppercase">/{post.priceData?.unit}</span>
                </div>
              </motion.div>
            ))}
            {posts.filter(p => p.type === 'market').length === 0 && !loading && (
              <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-2xl text-center">
                 <p className="text-[10px] font-black uppercase text-gray-400">No live rates yet. Vendors, start posting!</p>
              </div>
            )}
          </div>
        </section>

        {/* Events Section */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-2">
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase flex items-center gap-2">
               <Calendar className="w-6 h-6 text-india-green" />
               Upcoming Events
            </h2>
            <button 
              onClick={() => navigate('/events')}
              className="text-[10px] font-black uppercase underline flex items-center gap-1"
            >
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar">
            {loadingLocal ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-64 h-32 bg-gray-100 rounded-2xl animate-pulse border-2 border-black shrink-0" />
              ))
            ) : localData?.events?.map((event: any, i: number) => (
              <motion.div 
                key={i} 
                className="w-64 shrink-0 bg-white p-4 rounded-2xl border-2 border-black snap-start brutalist-shadow cursor-pointer"
                whileHover={{ y: -4 }}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-india-green text-white rounded-lg flex flex-col items-center justify-center font-black shrink-0">
                    <span className="text-sm leading-none">{event.date.split(' ')[0]}</span>
                    <span className="text-[8px] uppercase">{event.date.split(' ')[1]}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-xs leading-tight uppercase line-clamp-2">{event.title}</h4>
                    <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{event.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-white border-4 border-black p-6 rounded-3xl brutalist-shadow relative z-10"
            >
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-india-green" />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Local Event</p>
              </div>
              <h3 className="text-2xl font-black italic uppercase leading-none mb-2">{selectedEvent.title}</h3>
              <p className="text-india-green font-black uppercase text-sm mb-6">{selectedEvent.date} @ {selectedEvent.location}</p>
              
              <div className="bg-blue-50 border-2 border-black p-4 rounded-xl mb-6">
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Join other community members for this local event. Verification and RSVP might be required for some events.
                </p>
              </div>
              
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-full bg-black text-white py-3 font-black uppercase tracking-widest border-2 border-black hover:bg-gray-900 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}

        {/* Local Feed Section */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-2">
            <h2 className="text-2xl sm:text-4xl font-black italic">LOCAL FEED</h2>
            <div className="flex gap-2 shrink-0">
              <span className="px-3 sm:px-4 py-1.5 bg-black text-white rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer">RECENT</span>
              <span className="px-3 sm:px-4 py-1.5 border-2 border-black rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition-colors">TOP</span>
            </div>
          </div>

          <div className="w-full">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-full h-80 bg-gray-100 animate-pulse rounded-2xl border-2 border-black mb-8" />
              ))
            ) : posts.length > 0 ? (
              posts.map(post => <div key={post.id} className="mb-4"><PostCard post={post} compact /></div>)
            ) : (
              <div className="text-center py-20 bg-[#F5F5F5] rounded-3xl border-4 border-dashed border-gray-200">
                <p className="text-xl font-black uppercase text-gray-400">Silence in {user?.location?.areaName || 'your area'}.</p>
                <p className="text-sm font-bold text-gray-300 mt-2 uppercase tracking-widest">Share the first update!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
