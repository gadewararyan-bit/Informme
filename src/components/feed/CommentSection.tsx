import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Comment } from '../../types';
import { formatSafeDate } from '../../lib/dateUtils';
import { Send, Loader2, Heart } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export default function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, `posts/${postId}/comments`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        likes: [], 
        ...doc.data() 
      })) as Comment[]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    const content = newComment.trim();
    setNewComment('');

    try {
      await addDoc(collection(db, `posts/${postId}/comments`), {
        postId,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content,
        likes: [],
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'posts', postId), {
        commentCount: increment(1)
      });

      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentLikes: string[]) => {
    if (!user) return;
    const wasLiked = currentLikes.includes(user.uid);
    const commentRef = doc(db, `posts/${postId}/comments`, commentId);
    
    try {
      await updateDoc(commentRef, {
        likes: wasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  return (
    <div className="bg-[#F8F9FA]/50 p-6 animate-in slide-in-from-top-1 duration-200">
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your perspective..."
            className="flex-1 bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-black/5 focus:border-gray-200 transition-all pro-shadow placeholder-gray-200"
            disabled={isSubmitting}
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="bg-gray-900 text-white p-4 rounded-2xl pro-shadow hover:scale-105 active:scale-95 disabled:opacity-20 transition-all border border-gray-800"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <div className="bg-white border border-dashed border-gray-200 p-6 rounded-3xl mb-6 text-center pro-shadow">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Initialization Required for discussion</p>
        </div>
      )}

      <div className="space-y-4 max-h-[350px] overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-200" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => {
            const isLiked = user && comment.likes?.includes(user.uid);
            return (
              <div key={comment.id} className="flex gap-4 group items-start">
                <div className="w-10 h-10 rounded-2xl bg-white p-0.5 pro-shadow border border-gray-100 shrink-0">
                  <img 
                    src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${comment.authorName}`} 
                    alt={comment.authorName}
                    className="w-full h-full rounded-[14px] object-cover"
                  />
                </div>
                <div className="flex-1 bg-white p-4 rounded-[24px] rounded-tl-none pro-shadow border border-gray-50 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase text-gray-900 tracking-widest">{comment.authorName}</span>
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter italic">{formatSafeDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{comment.content}</p>
                  
                  <div className="mt-3 flex items-center gap-4">
                    <button 
                      onClick={() => handleLikeComment(comment.id, comment.likes || [])}
                      className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="text-[10px] font-black">{comment.likes?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-white rounded-2xl pro-shadow border border-gray-100 flex items-center justify-center mx-auto mb-4 opacity-20">
              <Send className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-[10px] font-black uppercase text-gray-200 italic tracking-[0.2em]">Void Stream: No data detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
