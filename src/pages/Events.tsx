import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Filter } from 'lucide-react';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('type', '==', 'event'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setEvents(eventData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full p-4 sm:p-10 pb-24">
      <header className="flex items-center justify-between border-b-[6px] border-black pb-8 mb-8 gap-4">
        <div>
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter">Events</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 mt-2">Discover what's happening near {user?.location?.areaName || 'you'}</p>
        </div>
        <div className="p-3 sm:p-4 bg-blue-500 border-4 border-black rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] shrink-0">
           <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
      </header>

      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
         <button className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest">Upcoming</button>
         <button className="px-6 py-2 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">This Weekend</button>
         <button className="px-6 py-2 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Workshops</button>
         <button className="px-6 py-2 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Meetups</button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]" />
          ))
        ) : events.length > 0 ? (
          events.map(event => <div key={event.id}><PostCard post={event} /></div>)
        ) : (
          <div className="col-span-full text-center py-24 bg-[#F5F5F5] rounded-3xl border-4 border-dashed border-gray-200">
             <p className="text-2xl font-black uppercase text-gray-300 italic">No events found</p>
             <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">Be the one to organize something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
