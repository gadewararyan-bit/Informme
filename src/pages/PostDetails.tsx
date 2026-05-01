import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import CommentSection from '../components/feed/CommentSection';
import { ArrowLeft } from 'lucide-react';
import { formatSafeDate } from '../lib/dateUtils';

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Fetch Post
    const fetchPost = async () => {
      const docRef = doc(db, 'posts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as Post);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id]);

  if (loading) return null;
  if (!post) return <div className="p-10 text-center">Post not found.</div>;

  return (
    <div className="max-w-2xl mx-auto pb-24 bg-[#F8F9FA] min-h-screen">
      <div className="flex items-center gap-4 p-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-50 pro-shadow">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 leading-none">Transmission Details</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Node ID: {id?.slice(0, 8)}</p>
        </div>
      </div>

      <div className="p-6">
        <PostCard post={post} onDelete={() => navigate('/')} />
      </div>

      <div className="px-6 pb-12">
        <div className="bg-white rounded-[40px] overflow-hidden pro-shadow border border-gray-100">
          <div className="bg-gray-900 text-white px-8 py-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Community Intelligence</h2>
          </div>
          <div className="p-6">
            <CommentSection postId={post.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
