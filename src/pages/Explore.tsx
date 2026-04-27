import { useState, useEffect } from 'react';
import { getLocalInfo } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { Cloud, Newspaper, Calendar, RefreshCw, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function Explore() {
  const { user } = useAuth();
  const [localData, setLocalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [areaName, setAreaName] = useState(user?.location?.areaName || 'Mumbai');

  const fetchExploreData = async () => {
    setLoading(true);
    const data = await getLocalInfo(areaName, user?.language || 'en');
    setLocalData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExploreData();
  }, [areaName]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-10 space-y-8 sm:space-y-12">
      <div className="flex items-center justify-between border-b-[6px] border-black pb-4">
        <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase underline decoration-india-green decoration-[6px]">EXPLORE</h1>
        <button 
          onClick={fetchExploreData}
          className={`p-2 sm:p-3 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-8">
        {/* Left Column: Weather & Events */}
        <div className="sm:col-span-5 space-y-8">
          {/* Weather Widget */}
          <motion.div 
            className="relative overflow-hidden bg-white border-4 border-black p-6 sm:p-8 rounded-3xl brutalist-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">
                  <MapPin className="w-3 h-3" />
                  {areaName}
                </div>
                <h2 className="text-5xl sm:text-6xl font-black italic text-black leading-none">{localData?.weather?.temp || '--°C'}</h2>
                <p className="text-lg sm:text-xl font-bold uppercase mt-2 tracking-tight text-saffron">{localData?.weather?.condition || 'Loading...'}</p>
              </div>
              <Cloud className="w-12 h-12 sm:w-16 sm:h-16 text-black" />
            </div>
            <div className="mt-6 sm:mt-8 pt-4 border-t-2 border-black/5">
              <p className="text-xs sm:text-sm font-bold italic text-gray-600 line-clamp-2">"{localData?.weather?.description || 'Fetching local weather...'}"</p>
            </div>
          </motion.div>

          {/* Events */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-black font-black uppercase italic text-lg sm:text-xl">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-india-green" />
              <h3>Events</h3>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="h-40 bg-gray-100 rounded-3xl animate-pulse border-2 border-black" />
              ) : localData?.events?.map((event: any, i: number) => (
                <motion.div 
                  key={i} 
                  className="flex items-center gap-4 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-india-green text-white rounded-xl flex flex-col items-center justify-center font-black">
                     <span className="text-base sm:text-lg leading-none">{event.date.split(' ')[0]}</span>
                     <span className="text-[8px] sm:text-[10px] uppercase">{event.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900 leading-tight uppercase text-xs sm:text-sm">{event.title}</h4>
                    <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{event.location}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: News */}
        <div className="sm:col-span-7 space-y-4">
          <div className="flex items-center gap-2 text-black font-black uppercase italic text-lg sm:text-xl">
            <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-saffron" />
            <h3>Headlines</h3>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse border-2 border-black" />
              ))
            ) : localData?.news?.map((item: any, i: number) => (
              <motion.div 
                key={i} 
                className="bg-[#F5F5F5] p-5 sm:p-6 rounded-2xl border-2 border-black hover:bg-white transition-all group"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-[8px] sm:text-[10px] font-black uppercase text-saffron mb-1 sm:mb-2 tracking-widest">Local News</p>
                <h4 className="text-lg sm:text-xl font-black leading-tight mb-2 sm:mb-3 group-hover:italic transition-all">{item.title}</h4>
                <p className="text-xs sm:text-sm font-bold text-gray-600 leading-relaxed">{item.summary}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
