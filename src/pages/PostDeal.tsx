import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Sparkles
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
    mediaUrl: ''
  });

  const categories = [
    { id: 'food', label: 'Food & Dining' },
    { id: 'retail', label: 'Retail & Shopping' },
    { id: 'services', label: 'Local Services' },
    { id: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
        savedBy: []
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
