import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Filter } from 'lucide-react';
import LocationPicker from '../components/common/LocationPicker';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.location?.areaName) return;

    const q = query(
      collection(db, 'posts'),
      where('location.areaName', '==', user.location.areaName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let allPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Filter events in-memory
      let eventData = allPosts.filter(p => p.type === 'event');

      // Sort in-memory to avoid composite index reqs
      eventData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : Date.now());
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : Date.now());
        return timeB - timeA;
      });

      setEvents(eventData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.location?.areaName]);

  return (
    <div className="w-full max-w-[500px] mx-auto p-6 pb-24 bg-[#F8F9FA] min-h-screen">
      <div className="flex justify-end mb-4 pt-4">
        <LocationPicker />
      </div>
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Events</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">Discovery Protocol</p>
        </div>
        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center pro-shadow ring-4 ring-indigo-600/10 transition-transform hover:scale-110">
           <Calendar className="w-6 h-6" />
        </div>
      </header>

      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
         <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest pro-shadow shadow-indigo-200 ring-1 ring-black/[0.05]">Upcoming</button>
         <button className="px-5 py-2.5 bg-white text-gray-400 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all pro-shadow">Weekend</button>
         <button className="px-5 py-2.5 bg-white text-gray-400 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all pro-shadow">Meetups</button>
      </div>

      <div className="space-y-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-white pro-shadow rounded-[32px] animate-pulse border border-gray-100" />
          ))
        ) : events.length > 0 ? (
          events.map(event => <PostCard key={event.id} post={event} />)
        ) : (
          <div className="text-center py-24 bg-white rounded-[40px] pro-shadow border border-gray-100 border-dashed">
             <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8" />
             </div>
             <p className="text-lg font-black uppercase text-gray-300 italic tracking-tighter">No transmissions detected</p>
             <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Broadcast a new event to the community</p>
          </div>
        )}
      </div>
    </div>
  );
}
