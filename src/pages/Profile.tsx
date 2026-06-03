import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth, signOut } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { Post } from '../types';
import PostCard from '../components/feed/PostCard';
import { LogOut, Settings as SettingsIcon, MapPin, Calendar, Edit3, ShieldAlert, ShieldCheck, Activity, Info, Grid, List, Layout, ArrowLeft, MessageSquare, Zap, Crown, ArrowRight, Gift, Copy, Share2, Coins, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ADMIN_EMAILS } from '../constants';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'services'>('posts');

  const { language } = useTranslation();
  const [refereeCount, setRefereeCount] = useState(0);
  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentTxIdInput, setPaymentTxIdInput] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Fetch count of users registered using user's referral code in real-time
    const qUsersRef = query(collection(db, 'users'), where('referredBy', '==', user.uid));
    const unsubscribeUsers = onSnapshot(qUsersRef, (snapshot) => {
      const count = snapshot.size;
      setRefereeCount(count);
      
      // Auto upgrade user status to Pro / Premium for 1 Year if referee count >= 25 and not yet premium!
      if (count >= 25 && !user.isPremium) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          isPremium: true,
          subscriptionPlan: 'pro_referral_50',
          subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }).then(() => {
          alert("🎉 Congratulations! आपल्याला ५० पैकी २५ प्रत्यक्ष डाऊनलोड रेफरल मिळाल्यामुळे आपले 'PRO AI' खाते १ वर्षासाठी मोफत सक्रिय झाले आहे!");
        }).catch(err => console.error("Referral auto upgrade error:", err));
      }
    }, (err) => {
      console.error("Reference query error:", err);
    });

    // Sync active coupons published by admin
    const qCoupons = query(collection(db, 'sponsored_coupons'), where('active', '==', true));
    const unsubscribeCoupons = onSnapshot(qCoupons, (snapshot) => {
      const couponsList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setActiveCoupons(couponsList);
    }, (err) => {
      console.error("Coupons loading error:", err);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeCoupons();
    };
  }, [user]);

  const handleClaimPaidPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!paymentTxIdInput.trim()) {
      alert("कृपया Transaction ID / No. प्रविष्ट करा.");
      return;
    }
    
    setIsVerifyingPayment(true);
    // Mimic real payment verification before granting premium
    setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          isPremium: true,
          subscriptionPlan: 'pro_paid_100',
          subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          paymentTxId: paymentTxIdInput.trim()
        });
        setIsVerifyingPayment(false);
        setIsPayModalOpen(false);
        setPaymentTxIdInput('');
        alert("🎉 यशस्वी! ₹१०० चे पेमेंट स्वीकारून आपले 'PRO AI' खाते सक्रिय करण्यात आले आहे. १ वर्ष मोफत अमर्याद ॲक्सेस उपभोगू शकता!");
      } catch (err: any) {
        console.error("Payment registration error:", err);
        alert("पेमेंट अपडेट अयशस्वी: " + err.message);
        setIsVerifyingPayment(false);
      }
    }, 1500);
  };

  const copyReferralLink = () => {
    if (!user?.referralCode) return;
    const refLink = `${window.location.origin}/login?ref=${user.referralCode}`;
    navigator.clipboard.writeText(refLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isAdmin = !!user?.isAdmin || 
                  (user?.email ? ADMIN_EMAILS.includes(user.email.trim().toLowerCase()) : false) || 
                  (user?.displayName ? user.displayName.toLowerCase().trim() === 'aryan gadewar' : false);

  useEffect(() => {
    if (!user) return;

    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(postsQuery, 
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        console.error("Profile posts fetch error:", error);
        // If index is missing, try falling back to simple where
        if (error.message.includes('index')) {
          const fallbackQuery = query(
            collection(db, 'posts'),
            where('authorId', '==', user.uid)
          );
          onSnapshot(fallbackQuery, (fallbackSnapshot) => {
            const postsData = fallbackSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Post[];
            // Sort locally
            postsData.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            });
            setPosts(postsData);
            setLoading(false);
          });
        }
      }
    );

    return () => unsubscribePosts();
  }, [user]);

  const handleLogout = () => signOut(auth);

  if (!user) return null;

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F8F9FA] max-w-[500px] mx-auto overflow-hidden">
      {/* Profile Header */}
      <div className="p-6 pt-10">
        <div className="flex items-center gap-6 mb-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[32px] overflow-hidden pro-shadow ring-4 ring-white">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            {isAdmin && (
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl border-2 border-white pro-shadow">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{user.displayName}</h1>
              {isAdmin && (
                <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase mb-1">
                  ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-tight">{user.location?.areaName || "Your Location"}</span>
            </div>
            
              <div className="flex gap-4 mt-6">
              <div>
                <p className="text-lg font-black text-gray-900 leading-none">{user.postCount || 0}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('contributions')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white p-5 rounded-[28px] pro-shadow border border-gray-100 mb-8">
           <p className="text-gray-600 text-xs font-medium leading-relaxed italic">
             "{user.bio || "Active local news contributor focusing on verified updates for the community."}"
           </p>
        </div>

        {/* 🎁 Gifts & Referral Coupons Section (Shifted from AIChat screen to prevent blocking) */}
        <div className="bg-white border border-gray-100 rounded-[32px] pro-shadow overflow-hidden text-gray-900 font-sans mb-8">
          {user.isPremium ? (
            /* PREMIUM PRO COOP ACTIVE PANEL */
            <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#93C5FD]">
                    {language === 'mr' ? '💎 प्रो व्हर्जन सक्रिय' : '💎 PRO VERSION ACTIVE'}
                  </span>
                </div>
                <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider">
                  {language === 'mr' ? '१ वर्ष अमर्यादित' : '1 Year Unlimited'}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black italic tracking-tighter uppercase font-sans">
                  {language === 'mr' ? 'आपण प्रो युझर आहात!' : 'YOU ARE A PRO USER!'}
                </h3>
                <p className="text-[#94A3B8] text-[10.5px] font-semibold leading-relaxed">
                  {language === 'mr' 
                    ? 'तुम्हाला प्रगत बुद्धिमत्ता मॉडेल (Gemini Pro) आणि विश्वाची सर्व माहिती उपलब्ध आहे.' 
                    : 'You have unlocked premium advanced AI capabilities with deep instant intelligence answers.'}
                </p>
              </div>

              {/* Unlocked Sponsor Coupons */}
              {activeCoupons.length > 0 && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                   <h4 className="text-[9.5px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" /> {language === 'mr' ? '🎁 अनलॉक झालेली स्पॉन्सर कूपन्स' : '🎁 Unlocked Sponsor Coupons'}
                   </h4>
                   <div className="grid grid-cols-1 gap-2.5 font-sans">
                      {activeCoupons.map((coupon) => (
                         <div key={coupon.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center hover:bg-white/10 transition-colors">
                            <div className="text-left">
                               <span className="bg-orange-500/20 text-orange-300 font-extrabold text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                                  {coupon.sponsorName}
                               </span>
                               <p className="text-[10.5px] text-slate-300 font-semibold mt-1">{coupon.offerDetails}</p>
                            </div>
                            <button
                               onClick={() => {
                                  navigator.clipboard.writeText(coupon.code);
                                  alert(`Copied Code: ${coupon.code}`);
                               }}
                               className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1"
                            >
                               <Copy className="w-3 h-3" /> {coupon.code}
                            </button>
                         </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          ) : (
            /* FREE/SADHA UPGRADE INDUCEMENT DASHBOARD */
            <div className="p-6 space-y-5 text-left">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider">
                     🤖 {language === 'mr' ? 'साधा एआय व्हर्जन' : 'STANDARD SIMPLE VERSION'}
                  </span>
                </div>
                <span className="text-[#4F46E5] text-[9.5px] font-bold uppercase tracking-wider">
                   {language === 'mr' ? 'प्रो मध्ये जाण्यासाठी २ सोपे पर्याय' : '2 Simple Options to Go Pro'}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tighter uppercase text-slate-900 leading-tight">
                   {language === 'mr' ? 'एआय प्रो व्हर्जन अनलॉक करा' : 'Unlock Pro AI Chat Version'}
                </h3>
                <p className="text-gray-500 text-[10.5px] font-semibold leading-relaxed">
                   {language === 'mr' 
                     ? '१०० रुपये भरा किंवा २५ मित्रांना ॲप रेफर करा आणि मिळवा १ वर्ष मोफत प्रो ॲक्सेस व फ्री ब्रँड गिफ्ट कूपन्स!' 
                     : 'Pay ₹100 or refer 25 friends to get 1 year of global information access free and free brand sponsor coupons.'}
                </p>
              </div>

              {/* Progress Referral Counter */}
              <div className="bg-[#FAF9F6] border border-[#F2ECE4] rounded-2xl p-4 space-y-3.5 font-sans">
                 <div className="flex justify-between items-center text-[10.5px] font-extrabold text-slate-700 uppercase">
                    <span>{language === 'mr' ? 'रेफरल प्रगती' : 'Referral Progress'}</span>
                    <span className="text-indigo-600 font-mono font-black">{refereeCount} / 25 {language === 'mr' ? 'प्रत्यक्ष डाऊनलोड' : 'Downloads'}</span>
                 </div>
                 
                 {/* Progress bar */}
                 <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                       className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                       style={{ width: `${Math.min((refereeCount / 25) * 100, 100)}%` }}
                    />
                 </div>

                 <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-1">
                    <div className="text-[10px] text-gray-500 font-semibold leading-normal">
                       {language === 'mr' 
                         ? 'तुमच्या मित्रांनी इन्स्टॉल केल्यावर ते येथे वाढेल.' 
                         : 'Share your code. Count increases as friends register.'}
                    </div>
                    
                    <button
                       onClick={copyReferralLink}
                       className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${copiedCode ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    >
                       {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                       {copiedCode 
                         ? (language === 'mr' ? 'लिंक कॉपी झाली!' : 'Copied!') 
                         : (language === 'mr' ? 'रेफरल लिंक पाठवा' : 'Invites Link')}
                    </button>
                 </div>
              </div>

              {/* Alternative Buy/Pay button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                 <button
                    onClick={() => setIsPayModalOpen(true)}
                    className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md w-full"
                 >
                    <Coins className="w-4 h-4 text-amber-400" /> {language === 'mr' ? '₹१०० देऊन थेट प्रो व्हा' : 'Pay ₹100 direct Go Pro'}
                 </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
           <button 
             onClick={() => navigate('/settings')}
             className="bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-colors"
           >
             {t('edit_profile')}
           </button>
           <button 
             onClick={handleLogout}
             className="bg-white text-red-600 border border-red-100 py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
           >
             <LogOut className="w-4 h-4" />
             {t('logout')}
           </button>
        </div>

        {/* Manage App Section (Always Visible for Admins) */}
        {isAdmin && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Manage App</h3>
              </div>
              <button 
                onClick={() => navigate('/owner-portal')}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                Open Owner Portal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-gray-100 px-6">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'posts' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          {t('gallery')}
          {activeTab === 'posts' && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'services' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          {t('ai_tooling')}
          {activeTab === 'services' && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button 
          onClick={() => navigate('/pulse')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-blue-600 transition-colors`}
        >
          {t('nav_pulse')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' ? (
            <motion.div 
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-50 rounded-3xl animate-pulse" />)}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4 pb-12">
                   {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              ) : (
                <div className="py-20 text-center">
                   <Grid className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No posts yet</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pb-12"
            >
              {/* No more Admin section here, it is moved up */}
              <div 
                onClick={() => navigate('/health')}
                className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-emerald-100 transition-all"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                       <Activity className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-gray-900 leading-none">{t('diagnostic_insights')}</h4>
                       <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">Healthy Living Tips</p>
                    </div>
                 </div>
                 <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                 </div>
              </div>

              <div 
                onClick={() => navigate('/ai-chat')}
                className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-purple-100 transition-all"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                       <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-gray-900 leading-none">{t('ai_intelligence')}</h4>
                       <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">AI Assistant & Guide</p>
                    </div>
                 </div>
                 <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:text-purple-500 group-hover:bg-purple-50 transition-all">
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* UPI Payment Upgrade Modal (₹100) */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl border border-gray-100 transform scale-100 transition-all text-gray-900">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-full mb-4">
                 <Coins className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0C0A09] leading-tight uppercase font-sans">
                 {language === 'mr' ? 'थेट प्रो अनलॉक करा (UPI पेमेंट)' : 'Unlock Instant Pro AI'}
              </h3>
              <p className="mt-2 text-xs text-gray-500 font-semibold leading-relaxed">
                 {language === 'mr' 
                   ? 'पुढील १ वर्षासाठी प्रो मॉडेल अनलॉक करण्यासाठी खालील युपीआय आयडी वर ₹१०० पाठवा आणि पेमेंट ट्रान्झॅक्शन आयडी खाली प्रविष्ट करा.' 
                   : 'Send ₹100 to the UPI address below and enter the Transaction / Ref Number to activate your 1-Year Pro access.'}
              </p>

              {/* UPI and QR reference */}
              <div className="mt-5 w-full bg-slate-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400">Owner UPI ID</span>
                    <span className="font-mono font-black text-slate-800">8600869341@upi</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400">Amount</span>
                    <span className="font-extrabold text-indigo-600">₹100.00 ONLY</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400">Account Name</span>
                    <span className="font-black text-slate-700 font-sans">Aryan Gadewar</span>
                 </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleClaimPaidPremium} className="mt-5 w-full space-y-4">
                 <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">UPI Ref / TxID No. (UTR)</label>
                    <input 
                       type="text"
                       required
                       value={paymentTxIdInput}
                       onChange={(e) => setPaymentTxIdInput(e.target.value)}
                       placeholder="उदा. 416598235487"
                       className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/35 focus:outline-none text-gray-900"
                    />
                 </div>

                 <div className="flex gap-2 w-full pt-1">
                    <button
                       type="button"
                       onClick={() => {
                          setIsPayModalOpen(false);
                          setPaymentTxIdInput('');
                       }}
                       className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                    >
                       {language === 'mr' ? 'रद्द' : 'Cancel'}
                    </button>
                    <button
                       type="submit"
                       disabled={isVerifyingPayment}
                       className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-indigo-150"
                    >
                       {isVerifyingPayment ? (language === 'mr' ? 'तपासत आहे...' : 'Verifying...') : (language === 'mr' ? 'सक्रिय करा' : 'Activate Pro')}
                    </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
