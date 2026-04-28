import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Info, Activity } from 'lucide-react';
import { getLocalInfo } from '../services/aiService';
import { useNavigate } from 'react-router-dom';

import { ADMIN_EMAIL } from '../constants';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (user?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) || 
                  (auth.currentUser?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<{ temp: string; condition: string } | null>(null);
  const [isChangingCity, setIsChangingCity] = useState(false);
  const [newCity, setNewCity] = useState('');

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
    const fetchWeather = async () => {
      if (user?.location?.areaName) {
        const data = await getLocalInfo(user.location.areaName, user.language || 'en');
        if (data?.weather) {
          setWeather(data.weather);
        }
      }
    };
    fetchWeather();
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
    <div className="max-w-4xl mx-auto flex flex-col min-h-screen">
      {/* App Header */}
      <header className="pt-8 px-4 sm:px-10 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-[6px] border-black pb-6 gap-6">
        <div className="flex flex-col">
          <h1 className="text-5xl sm:text-[100px] leading-[0.8] font-black uppercase tracking-tighter italic">
            inform<span className="text-saffron">m</span><span className="text-india-green">e</span>
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 sm:mt-6 font-bold text-[10px] sm:text-xs uppercase tracking-widest relative">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-india-green" />
              {user?.location?.areaName || 'Your Location'}
            </span>
            <span className="text-gray-300">/</span>
            <button 
              onClick={() => setIsChangingCity(!isChangingCity)}
              className="px-2 py-0.5 border-2 border-black hover:bg-black hover:text-white transition-colors"
            >
              CHANGE CITY
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-india-green">Live Updates</span>
            <span className="text-gray-300">/</span>
            <span className="bg-black text-white px-2 py-0.5 rounded-sm uppercase">{user?.language || 'en'}</span>

            {isChangingCity && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border-4 border-black p-4 z-50 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
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
          <div className="text-5xl sm:text-7xl font-black leading-none">{weather?.temp || '--°'}</div>
          <div className="text-[10px] sm:text-xs uppercase font-bold tracking-tight bg-black text-white px-3 py-1.5 mt-2">
            {weather?.condition || user?.location?.areaName || 'Loading...'}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-4xl font-black italic">LOCAL FEED</h2>
          <div className="flex gap-2">
            <span className="px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer">RECENT</span>
            <span className="px-4 py-1.5 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition-colors">POPULAR</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {/* Health & Fitness Quick Link */}
          <div 
            onClick={() => navigate('/health')}
            className="p-6 bg-india-green border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] cursor-pointer group active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-white italic leading-none mb-1">HEALTH TIPS</h3>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest opacity-80">Weight & Diet AI Advice</p>
              </div>
              <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center group-hover:bg-saffron transition-colors">
                <Activity className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>

          {/* AI Chat Quick Link */}
          <div 
            onClick={() => navigate('/ai-chat')}
            className="p-6 bg-purple-600 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] cursor-pointer group active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-white italic leading-none mb-1">AI INFORMER</h3>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest opacity-80">Ask Anything to Aryan's AI</p>
              </div>
              <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center group-hover:bg-saffron transition-colors">
                <Info className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>

          {/* Admin Dashboard Quick Link */}
          {isAdmin && (
            <div 
              onClick={() => navigate('/admin')}
              className="p-6 bg-india-green border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] cursor-pointer group active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all sm:col-span-2"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-white italic leading-none mb-1">ADMIN DASHBOARD</h3>
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest opacity-80">Manage Payments & Users (OWNER ONLY)</p>
                </div>
                <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center group-hover:bg-india-green group-hover:text-white transition-all">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-2xl">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full h-80 bg-gray-100 animate-pulse rounded-2xl border-2 border-black mb-8" />
            ))
          ) : posts.length > 0 ? (
            posts.map(post => <div key={post.id}><PostCard post={post} /></div>)
          ) : (
            <div className="text-center py-20 bg-[#F5F5F5] rounded-3xl border-4 border-dashed border-gray-200">
              <p className="text-xl font-black uppercase text-gray-400">Silence in {user?.location?.areaName || 'your area'}.</p>
              <p className="text-sm font-bold text-gray-300 mt-2 uppercase tracking-widest">Share the first update!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
