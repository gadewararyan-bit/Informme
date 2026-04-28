import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Clock, AlertTriangle, Bell, Languages, Loader2, Trash2 } from 'lucide-react';
import { Post } from '../../types';
import { formatSafeDate } from '../../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { translateContent } from '../../services/aiService';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

import { ADMIN_EMAIL } from '../../constants';

export default function PostCard({ post, onDelete }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isRsvp = post.eventDetails?.rsvps.includes(user?.uid || '');
  const isLiked = post.likes.includes(user?.uid || '');
  const isAdmin = user?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwner = user?.uid === post.authorId || isAdmin;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleRsvp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !post.eventDetails) return;
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      'eventDetails.rsvps': isRsvp ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: 'InformMe Post',
      text: post.content,
      url: `${window.location.origin}/post/${post.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        // Fallback to clipboard on any error except user cancel
        try {
          await navigator.clipboard.writeText(shareData.url);
          alert('Share failed, but link copied to clipboard!');
        } catch (copyErr) {
          console.error('Clipboard fallback failed:', copyErr);
        }
      }
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isOwner || isDeleting || !user) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      
      // The post is now gone from Firestore, real-time listeners will handle UI update
      
      // Try to update user's post count - if this fails, the post is still deleted
      try {
        const userRef = doc(db, 'users', user.uid);
        const newCount = Math.max(0, (user.postCount || 0) - 1);
        await updateDoc(userRef, {
          postCount: newCount
        });
      } catch (updateErr) {
        console.error('Error updating post count after deletion:', updateErr);
      }

      if (onDelete) onDelete();
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error('Error deleting post:', err);
      // We'll show an error but still allow the UI to continue
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isTranslating) return;
    
    setIsTranslating(true);
    try {
      const translated = await translateContent(post.content, user.language || 'en');
      setTranslatedContent(translated);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const isAlert = post.type === 'alert' && post.isUrgent;

  return (
    <motion.div 
      className={`bg-white border-2 border-black rounded-2xl overflow-hidden mb-8 transition-all ${
        isAlert ? 'shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] bg-red-50 border-red-600' : 'brutalist-shadow'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Alert Banner */}
      {isAlert && (
        <div className="bg-red-600 text-white p-3 flex items-center justify-center gap-2 animate-pulse">
          <Bell className="w-4 h-4 fill-white" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">URGENT LOCAL ALERT</span>
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center justify-between p-4 sm:p-5 border-b-2 ${isAlert ? 'border-red-600' : 'border-black'}`}>
        <div className="flex items-center gap-3">
          <img 
            src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}`} 
            alt={post.authorName}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-black object-cover"
          />
          <div>
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight">{post.authorName}</h3>
            <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">
              <span>{formatSafeDate(post.createdAt)}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 max-w-[120px] truncate">
                    <MapPin className="w-2 sm:w-2.5 h-2 sm:h-2.5 shrink-0" />
                    {post.location.areaName}
                    {post.location.locationType && <span className="opacity-60 ml-0.5 text-[6px] sm:text-[8px]">({post.location.locationType})</span>}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(!showDeleteConfirm); }}
                disabled={isDeleting}
                className={`p-2 transition-colors disabled:opacity-50 ${showDeleteConfirm ? 'text-red-600 bg-red-50 rounded-lg' : 'text-gray-400 hover:text-red-600'}`}
                title="Delete Post"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
              
              {showDeleteConfirm && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border-4 border-black p-4 z-50 shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-100">
                  <p className="text-[10px] font-black uppercase mb-3">Delete this post?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                      className="flex-1 bg-red-600 text-white py-1.5 text-[8px] font-black uppercase tracking-widest border-2 border-black"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                      className="flex-1 bg-white text-black py-1.5 text-[8px] font-black uppercase tracking-widest border-2 border-black"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={`px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest border-2 ${
            isAlert ? 'bg-red-600 text-white border-red-600' :
            post.type === 'news' ? 'bg-red-500 text-white border-black' :
            post.type === 'event' ? 'bg-blue-500 text-white border-black' :
            post.type === 'weather' ? 'bg-saffron text-white border-black' :
            'bg-black text-white border-black'
          }`}>
            {isAlert ? 'ALERT' : post.type}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
        <p className={`text-lg sm:text-xl font-bold leading-tight tracking-tight whitespace-pre-wrap ${isAlert ? 'text-red-700' : 'text-black'}`}>
          {translatedContent || post.content}
        </p>
        
        {user?.language !== post.language && !translatedContent && (
          <button 
            onClick={handleTranslate}
            disabled={isTranslating}
            className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95"
          >
            {isTranslating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Languages className="w-3 h-3" />
            )}
            Translate to {user?.language?.toUpperCase() || 'EN'}
          </button>
        )}

        {translatedContent && (
          <button 
            onClick={(e) => { e.stopPropagation(); setTranslatedContent(null); }}
            className="mt-4 text-[10px] font-black uppercase text-gray-500 hover:text-black"
          >
            Show Original
          </button>
        )}
      </div>

      {/* Event Details Section */}
      {post.type === 'event' && post.eventDetails && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
          <div className="bg-blue-50 border-2 border-blue-600 p-3 sm:p-4 rounded-xl flex items-center justify-between">
            <div className="flex gap-3 sm:gap-4">
              <div className="text-center border-r-2 border-blue-200 pr-3 sm:pr-4">
                 <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto" />
                 <span className="text-[8px] sm:text-[10px] font-black uppercase text-blue-400">Date</span>
                 <p className="text-[10px] sm:text-xs font-black text-blue-600">{post.eventDetails.date || 'TBA'}</p>
              </div>
              <div className="text-center">
                 <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto" />
                 <span className="text-[8px] sm:text-[10px] font-black uppercase text-blue-400">Time</span>
                 <p className="text-[10px] sm:text-xs font-black text-blue-600">{post.eventDetails.time || 'TBA'}</p>
              </div>
            </div>
            <button 
              onClick={handleRsvp}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-black uppercase text-[8px] sm:text-[10px] tracking-widest transition-all ${
                isRsvp ? 'bg-blue-600 text-white shadow-xl' : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
              }`}
            >
              {isRsvp ? 'Attending ✓' : 'RSVP'}
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
             <div className="flex -space-x-2">
                {post.eventDetails.rsvps.slice(0, 3).map((uid, i) => (
                  <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white bg-gray-200" />
                ))}
             </div>
             <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase">
               {post.eventDetails.rsvps.length} People going
             </span>
          </div>
        </div>
      )}

      {/* Alerts detail */}
      {isAlert && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <div className="flex items-center gap-2 text-red-600 font-bold bg-red-100 p-3 rounded-xl border border-red-200">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-tight">Verified Emergency Update</span>
              </div>
          </div>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {post.mediaType === 'video' ? (
            <video 
              src={post.mediaUrl} 
              controls 
              className="w-full h-56 sm:h-72 object-cover rounded-xl border-2 border-black bg-black"
            />
          ) : (
            <img 
              src={post.mediaUrl} 
              alt="Post content" 
              className="w-full h-56 sm:h-72 object-cover rounded-xl border-2 border-black"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className={`flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-t-2 ${isAlert ? 'border-red-600 bg-red-50' : 'border-black bg-gray-50'}`}>
        <div className="flex gap-4 sm:gap-8">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 font-black uppercase text-[10px] sm:text-xs transition-colors ${isAlert ? 'text-red-700' : 'text-black'} hover:text-red-600`}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-red-500 text-red-500 border-none' : ''}`} />
            <span>{post.likes.length} <span className="hidden sm:inline">Likes</span></span>
          </button>
          <button 
            className={`flex items-center gap-1.5 font-black uppercase text-[10px] sm:text-xs transition-colors ${isAlert ? 'text-red-700' : 'text-black'} hover:text-blue-600`}
            onClick={() => navigate(`/post/${post.id}`)}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{post.commentCount} <span className="hidden sm:inline">Comments</span></span>
          </button>
        </div>
        <button 
          onClick={handleShare}
          className={`${isAlert ? 'text-red-700' : 'text-black'} hover:scale-110 transition-transform active:scale-90`}
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
}
