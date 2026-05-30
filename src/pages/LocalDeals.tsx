import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc, arrayUnion, arrayRemove, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Deal, DailyPromoProof } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Plus, 
  ChevronRight, 
  Search,
  Utensils,
  ShoppingBag,
  Wrench,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  Bell,
  BellRing,
  Share2,
  Video,
  Upload,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/common/LocationPicker';
import { ADMIN_EMAILS } from '../constants';

const LocalDeals: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'saved'>('browse');
  const [reminders, setReminders] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [proofs, setProofs] = useState<DailyPromoProof[]>([]);
  
  // Camera simulation state
  const [uploadingProofForDealId, setUploadingProofForDealId] = useState<string | null>(null);
  const [simulatingCamera, setSimulatingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [customRemarks, setCustomRemarks] = useState('');
  const [actualFileBase64, setActualFileBase64] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleShare = async (e: React.MouseEvent, deal: Deal) => {
    e.stopPropagation();
    const shareText = `🔥 Special Offer from ${deal.businessName}: "${deal.title}" - ${deal.offer}! Claim it on InformMe app.`;
    const shareUrl = window.location.origin + `/deals`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopiedId(deal.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error("Failed to copy clipboard", err);
      }
    }
  };

  const categories = [
    { id: 'all', label: 'All Deals', icon: Tag, color: 'text-gray-600', bg: 'bg-gray-100' },
    { id: 'food', label: 'Food & Dining', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'retail', label: 'Retail & Shopping', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'services', label: 'Local Services', icon: Wrench, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'other', label: 'Other Offers', icon: HelpCircle, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  useEffect(() => {
    if (!user?.location?.areaName) return;

    let q = query(
      collection(db, 'deals'),
      where('location.areaName', '==', user.location.areaName),
      limit(100)
    );

    if (selectedCategory !== 'all') {
      q = query(
        collection(db, 'deals'),
        where('location.areaName', '==', user.location.areaName),
        where('category', '==', selectedCategory),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let dealsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deal[];
      
      const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
      dealsData = dealsData.filter(deal => {
        let isExpired = false;
        if (deal.validUntil) {
          const expDate = deal.validUntil.toDate ? deal.validUntil.toDate() : new Date(deal.validUntil);
          isExpired = expDate.getTime() < Date.now();
        }

        const isMyOwn = user && deal.authorId === user.uid;

        // Hide expired deals for general public
        if (isExpired && !isMyOwn && !isAdmin) {
          return false;
        }

        if (deal.isApproved) return true;
        return isMyOwn || isAdmin;
      });

      // Sort in-memory to avoid composite index requirements, keeping pinned promotions at the absolute top
      dealsData.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : Date.now());
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : Date.now());
        return timeB - timeA;
      });

      setDeals(dealsData);
      setLoading(false);
    }, (error) => {
      console.error("Deals subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory, user?.location?.areaName]);

  useEffect(() => {
    if (!user) return;
    const qProofs = query(
      collection(db, 'promotion_proofs'),
      where('merchantId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(qProofs, (snapshot) => {
      const proofsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyPromoProof[];
      setProofs(proofsData);
    });
    return () => unsubscribe();
  }, [user]);

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setSimulatingCamera(true);
    } catch (err) {
      console.warn("Camera access fallback mode activated:", err);
      setSimulatingCamera(true); // Always support standard web simulation
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setSimulatingCamera(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Please upload photo/video proof under 2MB for optimized storage!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setActualFileBase64(reader.result as string);
    };
    reader.onerror = (error) => {
      console.error("File loading error:", error);
    };
    reader.readAsDataURL(file);
  };

  const submitPromoProof = async (deal: Deal) => {
    if (!user) return;
    setUploadLoading(true);

    try {
      const videoUrl = actualFileBase64 || `https://assets.mixkit.co/videos/preview/mixkit-holding-a-cellphone-pointing-at-the-screen-42353-large.mp4`;
      
      const proofData = {
        dealId: deal.id,
        merchantId: user.uid,
        merchantName: user.displayName || "Partner Merchant",
        businessName: deal.businessName,
        videoUrl,
        remarks: customRemarks.trim() || "Daily counter check-in promo video uploaded.",
        uploadedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'promotion_proofs'), proofData);
      
      handleStopCamera();
      setUploadingProofForDealId(null);
      setCustomRemarks('');
      setActualFileBase64(null);
      alert("Daily offline promotion video proof submitted successfully! Aryan will review it shortly.");
    } catch (error) {
      console.error("Error submitting proof:", error);
      alert("Failed to submit proof. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const toggleSaveDeal = async (dealId: string, isSaved: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const dealRef = doc(db, 'deals', dealId);
    try {
      if (isSaved) {
        await updateDoc(dealRef, {
          savedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(dealRef, {
          savedBy: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error toggling saved state:", error);
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          deal.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          deal.offer.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'saved') {
      return matchesSearch && deal.savedBy?.includes(user?.uid || '');
    }
    return matchesSearch;
  });

  const getDaysRemaining = (date: any) => {
    if (!date) return null;
    const expiry = date.toDate ? date.toDate() : new Date(date);
    const diff = expiry.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <header className="bg-white p-8 pt-12 pb-12 border-b border-gray-100 pro-shadow relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-6 overflow-x-auto no-scrollbar py-1">
             <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
            </button>
            <LocationPicker />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center pro-shadow ring-4 ring-orange-600/10">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">Local Deals</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Business Offers</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/post-deal')}
              className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-all pro-shadow"
            >
              <Plus className="w-4 h-4" />
              Post a Deal
            </button>
          </div>

          <div className="flex gap-4 p-1 bg-gray-100 rounded-2xl max-w-sm mb-8">
            <button
               onClick={() => setActiveTab('browse')}
               className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                 activeTab === 'browse' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
               }`}
            >
              Browse
            </button>
            <button
               onClick={() => setActiveTab('saved')}
               className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                 activeTab === 'saved' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
               }`}
            >
              Saved
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by shop or offer..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 ring-orange-100 outline-none pro-shadow-inner"
            />
          </div>
        </div>
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/30 rounded-full blur-3xl -mr-32 -mt-32" />
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-12">
        {/* Category Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-all border ${
                selectedCategory === cat.id 
                  ? 'bg-white border-orange-200 text-orange-600 pro-shadow' 
                  : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
              }`}
            >
              <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? cat.color : 'text-gray-400'}`} />
              <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Deals Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {loading ? (
             Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="h-64 bg-white rounded-[40px] animate-pulse pro-shadow" />
             ))
          ) : filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => {
              const isSaved = deal.savedBy?.includes(user?.uid || '');
              const isReminded = reminders.includes(deal.id);
              const daysLeft = getDaysRemaining(deal.validUntil);
              
              return (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-8 rounded-[40px] pro-shadow border flex flex-col group relative overflow-hidden transition-all duration-300 ${
                    deal.isPinned 
                      ? 'bg-gradient-to-br from-amber-50/50 via-white to-amber-50/10 border-amber-300 ring-2 ring-amber-200/50 shadow-md shadow-amber-50/30' 
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                       {deal.isPinned && (
                         <div className="px-2.5 py-1 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-0.5 shadow-sm" title="Sponsored Pinned Promotion">
                           <Sparkles className="w-3 h-3 text-white fill-white animate-pulse" />
                           <span>🔥 FEATURED / टॉप जाहिरात</span>
                         </div>
                       )}
                       <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100">
                          {deal.category}
                       </div>
                       {deal.isFreePromotion && (
                         <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1" title="App Promotion Partner">
                            <span>🤝 ॲप पार्टनर / App Partner</span>
                         </div>
                       )}
                       {daysLeft !== null && daysLeft <= 3 && (
                         <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expiring Soon
                         </div>
                       )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleShare(e, deal)}
                        className={`p-3 rounded-2xl transition-all relative ${
                          copiedId === deal.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-50 text-gray-400 hover:text-emerald-500'
                        }`}
                        title="Share offer"
                      >
                        {copiedId === deal.id ? (
                          <span className="text-[10px] font-black uppercase tracking-widest px-1">Copied</span>
                        ) : (
                          <Share2 className="w-5 h-5" />
                        )}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isReminded) {
                            setReminders(reminders.filter(id => id !== deal.id));
                          } else {
                            setReminders([...reminders, deal.id]);
                          }
                        }}
                        className={`p-3 rounded-2xl transition-all ${
                          isReminded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-50 text-gray-400 hover:text-indigo-600'
                        }`}
                        title="Remind me before this deal expires"
                      >
                        {isReminded ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveDeal(deal.id, isSaved);
                        }}
                        className={`p-3 rounded-2xl transition-all ${
                          isSaved ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-gray-50 text-gray-400 hover:text-orange-600'
                        }`}
                      >
                        {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 relative z-10">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{deal.businessName}</h3>
                    <h2 className="text-2xl font-black text-gray-900 group-hover:text-orange-600 transition-colors mb-2 tracking-tight line-clamp-1">{deal.title}</h2>
                    <div className="flex items-center gap-2 mb-4">
                       <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
                       <p className="text-xl font-bold text-orange-600">{deal.offer}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-500 line-clamp-2 leading-relaxed mb-6">
                      {deal.description}
                    </p>
                  </div>

                  {/* Daily App Promotion Video Verification widget for Partner Merchant */}
                  {(() => {
                    const isMyOwn = user && deal.authorId === user.uid;
                    const isFreeBarter = deal.isFreePromotion || deal.paymentTxId === 'FREE_PROMOTION_PARTNER';
                    const todayStr = new Date().toISOString().split('T')[0];
                    const hasUploadedToday = proofs.some(p => p.dealId === deal.id && p.uploadedAt?.startsWith(todayStr));

                    if (!isMyOwn || !isFreeBarter) return null;

                    return (
                      <div className="mt-2 mb-4 p-5 bg-indigo-50/50 border border-indigo-100 rounded-[28px] relative z-20 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className={`w-4 h-4 ${hasUploadedToday ? 'text-emerald-600 animate-bounce' : 'text-indigo-600'}`} />
                            <h4 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider">
                              {hasUploadedToday ? '🟢 TODAY\'S PROMO ACTIVE (आजची जाहिरात पूर्ण)' : '🔴 UPDATE PROMO PROOF (रोजची व्हिडिओ खात्री)'}
                            </h4>
                          </div>
                          <span className="text-[8px] font-sans font-black uppercase text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                            Barter Active
                          </span>
                        </div>

                        {hasUploadedToday ? (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-700 leading-normal font-semibold">
                              धन्यवाद! तुमची आजची जाहिरात यशस्वीरित्या नोंदवली गेली आहे. आर्यन गडवेकर तुमच्या या व्हिडिओची खात्री करतील.
                            </p>
                            <div className="bg-emerald-50 text-emerald-800 text-[10px] font-bold p-3 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Proof submitted today. Excellent work boosting local downloads!</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                              तुमची ऑफर मोफत चालू ठेवण्यासाठी, दुकानातून ॲप जाहिरात करतानाचा रोज एक लहान ५ सेकंदाचा व्हिडिओ किंवा फोटो पुरावा म्हणून अपलोड करा.
                            </p>

                            {uploadingProofForDealId === deal.id ? (
                              <div className="space-y-3 bg-white p-4 rounded-2xl border border-indigo-100">
                                {simulatingCamera ? (
                                  <div className="space-y-2">
                                    <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white border border-slate-800">
                                      <Video className="w-8 h-8 text-indigo-400 animate-pulse mb-2" />
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Live Custom Camera Mode</span>
                                      <span className="text-[9px] text-slate-400 mt-1">Simulating HD verification feed...</span>
                                      
                                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                        REC 00:05
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={handleStopCamera}
                                        className="flex-1 text-center bg-gray-100 text-gray-700 hover:bg-gray-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => submitPromoProof(deal)}
                                        disabled={uploadLoading}
                                        className="flex-1 text-center bg-indigo-600 text-white hover:bg-indigo-700 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                      >
                                        {uploadLoading ? 'Uploading...' : 'Capture & Submit'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors rounded-xl p-6 text-center cursor-pointer relative">
                                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Select Promo Video/Image</span>
                                      <p className="text-[8px] text-gray-400 mt-1 uppercase">Under 2MB file (MP4 / PNG / JPG)</p>
                                      <input 
                                        type="file" 
                                        onChange={handleFileChange}
                                        accept="video/*,image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                      />
                                    </div>

                                    {actualFileBase64 && (
                                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase text-indigo-700 truncate max-w-[200px]">✓ Selected file loaded!</span>
                                        <button 
                                          type="button" 
                                          onClick={() => setActualFileBase64(null)} 
                                          className="text-xs text-red-600 font-extrabold"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={handleStartCamera}
                                        className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                                      >
                                        <Camera className="w-4 h-4" /> Cam Capture
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => submitPromoProof(deal)}
                                        disabled={uploadLoading || !actualFileBase64}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                                      >
                                        {uploadLoading ? 'Saving...' : 'Submit File Proof'}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-1 mt-2 font-sans">
                                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider block ml-1">Daily Remarks (आजचा अनुभव/नोंद)</label>
                                  <input
                                    type="text"
                                    value={customRemarks}
                                    onChange={(e) => setCustomRemarks(e.target.value)}
                                    placeholder="उदा. आज काउंटर पोस्टरद्वारे १० लोकांनी ॲप डाऊनलोड केले"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
                                  />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setUploadingProofForDealId(deal.id)}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-100"
                              >
                                <Video className="w-4 h-4 text-white animate-pulse" /> upload daily verification proof
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-4 h-4 text-india-green" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{deal.location.areaName}</span>
                     </div>
                     <div className={`text-[9px] font-black uppercase tracking-[0.2em] ${daysLeft === 0 ? 'text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 font-bold' : 'text-gray-400'}`}>
                        {daysLeft === 0 ? '🚫 EXPIRED CAMPAIGN' : `Valid: ${daysLeft} Days Left`}
                     </div>
                  </div>
                  
                  {/* Decorative faint icon */}
                  <Tag className="absolute -bottom-8 -right-8 w-32 h-32 text-gray-50 opacity-10 group-hover:scale-110 transition-transform" />
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-32 text-center flex flex-col items-center justify-center">
               <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-6">
                  <Tag className="w-10 h-10" />
               </div>
               <p className="text-sm font-bold text-gray-300 uppercase tracking-widest leading-relaxed">
                 {activeTab === 'saved' ? 'No saved deals yet.' : 'No active deals in this sector.'}
               </p>
               {activeTab === 'browse' && (
                 <button 
                  onClick={() => navigate('/post-deal')}
                  className="mt-6 text-orange-600 text-xs font-black uppercase border-b-2 border-orange-600 tracking-widest"
                >
                  Be the first to post
                </button>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LocalDeals;
