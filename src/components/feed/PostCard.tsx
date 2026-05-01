import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Clock, AlertTriangle, Bell, Languages, Loader2, Trash2, Edit3, Flag, Tag, IndianRupee, CalendarPlus, Download, Globe } from 'lucide-react';
import { Post } from '../../types';
import { formatSafeDate } from '../../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { translateContent } from '../../services/aiService';
import EditPostModal from './EditPostModal';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  compact?: boolean;
}

import { ADMIN_EMAILS } from '../../constants';

export default function PostCard({ post, onDelete, compact = false }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikes, setLocalLikes] = useState<string[]>(post.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [hasEngaged, setHasEngaged] = useState(false);

  useEffect(() => {
    setLocalLikes(post.likes);
  }, [post.likes]);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.trim().toLowerCase());

  useEffect(() => {
    // Engagement reward logic: users earn 0.1 point per post viewed
    if (user && !hasEngaged && !isAdmin) {
      const timer = setTimeout(async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          // Use increment for atomic updates
          await updateDoc(userRef, {
            engagementPoints: increment(1),
            walletBalance: increment(0.01)
          });
          setHasEngaged(true);
        } catch (err) {
          console.error("Reward error:", err);
        }
      }, 3000); // Trigger reward after 3 seconds of "viewing"
      return () => clearTimeout(timer);
    }
  }, [user, hasEngaged, isAdmin]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLiking) return;
    
    const wasLiked = localLikes.includes(user.uid);
    const newLikes = wasLiked 
      ? localLikes.filter(uid => uid !== user.uid)
      : [...localLikes, user.uid];
    
    setLocalLikes(newLikes);
    setIsLiking(true);

    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        likes: wasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Like error:", err);
      setLocalLikes(localLikes);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isReporting) return;
    
    if (!window.confirm("Is this post fake, spam, or harmful? Reporting helps our AI learn and keep the community safe.")) {
      return;
    }

    setIsReporting(true);
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        reports: arrayUnion(user.uid)
      });
      alert("Post reported successfully. Our moderators will review it.");
    } catch (err) {
      console.error("Reporting error:", err);
    } finally {
      setIsReporting(false);
    }
  };

  const handleRsvp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !post.eventDetails) return;
    const isRsvp = post.eventDetails.rsvps.includes(user.uid);
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
      }
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !user) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      if (onDelete) onDelete();
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setIsDeleting(false);
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

  const isLiked = user && localLikes.includes(user.uid);
  const isAlert = post.type === 'alert' && post.isUrgent;
  const isFlaggedAsFake = (post.reports?.length || 0) >= 3;
  const isOwner = user?.uid === post.authorId || isAdmin;

  if (compact) {
    return (
      <motion.div 
        onClick={() => navigate(`/post/${post.id}`)}
        className={`bg-white p-4 rounded-3xl mb-4 cursor-pointer flex items-center gap-4 transition-all pro-shadow border border-gray-100 hover:ring-2 hover:ring-blue-500/20 active:scale-[0.98] ${
          isAlert ? 'bg-red-50/50' : ''
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${
          post.type === 'news' ? 'bg-blue-50 text-blue-600' :
          post.type === 'event' ? 'bg-emerald-50 text-emerald-600' :
          post.type === 'weather' ? 'bg-orange-50 text-orange-600' :
          post.type === 'market' ? 'bg-amber-50 text-amber-600' :
          'bg-gray-50 text-gray-600'
        }`}>
          {post.type === 'news' && <Bell className="w-6 h-6" />}
          {post.type === 'event' && <Calendar className="w-6 h-6" />}
          {post.type === 'weather' && <Clock className="w-6 h-6" />}
          {post.type === 'alert' && <AlertTriangle className="w-6 h-6" />}
          {post.type === 'market' && <Tag className="w-6 h-6" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isAlert ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {post.type}
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{formatSafeDate(post.createdAt)}</span>
          </div>
          <h3 className={`text-sm font-bold truncate ${isAlert ? 'text-red-700' : 'text-gray-900'}`}>
            {post.content}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
             <div className="flex items-center gap-1 shrink-0">
               <img 
                 src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}`} 
                 className="w-4 h-4 rounded-full" 
                 alt="" 
               />
               <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[100px]">{post.authorName}</span>
             </div>
             <div className="flex items-center gap-1 text-[10px] text-gray-300">
               <MapPin className="w-3 h-3" />
               <span className="truncate">{post.location?.areaName || 'Local'}</span>
             </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
           <div className="flex items-center gap-1.5">
             <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
               <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
               {localLikes.length}
             </div>
             <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
               <MessageCircle className="w-3.5 h-3.5" />
               {post.commentCount}
             </div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`bg-white rounded-[32px] overflow-hidden mb-8 transition-all pro-shadow border border-gray-100 relative group ${
        isAlert ? 'ring-2 ring-red-500/20' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Admin Actions Overlay */}
      {isOwner && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
                onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                className="p-2 bg-white/90 backdrop-blur rounded-xl text-gray-600 hover:text-blue-600 pro-shadow transition-colors"
              >
                <Edit3 className="w-4 h-4" />
          </button>
          <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="p-2 bg-white/90 backdrop-blur rounded-xl text-red-600 hover:bg-red-50 pro-shadow transition-colors"
              >
                <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Intel?</h3>
            <p className="text-sm text-gray-500 mb-6">This action will permanently remove this data point from the network.</p>
            <div className="flex gap-4 w-full max-w-xs">
              <button 
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
        </div>
      )}

      {/* Flagged Status */}
      {isFlaggedAsFake && (
        <div className="bg-amber-50 p-3 text-center flex items-center justify-center gap-2 border-b border-amber-100">
           <AlertTriangle className="w-4 h-4 text-amber-600" />
           <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Post Flagged for Community Review</span>
        </div>
      )}

      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}`} 
                alt={post.authorName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-50"
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                post.type === 'news' ? 'bg-blue-500' :
                post.type === 'event' ? 'bg-emerald-500' :
                post.type === 'market' ? 'bg-amber-500' :
                'bg-gray-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-gray-900 tracking-tight">{post.authorName}</h3>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{formatSafeDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  <MapPin className="w-3 h-3 text-india-green" />
                  {post.location?.areaName}
                </div>
                {post.type !== 'news' && (
                   <div className="px-2 py-0.5 bg-gray-100 rounded-full text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                     {post.type}
                   </div>
                )}
              </div>
            </div>
          </div>
          {isAlert && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full">
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">URGENT</span>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div 
          className="cursor-pointer"
          onClick={() => !window.location.pathname.includes(`/post/${post.id}`) && navigate(`/post/${post.id}`)}
        >
          <p className={`text-base sm:text-lg font-medium leading-relaxed tracking-tight whitespace-pre-wrap ${
            isAlert ? 'text-red-900' : 'text-gray-800'
          }`}>
            {translatedContent || post.content}
          </p>

          {post.type === 'market' && post.priceData && (
            <div className="mt-4 bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Market Value</p>
                <h4 className="text-base font-bold text-gray-900 uppercase">{post.priceData.item}</h4>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 flex items-center justify-end">
                  <IndianRupee className="w-5 h-5" />
                  {post.priceData.price}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">per {post.priceData.unit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Translation Trigger */}
        {user?.language !== post.language && !translatedContent && (
          <button 
            onClick={handleTranslate}
            disabled={isTranslating}
            className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
            Translate to {user?.language?.toUpperCase()}
          </button>
        )}
      </div>

      {/* Event Details */}
      {post.type === 'event' && post.eventDetails && (
        <div className="px-6 pb-6 pt-2">
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex gap-6">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Schedule</p>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-900">{post.eventDetails.date}</span>
                            <span className="text-gray-300">|</span>
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-900">{post.eventDetails.time}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Venue</p>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{post.eventDetails.venue}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex -space-x-2 mr-2">
                      {post.eventDetails.rsvps.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-emerald-100" />
                      ))}
                      {post.eventDetails.rsvps.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-emerald-200 flex items-center justify-center text-[8px] font-bold text-emerald-700">
                          +{post.eventDetails.rsvps.length - 3}
                        </div>
                      )}
                   </div>
                    <button 
                        onClick={handleRsvp}
                        className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            post.eventDetails.rsvps.includes(user?.uid || '') 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-white text-emerald-600 border border-emerald-200 hover:border-emerald-400'
                        }`}
                    >
                        {post.eventDetails.rsvps.includes(user?.uid || '') ? 'Going ✓' : 'Join Event'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Media Content */}
      {post.mediaUrl && (
        <div className="px-6 pb-6">
          <div className="rounded-2xl overflow-hidden border border-gray-100 pro-shadow">
            {post.mediaType === 'video' ? (
              <video src={post.mediaUrl} controls className="w-full max-h-[500px] object-cover bg-black" />
            ) : (
              <img 
                src={post.mediaUrl} 
                alt="Post content" 
                className="w-full max-h-[500px] object-cover" 
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      )}

      {/* Interaction Footer */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 group transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${isLiked ? 'bg-red-50' : 'group-hover:bg-red-50'}`}>
              <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-current scale-110' : 'group-active:scale-90'}`} />
            </div>
            <span className="text-xs font-bold leading-none">{localLikes.length}</span>
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 group transition-colors ${showComments ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${showComments ? 'bg-blue-50' : 'group-hover:bg-blue-50'}`}>
              <MessageCircle className="w-5 h-5 group-active:scale-90" />
            </div>
            <span className="text-xs font-bold leading-none">{post.commentCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Share intel"
          >
            <Share2 className="w-5 h-5" />
          </button>
          {!isOwner && (
            <button 
              onClick={handleReport}
              className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
              title="Report Concern"
            >
              <Flag className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {showComments && (
        <div className="border-t border-gray-100 bg-white">
          <CommentSection postId={post.id} />
        </div>
      )}

      <EditPostModal 
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </motion.div>
  );
}
