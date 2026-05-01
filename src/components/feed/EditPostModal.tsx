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
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-white rounded-[40px] pro-shadow z-10 overflow-hidden border border-gray-100"
          >
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-gray-900">Revise Transmission</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Data Correction Protocol</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl flex items-center justify-center transition-all border border-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Content Stream</label>
                <div className="bg-gray-50/50 p-6 rounded-[28px] border border-gray-100 focus-within:ring-4 focus-within:ring-black/5 focus-within:bg-white transition-all pro-shadow">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[150px] bg-transparent border-none p-0 text-sm font-bold focus:ring-0 resize-none text-gray-900 placeholder:text-gray-200"
                    placeholder="Update your perspective..."
                    required
                  />
                </div>
              </div>

              {post.type === 'event' && (
                <div className="space-y-6 bg-indigo-50/30 p-6 rounded-[32px] border border-indigo-100 pro-shadow">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Kinetical Logistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-indigo-50 pro-shadow">
                      <label className="block text-[8px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Target Date</label>
                      <input 
                        type="date" 
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-gray-900"
                      />
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-indigo-50 pro-shadow">
                      <label className="block text-[8px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Sync Time</label>
                      <input 
                        type="time" 
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-indigo-50 pro-shadow">
                    <label className="block text-[8px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Geo Coordinates (Venue)</label>
                    <input 
                      type="text" 
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      placeholder="Specify location..."
                      className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-gray-900 placeholder:text-gray-100"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 px-6 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gray-100 hover:text-gray-900 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !content.trim()}
                  className="flex-[2] bg-gray-900 text-white py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 pro-shadow hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Finalize Stream
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
