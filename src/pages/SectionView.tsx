import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { ArrowLeft, Newspaper, IndianRupee, ShieldAlert, Tag, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { translations } from '../constants/translations';

const SectionView: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = translations[user?.language as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (!user?.location?.areaName || !type) return;

    setLoading(true);
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('areaName', '==', user.location.areaName),
      where('type', '==', type === 'safety' ? 'alert' : type),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching section posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.location?.areaName, type]);

  const getHeaderInfo = () => {
    switch (type) {
      case 'news':
        return { 
          title: 'Local News', 
          subtitle: 'Latest updates from your area', 
          icon: <Newspaper className="w-8 h-8 text-indigo-600" />,
          color: 'from-indigo-500 to-blue-600'
        };
      case 'market':
        return { 
          title: 'Market Prices', 
          subtitle: 'Daily item prices and trends', 
          icon: <IndianRupee className="w-8 h-8 text-emerald-600" />,
          color: 'from-emerald-500 to-teal-600'
        };
      case 'safety':
        return { 
          title: 'Safety Alerts', 
          subtitle: 'Emergency and security warnings', 
          icon: <ShieldAlert className="w-8 h-8 text-rose-600" />,
          color: 'from-rose-500 to-orange-600'
        };
      case 'deal':
        return { 
          title: 'Local Deals', 
          subtitle: 'Best offers in your neighborhood', 
          icon: <Tag className="w-8 h-8 text-amber-600" />,
          color: 'from-amber-500 to-orange-500'
        };
      default:
        return { 
          title: 'Section', 
          subtitle: 'Local information', 
          icon: <Newspaper className="w-8 h-8 text-gray-600" />,
          color: 'from-gray-500 to-gray-600'
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className={`bg-gradient-to-r ${header.color} pt-16 pb-24 px-6 relative overflow-hidden`}>
        <div className="max-w-4xl mx-auto relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
            id="back_button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Home</span>
          </button>
          
          <div className="flex items-center gap-4 text-white">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl shadow-xl">
              {header.icon}
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">{header.title}</h1>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1">
                {header.subtitle} &bull; {user?.location?.areaName}
              </p>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-12">
        {loading ? (
          <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center pro-shadow">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gathering local info...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-20 text-center pro-shadow border border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {header.icon}
            </div>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900 mb-2">No Posts Yet</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
              We haven't found any news for {header.title} in your area yet. Check back soon!
            </p>
            <button 
              onClick={() => navigate('/create')}
              className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
            >
              Post First Update
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionView;
