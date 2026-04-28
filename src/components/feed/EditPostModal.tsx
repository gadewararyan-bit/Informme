import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, Calendar, Clock, MapPin, RefreshCw } from 'lucide-react';
import { Post } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPostModal({ post, isOpen, onClose }: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [eventDate, setEventDate] = useState(post.eventDetails?.date || '');
  const [eventTime, setEventTime] = useState(post.eventDetails?.time || '');
  const [eventVenue, setEventVenue] = useState(post.eventDetails?.venue || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const postRef = doc(db, 'posts', post.id);
      const updates: any = {
        content: content.trim(),
        updatedAt: new Date().toISOString()
      };

      if (post.type === 'event') {
        updates.eventDetails = {
          ...post.eventDetails,
          date: eventDate,
          time: eventTime,
          venue: eventVenue
        };
      }

      await updateDoc(postRef, updates);
      onClose();
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-white border-4 border-black rounded-3xl brutalist-shadow z-10 overflow-hidden"
          >
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-purple-50">
              <h2 className="text-xl font-black uppercase tracking-tighter italic">Edit Post</h2>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[150px] p-4 bg-gray-50 border-4 border-black rounded-2xl font-bold focus:ring-0 resize-none"
                  placeholder="What's on your mind?"
                  required
                />
              </div>

              {post.type === 'event' && (
                <div className="space-y-4 bg-blue-50 p-4 rounded-2xl border-2 border-dashed border-blue-400">
                  <h3 className="text-xs font-black uppercase italic text-blue-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Event Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-black p-3 rounded-xl">
                      <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Date</label>
                      <input 
                        type="date" 
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0"
                      />
                    </div>
                    <div className="bg-white border-2 border-black p-3 rounded-xl">
                      <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Time</label>
                      <input 
                        type="time" 
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="bg-white border-2 border-black p-3 rounded-xl">
                    <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Venue</label>
                    <input 
                      type="text" 
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      placeholder="Where is it happening?"
                      className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 border-4 border-black font-black uppercase tracking-widest hover:bg-gray-50 active:translate-y-1 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !content.trim()}
                  className="flex-3 bg-black text-white py-4 border-4 border-black font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-900 active:translate-y-1 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
