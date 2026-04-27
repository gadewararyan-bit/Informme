import React from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Clock, AlertTriangle, Bell } from 'lucide-react';
import { Post } from '../../types';
import { formatSafeDate } from '../../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isRsvp = post.eventDetails?.rsvps.includes(user?.uid || '');
  const isLiked = post.likes.includes(user?.uid || '');

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

      {/* Content */}
      <div className="p-4 sm:p-5 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
        <p className={`text-lg sm:text-xl font-bold leading-tight tracking-tight whitespace-pre-wrap ${isAlert ? 'text-red-700' : 'text-black'}`}>
          {post.content}
        </p>
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
        <button className={`${isAlert ? 'text-red-700' : 'text-black'} hover:scale-110 transition-transform`}>
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
}
