import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Tag, 
  Store, 
  Calendar, 
  MapPin, 
  Image as ImageIcon, 
  Info,
  Loader2,
  CheckCircle2,
  Sparkles,
  Percent,
  Coins,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Phone,
  MessageSquare
} from 'lucide-react';

const PostDeal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    offer: '',
    description: '',
    businessName: '',
    category: 'retail',
    validUntil: '',
    mediaUrl: '',
    // Royalty inputs
    signerName: '',
    signerPhone: '',
    expectedUnitsPerMonth: '50',
    expectedProfitPerUnit: '100',
    hasSignedProfitAgreement: false
  });

  const [paymentTxId, setPaymentTxId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'free_promo'>('upi');
  const [freePromoDetails, setFreePromoDetails] = useState('');
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

  const categories = [
    { id: 'food', label: 'Food & Dining' },
    { id: 'retail', label: 'Retail & Shopping' },
    { id: 'services', label: 'Local Services' },
    { id: 'other', label: 'Other' }
  ];

  // Live Calculations
  const units = parseInt(formData.expectedUnitsPerMonth) || 0;
  const unitProfit = parseInt(formData.expectedProfitPerUnit) || 0;
  const totalEstimatedProfit = units * unitProfit;
  const royaltyShare2Percent = totalEstimatedProfit * 0.02;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.hasSignedProfitAgreement) {
      alert("Please accept the 2% profit-sharing agreement to proceed.");
      return;
    }

    if (!formData.signerName.trim()) {
      alert("Please enter your signature name to authorize the agreement.");
      return;
    }

    if (paymentMethod === 'upi') {
      if (!paymentTxId.trim() || paymentTxId.trim().length < 6) {
        alert("Please enter a valid upfront listing Payment Transaction ID (at least 6 characters) to activate your deal campaign.");
        return;
      }
    } else {
      if (!freePromoDetails.trim() || freePromoDetails.trim().length < 10) {
        alert("Please explain how you will promote the InformMe app in your shop (at least 10 characters).");
        return;
      }
    }

    setLoading(true);
    try {
      const dealData = {
        authorId: user.uid,
        authorName: user.displayName,
        title: formData.title,
        offer: formData.offer,
        description: formData.description,
        businessName: formData.businessName,
        category: formData.category,
        location: {
          lat: user.location?.lat || 20,
          lng: user.location?.lng || 78,
          areaName: user.location?.areaName || 'Unknown Region'
        },
        validUntil: new Date(formData.validUntil),
        createdAt: serverTimestamp(),
        mediaUrl: formData.mediaUrl || null,
        savedBy: [],
        
        // Profit Share Fields
        hasSignedProfitAgreement: formData.hasSignedProfitAgreement,
        signerName: formData.signerName,
        signerPhone: formData.signerPhone,
        expectedUnitsPerMonth: units,
        expectedProfitPerUnit: unitProfit,
        selfReportedProfit: totalEstimatedProfit,
        payoutStatus: 'pending',
        adminVerifiedAmount: 0,
        paymentTxId: paymentMethod === 'upi' ? paymentTxId.trim() : 'FREE_PROMOTION_PARTNER',
        isFreePromotion: paymentMethod === 'free_promo',
        freePromoDetails: paymentMethod === 'free_promo' ? freePromoDetails.trim() : null
      };

      await addDoc(collection(db, 'deals'), dealData);
      setSuccess(true);
      setTimeout(() => navigate('/deals'), 2000);
    } catch (err) {
      console.error("Error posting deal:", err);
      alert("Failed to post deal. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mb-8"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Deal Published</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network validation complete. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <header className="bg-white p-8 pt-12 pb-12 border-b border-gray-100 pro-shadow">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">New Deal</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{user?.location?.areaName || 'Local'} Economic Network</p>
            </div>
          </div>
          <Tag className="w-8 h-8 text-orange-600 opacity-20" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Business Identity */}
          <section className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <Store className="w-4 h-4 text-gray-400" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Details</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Shop/Business Name</label>
              <input
                required
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                placeholder="e.g. Sharma Groceries or Green Cafe"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all appearance-none"
                >
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Location</label>
                <div className="w-full bg-gray-100 text-gray-400 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {user?.location?.areaName || 'Select Profile Location'}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Offer Content */}
          <section className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <Sparkles className="w-4 h-4 text-orange-500" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Offer Insights</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Deal Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Weekend Big Sale or Buy 1 Get 1"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Main Offer Description</label>
              <input
                required
                type="text"
                value={formData.offer}
                onChange={(e) => setFormData({...formData, offer: e.target.value})}
                placeholder="e.g. 50% OFF everything or ₹100 Discount"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all text-orange-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Detailed terms (Optional)</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell users more about this deal, valid items, etc."
                className="w-full bg-gray-50 border border-gray-100 rounded-[32px] py-4 px-6 text-sm font-medium focus:ring-2 ring-orange-100 outline-none transition-all resize-none"
              />
            </div>
          </section>

          {/* Section 3: Time Frame */}
          <section className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <Calendar className="w-4 h-4 text-gray-400" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Validity Period</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Valid Until</label>
              <input
                required
                type="date"
                min={new Date().toISOString().split('T')[0]} // Cannot be in the past
                value={formData.validUntil}
                onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all"
              />
            </div>
          </section>
          
          {/* Section 4: 2% Profit Share Agreement */}
          <section className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-indigo-50 text-indigo-600 rounded-bl-3xl flex items-center gap-1">
              <Percent className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Royalty Cut</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
               <Coins className="w-4 h-4 text-indigo-600" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0D1B2A]">2% Campaign Profit Share Agreement</h3>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              To list your store's special offer on the InformMe Local Economic Network, you agree to transfer <b className="text-gray-900">2% of the net campaign profit</b> generated from deals claimed by customers via the app to the platform owner, <b>Aryan Gadewar</b>.
            </p>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-50/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">Est. Units Redeemed / Month</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.expectedUnitsPerMonth}
                    onChange={(e) => setFormData({...formData, expectedUnitsPerMonth: e.target.value})}
                    placeholder="50"
                    className="w-full bg-white border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">Net Profit per Unit (₹)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.expectedProfitPerUnit}
                    onChange={(e) => setFormData({...formData, expectedProfitPerUnit: e.target.value})}
                    placeholder="100"
                    className="w-full bg-white border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live Ledger Calculation Box */}
            <div className="p-6 bg-slate-900 text-white rounded-[32px] space-y-4">
               <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-3">
                 <FileText className="w-3.5 h-3.5 text-indigo-400" /> Live Revenue Share Estimation
               </h4>
               <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Expected Total Profit:</span>
                    <span className="font-bold text-white">₹{totalEstimatedProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Your Share (98%):</span>
                    <span className="font-bold text-slate-100">₹{(totalEstimatedProfit * 0.98).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-indigo-300 font-bold">
                    <span className="flex items-center gap-1">Aryan's Royalty Cut (2%):</span>
                    <span className="text-xl font-black text-indigo-400">₹{royaltyShare2Percent.toLocaleString()}</span>
                  </div>
               </div>
            </div>

            {/* Signature Capture */}
            <div className="space-y-4 pt-2">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Digital Signature (Your Name)</label>
                    <input
                      required
                      type="text"
                      value={formData.signerName}
                      onChange={(e) => setFormData({...formData, signerName: e.target.value})}
                      placeholder="Type Full Name to Authorize"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none uppercase font-mono tracking-wider italic text-gray-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Signer Contact Number (WhatsApp)</label>
                    <input
                      required
                      type="tel"
                      value={formData.signerPhone}
                      onChange={(e) => setFormData({...formData, signerPhone: e.target.value})}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-5 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                    />
                  </div>
               </div>

               <label className="flex items-start gap-3 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-50 cursor-pointer hover:bg-emerald-50/70 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.hasSignedProfitAgreement}
                    onChange={(e) => setFormData({...formData, hasSignedProfitAgreement: e.target.checked})}
                    className="mt-1 sticky top-0 accent-emerald-600 rounded border-gray-300 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[10px] leading-relaxed font-bold tracking-tight text-emerald-800 uppercase">
                    I agree to the 2% profit royalty terms. I certify that all self-estimates provided represent true records and agree to transfer 2% of my net campaign earnings to Aryan Gadewar via UPI or Bank Transfer.
                  </span>
               </label>
            </div>
          </section>

          {/* Section 5: Upfront Listing Payment / Free App Promotion Option */}
          <section className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-indigo-50 text-indigo-600 rounded-bl-3xl flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Select Option</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
               <Coins className="w-4 h-4 text-[#0D1B2A]" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0D1B2A]">Campaign Activation Mode</h3>
            </div>

            {/* Tabs to select Activation Method */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
                  paymentMethod === 'upi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                💳 Pay ₹99 Upfront
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('free_promo')}
                className={`py-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
                  paymentMethod === 'free_promo' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'
                }`}
              >
                🤝 Free Promo Partnership
              </button>
            </div>

            {paymentMethod === 'upi' ? (
              <div className="space-y-6">
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  To publish your promotional campaign deal in the local feed, an upfront listing activation fee of <b className="text-gray-900">₹99</b> is required. This prevents spam and verifies your shop's authenticity.
                </p>

                <div className="bg-slate-900 text-white rounded-[32px] p-6 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">Direct UPI Activation Address</span>
                    <div className="flex items-center justify-between border border-white/10 bg-white/5 rounded-2xl p-3">
                      <code className="text-[11px] font-mono font-bold text-indigo-200">{ownerConfig.upiId}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(ownerConfig.upiId);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
                      >
                        {copiedUpi ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Phone className="w-4 h-4 text-indigo-400" />
                    <span>Enquiries & Activation Support: <a href={`tel:${ownerConfig.phone}`} className="text-white hover:underline">{ownerConfig.phone}</a></span>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 ml-1 font-sans">Payment Reference Number (12-digit UPI Transaction ID / UTR)</label>
                   <input
                     required={paymentMethod === 'upi'}
                     type="text"
                     value={paymentTxId}
                     onChange={(e) => setPaymentTxId(e.target.value)}
                     placeholder="e.g. 415309251024 or UPI/410293"
                     className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 ring-indigo-100 outline-none transition-all uppercase font-mono tracking-wider text-gray-800"
                   />
                   <p className="text-[9px] font-semibold text-amber-600 uppercase tracking-widest mt-1">
                     * After submitting, Aryan will audit the reference with his bank statements for fast deployment approval!
                   </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 bg-indigo-50/20 p-6 rounded-[32px] border border-indigo-100 border-dashed">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">🤝 ॲप जाहिरात भागीदारी (App Promotion Deal)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-bold">
                  तुमच्या ऑफरचे आम्ही ॲपवर <b className="text-indigo-900">मोफत (Free) प्रमोशन</b> करू! याच्या बदल्यात, तुम्हाला तुमच्या दुकानात आमचे ॲप रोज ग्राहकांना दाखवावे लागेल किंवा काउंटरवर क्यूआर कोड/पोस्टर लावून लोकांकडून डाऊनलोड करून घ्यावे लागेल. (App promotion daily in your shop in exchange for Free Promotion)
                </p>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-indigo-700 ml-1">तुम्ही दुकानात ॲपचे प्रमोशन कसे कराल? (Explain app promotion plan)*</label>
                  <textarea
                    required={paymentMethod === 'free_promo'}
                    rows={3}
                    value={freePromoDetails}
                    onChange={(e) => setFreePromoDetails(e.target.value)}
                    placeholder="उदा. काउंटरवर पोस्टर लावेन, रोज ५० लोकांना ॲप वापरण्यास सांगेन..."
                    className="w-full bg-white border border-gray-100 rounded-2xl py-3 px-5 text-xs font-bold focus:ring-2 ring-indigo-300 outline-none transition-all"
                  />
                  <p className="text-[8px] font-black text-indigo-500 uppercase tracking-wider block font-bold">
                    * Platform Owner Aryan Gadewar will review your plan and activate your free promotion campaign.
                  </p>
                </div>
              </div>
            )}
          </section>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-indigo-600 text-white py-6 rounded-[32px] text-sm font-black uppercase tracking-[0.3em] pro-shadow hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Deploy Deal to Network
                <Tag className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default PostDeal;
