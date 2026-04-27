import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, Send, X, Video, Play, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [type, setType] = useState<'general' | 'news' | 'event' | 'weather' | 'alert'>('general');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationType, setLocationType] = useState<'home' | 'work' | 'public' | 'market' | 'other' | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 800KB for Firestore documents to be safe)
    if (file.size > 800 * 1024) {
      alert("File is too large. Please select a file smaller than 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setMediaUrl(result);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaUrl('');
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsLoading(true);
    try {
      const postData: any = {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content: content.trim(),
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        type,
        language: user.language || 'en',
        location: {
          areaName: locationName.trim() || user.location?.areaName || 'Mumbai',
          lat: user.location?.lat || 19.076,
          lng: user.location?.lng || 72.877,
          locationType: locationType || undefined
        },
        likes: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
      };

      if (type === 'event') {
        postData.eventDetails = {
          date: eventDate,
          time: eventTime,
          venue: eventVenue,
          rsvps: [],
        };
      }

      if (type === 'alert') {
        postData.isUrgent = isUrgent;
      }

      await addDoc(collection(db, 'posts'), postData);
      navigate('/');
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full border-2 border-black">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
        </button>
        <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">New Update</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 px-1 scrollbar-hide -mx-1">
          {['general', 'news', 'event', 'weather', 'alert'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t as any)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-4 ${
                type === t 
                ? 'bg-black text-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]' 
                : 'bg-white text-gray-400 border-gray-100 hover:border-black active:shadow-none'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {type === 'alert' && (
           <div 
             className={`p-3 sm:p-4 border-4 border-black rounded-2xl flex items-center justify-between transition-colors cursor-pointer ${isUrgent ? 'bg-red-500 text-white' : 'bg-white'}`}
             onClick={() => setIsUrgent(!isUrgent)}
            >
             <div>
               <p className="font-black uppercase text-xs sm:text-sm italic">Urgent Alert</p>
               <p className="text-[8px] sm:text-[10px] font-bold uppercase opacity-60">Notify all users in this area immediately</p>
             </div>
             <div className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full border-2 border-black relative transition-colors ${isUrgent ? 'bg-white' : 'bg-gray-200'}`}>
               <div className={`absolute top-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-black transition-all ${isUrgent ? 'right-0.5 sm:right-0.5 bg-red-500' : 'left-0.5 sm:left-0.5 bg-white'}`} />
             </div>
           </div>
        )}

        <div className="bg-white border-4 border-black rounded-3xl p-4 sm:p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Tell the community what's happening...`}
            className="w-full h-32 sm:h-40 resize-none border-none focus:ring-0 text-lg sm:text-xl font-bold text-black placeholder-gray-300"
          />
          
          <div className="flex items-center gap-4 mt-2 sm:mt-4 pt-4 border-t border-gray-50 text-gray-400">
            <button 
              type="button" 
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                }
              }}
              className="flex items-center gap-1.5 hover:text-[#FF9933] transition-colors"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs font-medium uppercase font-black">Photo</span>
            </button>
            <button 
              type="button" 
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "video/*";
                  fileInputRef.current.click();
                }
              }}
              className="flex items-center gap-1.5 hover:text-[#138808] transition-colors"
            >
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs font-medium uppercase font-black">Video</span>
            </button>
            {/* Hidden Input */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button 
              type="button" 
              onClick={() => setShowLocationInput(!showLocationInput)}
              className={`flex items-center gap-1.5 transition-colors ${showLocationInput ? 'text-blue-500' : 'hover:text-blue-500'}`}
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs font-medium uppercase font-black">Location</span>
            </button>
          </div>
        </div>

        {/* Location Input Area */}
        <AnimatePresence>
          {showLocationInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4">
                <div className="bg-white border-4 border-black p-3 sm:p-4 rounded-2xl flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <input 
                    type="text" 
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Enter area name (e.g. Bandra West)"
                    className="flex-1 bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0 text-black placeholder-gray-300"
                    autoFocus
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(['home', 'work', 'public', 'market', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLocationType(type === locationType ? null : type)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border-2 transition-all ${
                        locationType === type
                        ? 'bg-blue-500 text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-400 border-gray-100 hover:border-black'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Area */}
        <AnimatePresence>
          {mediaUrl && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative rounded-3xl overflow-hidden border-4 border-black aspect-video bg-black"
            >
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="relative w-full h-full">
                   <video src={mediaUrl} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="bg-white/80 p-3 rounded-full border-2 border-black">
                        <Play className="w-8 h-8 fill-black" />
                      </div>
                   </div>
                </div>
              )}
              <button 
                type="button"
                onClick={removeMedia}
                className="absolute top-4 right-4 bg-white p-2 rounded-full border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none translate-y-0 active:translate-y-1 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {type === 'event' && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-base sm:text-lg font-black uppercase italic">Event Details</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white border-4 border-black p-3 sm:p-4 rounded-2xl">
                <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Date</label>
                <input 
                  type="date" 
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0"
                />
              </div>
              <div className="bg-white border-4 border-black p-3 sm:p-4 rounded-2xl">
                <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Time</label>
                <input 
                  type="time" 
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0"
                />
              </div>
            </div>
            <div className="bg-white border-4 border-black p-3 sm:p-4 rounded-2xl">
              <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Venue / Location Details</label>
              <input 
                type="text" 
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Where is it happening?"
                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="w-full flex items-center justify-center gap-2 bg-black py-4 rounded-3xl text-white font-black uppercase tracking-widest text-sm sm:text-lg brutalist-shadow hover:bg-gray-800 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
        >
          {isLoading ? <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : (
            <>
              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              Post to Community
            </>
          )}
        </button>
      </form>
    </div>
  );
}
