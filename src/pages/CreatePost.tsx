import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Image as ImageIcon, MapPin, Send, X, Video, Play, RefreshCw, AlertTriangle, Trophy, IndianRupee, Calendar, Check, Copy, Sparkles, Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { validatePostContent } from '../services/aiService';
import { normalizeLocation } from '../lib/locationUtils';

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const locationState = useLocation();
  const initialType = (locationState.state as any)?.initialType || 'news';
  
  const [content, setContent] = useState('');
  const [type, setType] = useState<'general' | 'news' | 'event' | 'weather' | 'alert' | 'market'>(initialType);
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

  // Sponsored Ads / Campaign payment states
  const [isSponsored, setIsSponsored] = useState(false);
  const [campaignDurationDays, setCampaignDurationDays] = useState(7);
  const [paymentTxId, setPaymentTxId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [ownerConfig, setOwnerConfig] = useState({
    upiId: '8600869341@okaxis',
    phone: '+918600869341'
  });

  useEffect(() => {
    const unsubOwner = onSnapshot(doc(db, 'system_config', 'owner_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOwnerConfig({
          upiId: data.upiId || '8600869341@okaxis',
          phone: data.phone || '+918600869341'
        });
      }
    });
    return () => unsubOwner();
  }, []);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    if (isSponsored) {
      if (!paymentTxId.trim() || paymentTxId.trim().length < 6) {
        setValidationError("Please enter a valid UPI Transaction ID (at least 6 characters) to submit your sponsored ad request.");
        return;
      }
      if (campaignDurationDays === 99999) {
        setValidationError("Sponsored campaigns cannot have Unlimited duration. Please select a valid period (1, 3, 7, 15, or 30 days).");
        return;
      }
    }

    setIsLoading(true);
    try {
      const validation = await validatePostContent(content);
      if (!validation.isSafe) {
        setValidationError(validation.reason || "Content failed safety verification.");
        setIsLoading(false);
        return;
      }

      const normalizedArea = normalizeLocation(locationName || user.location?.areaName || 'Mumbai');

      const postData: any = {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content: content.trim(),
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        type,
        language: user.language || 'en',
        isSponsored,
        paymentTxId: isSponsored ? paymentTxId.trim() : null,
        paymentStatus: isSponsored ? 'pending' : null,
        campaignDurationDays,
        expiresAt: campaignDurationDays === 99999 ? null : new Date(Date.now() + campaignDurationDays * 24 * 60 * 60 * 1000),
        location: {
          areaName: normalizedArea,
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
        postData.eventDetails = { date: eventDate, time: eventTime, venue: eventVenue, rsvps: [] };
      }
      if (type === 'alert') postData.isUrgent = isUrgent;
      if (type === 'market') postData.priceData = priceData;

      await addDoc(collection(db, 'posts'), postData);
      
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const currentCount = (user.postCount || 0) + 1;
        
        await updateDoc(userRef, { 
          postCount: currentCount
        });
      }

      navigate('/');
    } catch (error) {
      console.error("Transmission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto p-6 pb-24 min-h-screen bg-[#F8F9FA] relative">
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-blue-600/90 backdrop-blur-md"
          >
            <div className="bg-white p-10 rounded-[40px] text-center pro-shadow max-w-sm">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 mb-2">MILESTONE</h2>
              <p className="font-bold text-gray-400 text-sm mb-6 uppercase tracking-widest">Payout Threshold reached</p>
              <div className="text-emerald-600 text-4xl font-black italic">+₹10</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-10">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-xl pro-shadow border border-gray-100 text-gray-400 hover:text-gray-900 transition-all">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Transmission</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Broadcast Update</p>
        </div>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 pro-shadow"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-600 text-[11px] uppercase tracking-widest">Verification Failed</h3>
                <p className="text-[10px] font-medium text-red-400 mt-1 leading-relaxed italic">{validationError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Type Ribbon */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
          {['news', 'alert', 'market', 'event', 'weather', 'general'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t as any)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                type === t 
                ? 'bg-blue-600 text-white pro-shadow ring-4 ring-blue-600/10' 
                : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'
              }`}
            >
              {t === 'news' ? '🗞️ Local News' : 
               t === 'alert' ? '🚨 Safety Alert' :
               t === 'market' ? '⚖️ Market Rate' :
               t === 'event' ? '📅 Event' :
               t === 'weather' ? '☁️ Weather' :
               '💬 General'}
            </button>
          ))}
        </div>

        {type === 'market' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-white p-6 rounded-[32px] pro-shadow border border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 mb-4">
              <IndianRupee className="w-4 h-4" />
              Market Rate Indexing
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Asset Name</label>
                <input 
                  type="text" required={type === 'market'} value={priceData.item}
                  onChange={(e) => setPriceData({ ...priceData, item: e.target.value })}
                  placeholder="e.g. Alphonso Mangoes"
                  className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 placeholder-gray-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Spot Price</label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-gray-400 text-sm">₹</span>
                    <input 
                      type="number" required={type === 'market'} value={priceData.price}
                      onChange={(e) => setPriceData({ ...priceData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 placeholder-gray-300"
                    />
                  </div>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Unit</label>
                  <select 
                    value={priceData.unit} onChange={(e) => setPriceData({ ...priceData, unit: e.target.value })}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 appearance-none uppercase text-gray-900"
                  >
                    <option value="kg">Per KG</option>
                    <option value="dozen">Per Dozen</option>
                    <option value="piece">Per Piece</option>
                    <option value="liter">Per Liter</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'event' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-white p-6 rounded-[32px] pro-shadow border border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4" />
              Itinerary Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Date</label>
                <input 
                  type="date" required={type === 'event'} value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900"
                />
              </div>
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Time</label>
                <input 
                  type="time" required={type === 'event'} value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900"
                />
              </div>
            </div>
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Venue</label>
              <input 
                type="text" required={type === 'event'} value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Physical address or venue name"
                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 placeholder-gray-300"
              />
            </div>
          </div>
        )}

        {type === 'alert' && (
           <div 
             className={`p-5 rounded-[28px] border-2 transition-all cursor-pointer flex items-center justify-between pro-shadow ${isUrgent ? 'bg-red-600 border-red-600 text-white shadow-red-200' : 'bg-white border-gray-100'}`}
             onClick={() => setIsUrgent(!isUrgent)}
            >
             <div>
               <p className="font-black uppercase tracking-widest text-[11px] italic">Emergency Alert</p>
               <p className={`text-[9px] font-bold uppercase mt-0.5 tracking-tight ${isUrgent ? 'text-white/60' : 'text-gray-400'}`}>High priority network notification</p>
             </div>
             <div className={`w-10 h-5 rounded-full relative transition-all ring-1 ring-black/5 ${isUrgent ? 'bg-white' : 'bg-gray-100'}`}>
               <motion.div 
                 animate={{ x: isUrgent ? 22 : 2 }}
                 className={`absolute top-1 w-3 h-3 rounded-full ${isUrgent ? 'bg-red-600' : 'bg-gray-300'}`} 
               />
             </div>
           </div>
        )}

        <div className="bg-white rounded-[40px] p-6 pro-shadow border border-gray-100 ring-1 ring-black/[0.02]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Propagate information to the community...`}
            className="w-full h-40 resize-none border-none focus:ring-0 text-lg font-bold text-gray-900 placeholder-gray-200"
          />
          
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-50">
            <button 
              type="button" 
              onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); }}
              className="flex items-center gap-2 group"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Visual</span>
            </button>
            <button 
              type="button" 
              onClick={() => { fileInputRef.current?.setAttribute('accept', 'video/*'); fileInputRef.current?.click(); }}
              className="flex items-center gap-2 group"
            >
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Clip</span>
            </button>
            <button 
              type="button" 
              onClick={() => setShowLocationInput(!showLocationInput)}
              className="flex items-center gap-2 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${showLocationInput ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${showLocationInput ? 'text-gray-900' : 'text-gray-400'}`}>Geocode</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          </div>
        </div>

        {/* Location Subform */}
        <AnimatePresence>
          {showLocationInput && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100"
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1 tracking-widest leading-none">Node Area</label>
                    <input 
                      type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Juhu, Mumbai"
                      className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 placeholder-gray-200"
                    />
                  </div>
                  <div className="flex-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1 tracking-widest leading-none">ZIP Protocol</label>
                    <input 
                      type="text" value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="4000XX"
                      className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 placeholder-gray-200"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post Duration / Validity Option */}
        <div className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block flex items-center gap-1.5">
            <span>⏳ Post Active Duration / Validity (किती दिवस दाखवायचे?)</span>
          </label>
          <select
            value={campaignDurationDays}
            onChange={(e) => setCampaignDurationDays(Number(e.target.value))}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-1 ring-blue-500 text-gray-800"
          >
            <option value={1}>1 Day (१ दिवस - Short term alert/update)</option>
            <option value={3}>3 Days (३ दिवस)</option>
            <option value={7}>7 Days (१ आठवडा - Standard)</option>
            <option value={15}>15 Days (१५ दिवस)</option>
            <option value={30}>30 Days (१ महिना)</option>
            <option value={99999}>Unlimited / No Expiry (नेहमीसाठी)</option>
          </select>
          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">
             This post will automatically expire and be hidden from the feed after the chosen active period.
          </p>
        </div>

        {/* Toggle Sponsorship Ad */}
        <div className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#0D1B2A] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> Promote as Sponsored Ad
              </h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Boost visibility of this post inside the feeds</p>
            </div>
            <button
              type="button"
              onClick={() => setIsSponsored(!isSponsored)}
              className={`w-12 h-6 rounded-full relative transition-colors ${isSponsored ? 'bg-indigo-600' : 'bg-gray-100'}`}
            >
              <motion.div
                animate={{ x: isSponsored ? 26 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full pro-shadow"
              />
            </button>
          </div>

          <AnimatePresence>
            {isSponsored && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-4 space-y-4 border-t border-gray-100"
              >
                {/* UPI campaign details */}
                <div className="bg-slate-900 text-white rounded-[24px] p-5 space-y-3 relative overflow-hidden">
                  <div className="relative z-10 space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Campaign Booking Payment</span>
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest leading-relaxed">
                      Make an upfront payment of <b className="text-white">₹99</b> directory activation fee via UPI ID to launch this sponsored post:
                    </p>
                    
                    <div className="flex items-center justify-between border border-white/10 bg-white/5 rounded-xl p-3 mt-2">
                      <code className="text-indigo-200 font-mono text-[10px] font-bold">{ownerConfig.upiId}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(ownerConfig.upiId);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
                      >
                        {copiedUpi ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-[9px] font-bold text-indigo-300 uppercase tracking-widest">
                      <Phone className="w-3.5 h-3.5" /> Support/WhatsApp: {ownerConfig.phone}
                    </div>
                  </div>
                </div>

                {/* Linked Campaign Info */}
                <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-[24px] space-y-1">
                  <span className="text-[9px] font-black uppercase text-indigo-700 tracking-widest block">Selected Campaign Duration</span>
                  <p className="text-[11px] font-bold text-indigo-950">
                    {campaignDurationDays === 99999 ? '🚨 Please select a limited active period (1-30 days) above.' : `${campaignDurationDays} Days Boost Campaign (selected above)`}
                  </p>
                </div>

                {/* UTR reference number input */}
                <div className="bg-gray-50 p-4 border border-gray-100 rounded-[24px] space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Enter Payment Transaction ID (UTR / Ref No.)</label>
                  <input
                    required={isSponsored}
                    type="text"
                    value={paymentTxId}
                    onChange={(e) => setPaymentTxId(e.target.value)}
                    placeholder="e.g. 415302914758 or TXN10293"
                    className="w-full bg-white border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-1 ring-indigo-500 uppercase font-mono tracking-wider text-gray-800"
                  />
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tight leading-relaxed">
                    * Our administrator team will review and verify this transaction. Your post will stay visible as "Awaiting Verification" to you, but will only broadcast publicly once approved by Aryan!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Media Preview */}
        <AnimatePresence>
          {mediaUrl && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative rounded-[40px] overflow-hidden pro-shadow border-4 border-white aspect-video bg-gray-900 group"
            >
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="relative w-full h-full">
                   <video src={mediaUrl} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center pro-shadow">
                        <Play className="w-6 h-6 fill-gray-900 translate-x-0.5" />
                      </div>
                   </div>
                </div>
              )}
              <button 
                type="button" onClick={removeMedia}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2.5 rounded-2xl text-gray-900 pro-shadow hover:bg-red-500 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className={`w-full py-5 rounded-[32px] text-white font-black uppercase tracking-[0.2em] text-sm pro-shadow transition-all relative overflow-hidden ${isLoading ? 'bg-gray-400' : 'bg-gray-900 hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-900/10'}`}
        >
          {isLoading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Broadcast to Network'}
        </button>
      </form>
    </div>
  );
}
