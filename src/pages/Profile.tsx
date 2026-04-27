import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth, signOut } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { LogOut, Settings, MapPin, Calendar, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserPosts = async () => {
      const q = query(
        collection(db, 'posts'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    };

    fetchUserPosts();
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-screen">
      {/* Profile Header */}
      <div className="bg-white border-b-[6px] border-black p-4 sm:p-10 pt-16 relative overflow-hidden">
        {/* Design Accents */}
        <div className="absolute top-0 left-0 w-32 h-2 bg-saffron" />
        <div className="absolute top-0 right-0 w-32 h-2 bg-india-green" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10">
          <div className="relative">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&size=128`} 
              alt={user.displayName}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-4 border-black brutalist-shadow object-cover"
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-4xl sm:text-[60px] leading-[0.8] font-black uppercase tracking-tighter italic mb-4">{user.displayName}</h1>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-6">
              <span className="bg-black text-white px-3 py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{user.email}</span>
              <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                <MapPin className="w-3 h-3" />
                {user.location?.areaName || "Mumbai, India"}
              </span>
            </div>
            
            <p className="text-sm sm:text-xl font-bold leading-tight max-w-xl italic text-gray-700 px-4 sm:px-0">
              "{user.bio || "Local explorer and community member. Informing India, one update at a time."}"
            </p>

            <div className="flex gap-4 mt-8 flex-wrap justify-center sm:justify-start">
              <button className="flex items-center gap-2 bg-black text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-gray-800 transition-all brutalist-shadow active:shadow-none">
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white border-4 border-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="flex sm:flex-col gap-6 items-center border-t sm:border-t-0 sm:border-l border-black/10 pt-6 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-center">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black italic leading-none">{posts.length}</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Posts</div>
            </div>
            <div className="w-px sm:h-px sm:w-full bg-black/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black italic leading-none">0</div>
              <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Friends</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Feed */}
      <main className="flex-1 p-4 sm:p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase">Activity</h2>
          <div className="p-1 px-3 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400">
            Timeline
          </div>
        </div>

        <div className="max-w-2xl">
          {loading ? (
            <div className="w-full h-80 bg-gray-100 animate-pulse rounded-2xl border-2 border-black" />
          ) : posts.length > 0 ? (
            posts.map(post => <div key={post.id}><PostCard post={post} /></div>)
          ) : (
            <div className="text-center py-20 bg-[#F5F5F5] rounded-3xl border-4 border-dashed border-gray-200">
              <p className="text-lg font-black uppercase text-gray-400">You haven't posted yet.</p>
              <button className="mt-4 text-xs font-black uppercase tracking-widest border-b-2 border-black">Create your first update</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
