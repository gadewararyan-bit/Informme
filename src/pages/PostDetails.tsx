import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Post, Comment } from '../types';
import PostCard from '../components/feed/PostCard';
import { ArrowLeft, Send } from 'lucide-react';
import { formatSafeDate } from '../lib/dateUtils';

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
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

    // Fetch Comments
    const q = query(
      collection(db, `posts/${id}/comments`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[]);
    });

    return () => unsubscribe();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id || !user) return;

    const content = newComment;
    setNewComment('');

    try {
      await addDoc(collection(db, `posts/${id}/comments`), {
        postId: id,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content,
        createdAt: serverTimestamp(),
      });

      // Update comment count
      await updateDoc(doc(db, 'posts', id), {
        commentCount: increment(1)
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (loading) return null;
  if (!post) return <div className="p-10 text-center">Post not found.</div>;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-4 p-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 truncate">Post Details</h1>
      </div>

      <div className="p-4">
        <PostCard post={post} />
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Comments ({comments.length})</h2>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
              <img 
                src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${comment.authorName}`} 
                alt={comment.authorName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm inline-block min-w-[100px]">
                  <h4 className="text-xs font-bold text-gray-900 mb-1">{comment.authorName}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-1">
                  <span className="text-[10px] text-gray-400 font-medium">{formatSafeDate(comment.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-10 text-gray-300 italic text-sm">No comments yet. Start the conversation!</div>
          )}
        </div>
      </div>

      {/* Input Fixed Bottom - Positioned above BottomNav */}
      <div className="fixed bottom-[76px] left-0 right-0 bg-white border-t border-gray-100 p-3 z-30 sm:relative sm:bottom-0 sm:border-none sm:p-0 sm:mt-8">
        <form onSubmit={handleAddComment} className="flex gap-2 max-w-2xl mx-auto">
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-[#FF9933]/20"
          />
          <button 
            type="submit"
            disabled={!newComment.trim()}
            className="bg-[#FF9933] text-white p-3 rounded-2xl hover:bg-[#FF9933]/90 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
