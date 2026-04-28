import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, MapPin, Send, X, Video, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { validatePostContent } from '../services/aiService';

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [type, setType] = useState<'general' | 'news' | 'event' | 'weather' | 'alert' | 'market'>('general');
  const [priceData, setPriceData] = useState({ item: '', price: '', unit: 'kg' });
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [locationType, setLocationType] = useState<'home' | 'work' | 'public' | 'market' | 'other' | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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
    setValidationError(null);

    setIsLoading(true);
    try {
      // AI Content Validation
      const validation = await validatePostContent(content);
      if (!validation.isSafe) {
        setValidationError(validation.reason || "This content appears to be incorrect, spam, or fake news. Please provide truthful information.");
        setIsLoading(false);
        return;
      }

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
          pinCode: pinCode.trim() || user.location?.pinCode || null,
          lat: user.location?.lat || 19.076,
          lng: user.location?.lng || 72.877,
          locationType: locationType || null
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

      if (type === 'market') {
        postData.priceData = priceData;
      }

      await addDoc(collection(db, 'posts'), postData);
      
      // Update user stats and rewards
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const currentCount = (user.postCount || 0) + 1;
        const currentEarnings = user.earnings || 0;
        const reachedMilestone = currentCount % 100 === 0;
        const newEarnings = reachedMilestone ? currentEarnings + 10 : currentEarnings;
        
        await updateDoc(userRef, {
          postCount: currentCount,
          earnings: newEarnings
        });

        if (reachedMilestone) {
          setShowMilestone(true);
          // Wait for user to see the milestone
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      navigate('/');
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 relative overflow-hidden">
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-white border-8 border-black p-10 text-center brutalist-shadow max-w-sm">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Milestone Reached!</h2>
              <p className="font-bold text-xl mb-6 leading-tight">You've reached 100 posts and earned ₹10!</p>
              <div className="text-india-green text-3xl font-black">+₹10 Added</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full border-2 border-black">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
        </button>
        <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">New Update</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border-4 border-red-600 p-4 rounded-2xl flex items-start gap-3 shadow-[4px_4px_0_0_rgb(220,38,38)]"
            >
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="font-black uppercase italic text-red-600 text-sm">Action Blocked</h3>
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-tight leading-tight mt-1">{validationError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 px-1 scrollbar-hide -mx-1">
          {['general', 'news', 'market', 'event', 'weather', 'alert'].map((t) => (
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
              {t === 'market' ? '🛒 Price Update' : t}
            </button>
          ))}
        </div>

        {type === 'market' && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-4 bg-saffron/10 p-4 sm:p-6 rounded-3xl border-4 border-saffron shadow-[8px_8px_0_0_rgba(255,153,51,1)]">
            <h3 className="text-base sm:text-lg font-black uppercase italic text-saffron flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
              Vendor Price Update
            </h3>
            <div className="bg-white border-2 border-black p-3 sm:p-4 rounded-2xl">
              <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Product Name</label>
              <input 
                type="text" 
                required={type === 'market'}
                value={priceData.item}
                onChange={(e) => setPriceData({ ...priceData, item: e.target.value })}
                placeholder="e.g. Potato / Onion / Milk"
                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white border-2 border-black p-3 sm:p-4 rounded-2xl">
                <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Price (₹)</label>
                <div className="flex items-center gap-1">
                  <span className="font-black text-sm">₹</span>
                  <input 
                    type="number" 
                    required={type === 'market'}
                    value={priceData.price}
                    onChange={(e) => setPriceData({ ...priceData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0"
                  />
                </div>
              </div>
              <div className="bg-white border-2 border-black p-3 sm:p-4 rounded-2xl">
                <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Unit</label>
                <select 
                  value={priceData.unit}
                  onChange={(e) => setPriceData({ ...priceData, unit: e.target.value })}
                  className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0 appearance-none uppercase"
                >
                  <option value="kg">Per KG</option>
                  <option value="dozen">Per Dozen</option>
                  <option value="piece">Per Piece</option>
                  <option value="liter">Per Liter</option>
                  <option value="pau">Per Pau (250g)</option>
                  <option value="gram">Per 100g</option>
                </select>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase text-saffron/60 italic leading-tight">TIP: Upload an image of your Rate Board or Cart for verification!</p>
          </div>
        )}

        {type === 'event' && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-4 bg-blue-50 p-4 sm:p-6 rounded-3xl border-4 border-blue-600 shadow-[8px_8px_0_0_rgba(37,99,235,1)]">
            <h3 className="text-base sm:text-lg font-black uppercase italic text-blue-600 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
              Event Details (Required)
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white border-2 border-black p-3 sm:p-4 rounded-2xl">
                <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Date</label>
                <input 
                  type="date" 
                  required={type === 'event'}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0"
                />
              </div>
              <div className="bg-white border-2 border-black p-3 sm:p-4 rounded-2xl">
                <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Time</label>
                <input 
                  type="time" 
                  required={type === 'event'}
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0"
                />
              </div>
            </div>
            <div className="bg-white border-2 border-black p-3 sm:p-4 rounded-2xl">
              <label className="block text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1">Venue / Location Details</label>
              <input 
                type="text" 
                required={type === 'event'}
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Where exactly in Mumbai? (e.g. Phoenix Mall)"
                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0"
              />
            </div>
          </div>
        )}

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
                  <div className="flex-1 flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Area Name (e.g. Bandra West)"
                      className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold focus:ring-0 text-black placeholder-gray-300 border-b border-gray-100"
                    />
                    <input 
                      type="text" 
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Pincode (e.g. 400050)"
                      className="w-full bg-transparent border-none p-0 text-[10px] sm:text-xs font-bold focus:ring-0 text-black placeholder-gray-300"
                      inputMode="numeric"
                    />
                  </div>
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
