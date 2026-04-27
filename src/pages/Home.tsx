import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Info } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-screen">
      {/* App Header */}
      <header className="pt-8 px-4 sm:px-10 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-[6px] border-black pb-6 gap-6">
        <div className="flex flex-col">
          <h1 className="text-5xl sm:text-[100px] leading-[0.8] font-black uppercase tracking-tighter italic">
            inform<span className="text-saffron">m</span><span className="text-india-green">e</span>
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 sm:mt-6 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-india-green" />
              {user?.location?.areaName || 'Your Location'}
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-india-green">Live Updates</span>
            <span className="text-gray-300">/</span>
            <span>Languages: HI, EN, KA +5</span>
          </div>
        </div>
        <div className="flex flex-col items-end w-full sm:w-auto">
          <div className="text-5xl sm:text-7xl font-black leading-none">28°</div>
          <div className="text-[10px] sm:text-xs uppercase font-bold tracking-tight bg-black text-white px-3 py-1.5 mt-2">
            Mostly Sunny
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
