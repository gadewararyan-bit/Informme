import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, limit, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { User, Post, Deal } from '../types';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  CheckCircle, 
  ArrowLeft, 
  Trash2, 
  ShieldCheck, 
  Database, 
  LayoutDashboard, 
  TrendingUp, 
  Filter, 
  Percent, 
  CreditCard, 
  Save, 
  Phone,
  Coins,
  MapPin,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ADMIN_EMAILS, INDIAN_STATES, STATE_FEATURE_TEMPLATES, STATE_MILESTONE_LEVELS } from '../constants';

export default function OwnerPortal() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = !!user?.isAdmin || 
                  (user?.email ? ADMIN_EMAILS.includes(user.email.trim().toLowerCase()) : false) || 
                  (user?.displayName ? user.displayName.toLowerCase().trim() === 'aryan gadewar' : false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [reportedPosts, setReportedPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'content' | 'royalties' | 'freePartners' | 'coupons' | 'stateMilestones'>('overview');

  const [partnerProofs, setPartnerProofs] = useState<any[]>([]);

  // Sponsor Coupons States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponOffer, setNewCouponOffer] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'sponsored_coupons'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setCoupons(list);
    }, (err) => {
      console.error("Failed to fetch coupons:", err);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorName.trim() || !newCouponCode.trim() || !newCouponOffer.trim()) {
      triggerAlert("त्रुटी (Error)", "सर्व रकाने भरणे आवश्यक आहे.");
      return;
    }
    try {
      await addDoc(collection(db, 'sponsored_coupons'), {
        sponsorName: newSponsorName.trim(),
        code: newCouponCode.trim().toUpperCase(),
        offerDetails: newCouponOffer.trim(),
        active: true,
        createdAt: serverTimestamp()
      });
      setNewSponsorName('');
      setNewCouponCode('');
      setNewCouponOffer('');
      triggerAlert("यशस्वी (Success)", "स्पॉन्सर कूपन यशस्वीरित्या जोडले गेले आहे!");
    } catch (err: any) {
      console.error("Failed to add coupon:", err);
      triggerAlert("त्रुटी (Error)", "कूपन जोडण्यात अडचण आली: " + err.message);
    }
  };

  const handleDeleteCoupon = (couponId: string) => {
    triggerConfirm(
      "कूपन काढून टाकावे?",
      "तुम्ही हे स्पॉन्सर कूपन कायमचे काढून टाकण्यास निश्चित आहात का?",
      async () => {
        try {
          await deleteDoc(doc(db, 'sponsored_coupons', couponId));
          triggerAlert("यशस्वी (Success)", "कूपन यशस्वीरित्या काढले गेले.");
        } catch (err: any) {
          console.error("Delete coupon error:", err);
          triggerAlert("त्रुटी (Error)", "कूपन काढण्यात अयशस्वी: " + err.message);
        }
      },
      true,
      "होय, काढा (Delete)",
      "रद्द करा (Cancel)"
    );
  };
  const [emergencyAlarmEnabled, setEmergencyAlarmEnabled] = useState(() => {
    return localStorage.getItem('emergency_alarm_enabled') !== 'false';
  });

  // Dynamic Query Limits for High Volume scaling
  const [dealsLimitValue, setDealsLimitValue] = useState<number>(300);
  const [postsLimitValue, setPostsLimitValue] = useState<number>(150);

  // Scalable Moderation System: Searching, Filtering, and Bulk actions
  const [dealSearchQuery, setDealSearchQuery] = useState<string>('');
  const [postSearchQuery, setPostSearchQuery] = useState<string>('');
  const [dealFilterType, setDealFilterType] = useState<'all' | 'pending' | 'approved' | 'paid' | 'free'>('all');
  const [postFilterType, setPostFilterType] = useState<'all' | 'reported' | 'sponsored' | 'normal' | 'flagged' | 'sponsored-pending' | 'sponsored-verified'>('all');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // Aryan's Payment Configuration States
  const [upiId, setUpiId] = useState(() => localStorage.getItem('owner_upi_id') || '8600869341@upi');
  const [phone, setPhone] = useState(() => localStorage.getItem('owner_phone') || '+918600869341');
  const [isSubscriptionPaid, setIsSubscriptionPaid] = useState<boolean>(false);
  const [basicPlanPrice, setBasicPlanPrice] = useState<number>(9);
  const [proPlanPrice, setProPlanPrice] = useState<number>(19);
  const [enterprisePlanPrice, setEnterprisePlanPrice] = useState<number>(49);
  const [dealPostPrice, setDealPostPrice] = useState<number>(99);
  const [sponsorPinPrice, setSponsorPinPrice] = useState<number>(99);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    alertOnly?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [configStateCode, setConfigStateCode] = useState<string>('MH');
  const [levelMappings, setLevelMappings] = useState<{[key: string]: string}>({});
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  // Load State Milestone Configuration
  useEffect(() => {
    if (!isAdmin || !configStateCode) return;
    const docRef = doc(db, 'state_milestone_configs', configStateCode);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLevelMappings(data.mappings || {});
      } else {
        // Set default mappings if none exist
        setLevelMappings({
          level1: 'old_is_gold',
          level2: 'weather_pest',
          level3: 'traditional_medicine',
          level4: 'legal_aid',
          level5: 'property_marketplace',
          level6: 'lost_found',
          level7: 'youth_sports',
          level8: 'gram_polls'
        });
      }
    }, (err) => {
      console.error("Error loading milestone config:", err);
    });
    return () => unsubscribe();
  }, [configStateCode, isAdmin]);

  const handleSaveStateConfig = async () => {
    if (!configStateCode) return;
    setSavingConfig(true);
    try {
      const docRef = doc(db, 'state_milestone_configs', configStateCode);
      const mappingsUpdate = { ...levelMappings };
      
      // Ensure we fill any missing levels with fallback values
      const fallbacks = ['old_is_gold', 'weather_pest', 'traditional_medicine', 'legal_aid', 'property_marketplace', 'lost_found', 'youth_sports', 'gram_polls'];
      for (let i = 1; i <= 8; i++) {
        if (!mappingsUpdate[`level${i}`]) {
          mappingsUpdate[`level${i}`] = fallbacks[i - 1] || 'old_is_gold';
        }
      }

      await updateDoc(docRef, {
        state: configStateCode,
        mappings: mappingsUpdate,
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        // If it doesn't exist, create it (setDoc behavior with merge: true)
        const { setDoc } = await import('firebase/firestore');
        await setDoc(docRef, {
          state: configStateCode,
          mappings: mappingsUpdate,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
      triggerAlert("यशस्वी (Success)", "या राज्यासाठीच्या ८ पायऱ्यांचे फीचर्स यशस्वीरीत्या सेव्ह केले आहेत!");
    } catch (err: any) {
      console.error("Error saving state config:", err);
      triggerAlert("त्रुटी (Error)", "बदल सेव्ह करताना अडचण आली: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDestructive = true,
    confirmText = 'होय, काढा (Yes, Delete)',
    cancelText = 'रद्द करा (Cancel)'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDestructive,
      confirmText,
      cancelText,
      alertOnly: false
    });
  };

  const triggerAlert = (title: string, message: string) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {},
      isDestructive: false,
      confirmText: 'ठीक आहे (OK)',
      cancelText: '',
      alertOnly: true
    });
  };

  const toggleEmergencyAlarm = async (newValue: boolean) => {
    setEmergencyAlarmEnabled(newValue);
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'system_config', 'owner_details'), {
        emergencyAlarmEnabled: newValue,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      localStorage.setItem('emergency_alarm_enabled', String(newValue));
    } catch (err: any) {
      console.error("Error setting safety toggle:", err);
      localStorage.setItem('emergency_alarm_enabled', String(newValue));
    }
  };

  const savePayoutConfig = async () => {
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'system_config', 'owner_details'), {
        upiId: upiId.trim(),
        phone: phone.trim(),
        emergencyAlarmEnabled: !!emergencyAlarmEnabled,
        isSubscriptionPaid: !!isSubscriptionPaid,
        basicPlanPrice: Number(basicPlanPrice) || 0,
        proPlanPrice: Number(proPlanPrice) || 0,
        enterprisePlanPrice: Number(enterprisePlanPrice) || 0,
        dealPostPrice: Number(dealPostPrice) || 0,
        sponsorPinPrice: Number(sponsorPinPrice) || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      localStorage.setItem('owner_upi_id', upiId.trim());
      localStorage.setItem('owner_phone', phone.trim());
      localStorage.setItem('emergency_alarm_enabled', String(emergencyAlarmEnabled));
      alert("System pricing & owner configurations successfully saved globally!");
    } catch (err: any) {
      console.error("Error saving global config:", err);
      // Fallback to local storage if database permission / rules are pending
      localStorage.setItem('owner_upi_id', upiId.trim());
      localStorage.setItem('owner_phone', phone.trim());
      alert("Saved locally! (Database sync skipped: " + err.message + ")");
    }
  };

  // Metrics
  const totalUsers = users.length;
  const totalPosts = users.reduce((acc, curr) => acc + (curr.postCount || 0), 0);
  const estimatedRevenue = totalPosts * 0.5 + totalUsers * 0.5;

  // Calculate 2% Royalty sum from signed deals
  const totalRoyaltyDue = deals.reduce((acc, deal) => {
    if (deal.hasSignedProfitAgreement) {
      const units = deal.expectedUnitsPerMonth || 0;
      const profitPerUnit = deal.expectedProfitPerUnit || 0;
      const dealProfit = units * profitPerUnit;
      return acc + (dealProfit * 0.02);
    }
    return acc;
  }, 0);

  useEffect(() => {
    if (!isAdmin) return;

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    });

    const qReports = query(collection(db, 'posts'), where('reports', '!=', []));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReportedPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    const qAllPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(postsLimitValue));
    const unsubAllPosts = onSnapshot(qAllPosts, (snapshot) => {
      setAllPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    const qDeals = query(collection(db, 'deals'), orderBy('createdAt', 'desc'), limit(dealsLimitValue));
    const unsubDeals = onSnapshot(qDeals, (snapshot) => {
      setDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal)));
      setLoading(false);
    });

    const qProofs = query(collection(db, 'promotion_proofs'), orderBy('uploadedAt', 'desc'), limit(150));
    const unsubProofs = onSnapshot(qProofs, (snapshot) => {
      setPartnerProofs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubConfig = onSnapshot(doc(db, 'system_config', 'owner_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.upiId) setUpiId(data.upiId);
        if (data.phone) setPhone(data.phone);
        if (data.emergencyAlarmEnabled !== undefined) {
          setEmergencyAlarmEnabled(data.emergencyAlarmEnabled);
        }
        if (data.isSubscriptionPaid !== undefined) {
          setIsSubscriptionPaid(data.isSubscriptionPaid);
        }
        if (data.basicPlanPrice !== undefined) setBasicPlanPrice(Number(data.basicPlanPrice));
        if (data.proPlanPrice !== undefined) setProPlanPrice(Number(data.proPlanPrice));
        if (data.enterprisePlanPrice !== undefined) setEnterprisePlanPrice(Number(data.enterprisePlanPrice));
        if (data.dealPostPrice !== undefined) setDealPostPrice(Number(data.dealPostPrice));
        if (data.sponsorPinPrice !== undefined) setSponsorPinPrice(Number(data.sponsorPinPrice));
      }
    });

    return () => {
      unsubUsers();
      unsubReports();
      unsubAllPosts();
      unsubDeals();
      unsubProofs();
      unsubConfig();
    };
  }, [isAdmin, dealsLimitValue, postsLimitValue]);

  const handleDeletePost = async (postId: string) => {
    triggerConfirm(
      "पोस्ट डिलीट करायची का? (Delete Post?)",
      "तुम्ही ही पोस्ट सिस्टीममधून कायमची काढून टाकू इच्छिता का?",
      async () => {
        try {
          await deleteDoc(doc(db, 'posts', postId));
          triggerAlert("यशस्वी (Success)", "पोस्ट यशस्वीरित्या डिलीट केली गेली आहे.");
        } catch (err) {
          console.error("Delete post error:", err);
          triggerAlert("त्रुटी (Error)", "पोस्ट डिलीट करण्यात अडचण आली.");
        }
      }
    );
  };

  const handleDeleteDeal = async (dealId: string) => {
    triggerConfirm(
      "ऑफर डिलीट करायची का? (Delete Offer/Deal?)",
      "तुम्ही ही ऑफर सिस्टीममधून कायमची काढून टाकू इच्छिता का? ही क्रिया बदलता येणार नाही.",
      async () => {
        try {
          await deleteDoc(doc(db, 'deals', dealId));
          triggerAlert("यशस्वी (Success)", "ऑफर यशस्वीरित्या डिलीट केली गेली आहे.");
        } catch (err) {
          console.error("Delete deal error:", err);
          triggerAlert("त्रुटी (Error)", "ऑफर डिलीट करताना अडचण आली.");
        }
      }
    );
  };

  const handleUpdatePayoutStatus = async (dealId: string, status: 'pending' | 'partially_paid' | 'fully_paid', verifiedAmount: number) => {
    try {
      await updateDoc(doc(db, 'deals', dealId), {
        payoutStatus: status,
        adminVerifiedAmount: verifiedAmount
      });
    } catch (err) {
      console.error("Error updating payout status:", err);
      triggerAlert("त्रुटी (Error)", "Unable to write settlement status block to Firestore.");
    }
  };

  const handleToggleDealApproval = async (dealId: string, currentApproved: boolean) => {
    try {
      await updateDoc(doc(db, 'deals', dealId), {
        isApproved: !currentApproved
      });
    } catch (err) {
      console.error("Error toggling deal approval:", err);
      triggerAlert("त्रुटी (Error)", "Failed to update deal status.");
    }
  };

  const handleToggleDealPin = async (dealId: string, currentPinned: boolean) => {
    try {
      await updateDoc(doc(db, 'deals', dealId), {
        isPinned: !currentPinned
      });
    } catch (err) {
      console.error("Error toggling deal pin:", err);
      triggerAlert("त्रुटी (Error)", "Failed to update deal pinned status.");
    }
  };

  const handleTogglePostSponsorStatus = async (postId: string, currentStatus: string | null) => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        paymentStatus: currentStatus === 'verified' ? 'pending' : 'verified'
      });
    } catch (err) {
      console.error("Error toggling sponsor status:", err);
      triggerAlert("त्रुटी (Error)", "Failed to update sponsor status.");
    }
  };

  // --- High Volume Bulk Processing System ---
  const handleBulkApproveDeals = async (ids: string[], approve: boolean) => {
    if (ids.length === 0) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, 'deals', id), { isApproved: approve });
      });
      await batch.commit();
      setSelectedDeals([]);
      triggerAlert("यशस्वी (Success)", `Updated approved status to ${approve ? "Active" : "Inactive"} for ${ids.length} listing(s).`);
    } catch (err) {
      console.error("Bulk approve error:", err);
      triggerAlert("त्रुटी (Error)", "Unable to process batch updates on firestore.");
    }
  };

  const handleBulkPinDeals = async (ids: string[], pin: boolean) => {
    if (ids.length === 0) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, 'deals', id), { isPinned: pin });
      });
      await batch.commit();
      setSelectedDeals([]);
      triggerAlert("यशस्वी (Success)", `Updated pinned/promoted feature state for ${ids.length} listing(s).`);
    } catch (err) {
      console.error("Bulk pin error:", err);
      triggerAlert("त्रुटी (Error)", "Failed to pin deals in batch.");
    }
  };

  const handleBulkDeleteDeals = async (ids: string[]) => {
    if (ids.length === 0) return;
    triggerConfirm(
      "निवडलेल्या जाहिराती डिलीट करायच्या का? (Delete Selected?)",
      `तुम्ही निवडलेले सर्व ${ids.length} कॅंपेन लिस्टिंग्ज कायमचे डिलीट करू इच्छिता का? ही क्रिया बदलता येणार नाही!`,
      async () => {
        try {
          const batch = writeBatch(db);
          ids.forEach(id => {
            batch.delete(doc(db, 'deals', id));
          });
          await batch.commit();
          setSelectedDeals([]);
          triggerAlert("यशस्वी (Success)", `${ids.length} कॅंपेन लिस्टिंग्ज यशस्वीरित्या डिलीट केल्या गेल्या आहेत.`);
        } catch (err) {
          console.error("Bulk delete deals error:", err);
          triggerAlert("त्रुटी (Error)", "निवडलेले रेकॉर्ड्स काढण्यात अपयश आले.");
        }
      }
    );
  };

  const handleAutoApprovePaidDeals = async () => {
    const qualified = deals.filter(
      d => !d.isApproved && d.paymentTxId && d.paymentTxId.trim() !== '' && d.paymentTxId !== 'FREE_PROMOTION_PARTNER'
    );
    if (qualified.length === 0) {
      triggerAlert("माहीती (Info)", "कोणतेही प्रलंबित व्यवहार आढळले नाहीत ज्यांच्याकडे पूर्ण पेमेंट रेफरन्स आहे.");
      return;
    }
    triggerConfirm(
      "बाकी व्यवहार मंजूर करायचे का? (Approve Paid?)",
      `सर्व ${qualified.length} प्रलंबित कॅंपेन व्यवहार ज्यांच्याकडे पेमेंट आयडी आहे ते थेट मंजूर करायचे का?`,
      async () => {
        await handleBulkApproveDeals(qualified.map(d => d.id), true);
      },
      false,
      "होय, मंजूर करा (Yes, Approve)",
      "रद्द करा (Cancel)"
    );
  };

  const handleBulkDeletePosts = async (ids: string[]) => {
    if (ids.length === 0) return;
    triggerConfirm(
      "निवडलेले पोस्ट डिलीट करायचे का? (Delete Selected?)",
      `तुम्ही निवडलेले सर्व ${ids.length} कम्युनिटी पोस्ट कायमचे नष्ट करू इच्छिता का?`,
      async () => {
        try {
          const batch = writeBatch(db);
          ids.forEach(id => {
            batch.delete(doc(db, 'posts', id));
          });
          await batch.commit();
          setSelectedPosts([]);
          triggerAlert("यशस्वी (Success)", `${ids.length} पोस्ट यशस्वीरित्या डिलीट केल्या गेल्या आहेत.`);
        } catch (err) {
          console.error("Bulk delete posts error:", err);
          triggerAlert("त्रुटी (Error)", "पोस्ट डिलीट करण्यात अपयश आले.");
        }
      }
    );
  };

  const handleBulkVerifySponsorPosts = async (ids: string[], verify: boolean) => {
    if (ids.length === 0) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, 'posts', id), { paymentStatus: verify ? 'verified' : 'pending' });
      });
      await batch.commit();
      setSelectedPosts([]);
      alert(`Sponsor verification updated to ${verify ? "Verified" : "Pending"} for ${ids.length} post(s).`);
    } catch (err) {
      console.error("Bulk verify sponsor posts error:", err);
      alert("Unable to process high-volume sponsorship update.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 flex-col p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Unauthorized Terminal</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-xs">
          This secure node is reserved for platform owners only.
        </p>
        <button onClick={() => navigate('/')} className="mt-8 bg-black text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFEFE] pb-24">
      {/* Sidebar-style Nav for Desktop, Top for mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">System Root Active</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-gray-900 uppercase">Owner Portal</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate('/')}
               className="px-6 py-3 bg-white rounded-2xl border border-gray-100 pro-shadow text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all"
             >
               <ArrowLeft className="w-3 h-3" /> User Mode
             </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
           {[
             { label: 'Total Nodes', val: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Network Output', val: totalPosts, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
             { label: 'Active Deals', val: deals.length, icon: Coins, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Partner Royalties (2%)', val: `₹${totalRoyaltyDue.toLocaleString(undefined, {maximumFractionDigits:0})}`, icon: Percent, color: 'text-orange-600', bg: 'bg-orange-50' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100">
               <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                 <stat.icon className="w-5 h-5" />
               </div>
               <p className="text-2xl font-black tracking-tighter text-gray-900">{stat.val}</p>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
             </div>
           ))}
        </div>

        {/* Local Navigation */}
        <div className="flex flex-wrap gap-2 mb-10 bg-gray-100/50 p-1.5 rounded-3xl w-fit">
           {[
             { id: 'overview', label: 'Overview', icon: LayoutDashboard },
             { id: 'users', label: 'User Management', icon: Users },
             { id: 'stateMilestones', label: 'State Milestones 📍', icon: MapPin },
             { id: 'royalties', label: 'Partner Royalties', icon: Coins },
             { id: 'freePartners', label: 'Free Shop Promos 🤝', icon: Percent },
             { id: 'coupons', label: 'Sponsor Coupons 🏷️', icon: Gift },
             { id: 'content', label: 'Posts', icon: Database },
             { id: 'moderation', label: 'Safety', icon: ShieldAlert }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab.id ? 'bg-white text-blue-600 pro-shadow' : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               <tab.icon className="w-3.5 h-3.5" />
               {tab.label}
             </button>
           ))}
        </div>

        <main className="space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gray-900 p-10 rounded-[48px] text-white overflow-hidden relative">
                    <div className="relative z-10">
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Platform Economy</h3>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-10 text-white/40">Current Fiscal Projection</p>
                      
                      <div className="space-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Gross Ad Revenue</span>
                           <span className="text-2xl font-black">₹{estimatedRevenue.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Projected Net Profit</span>
                           <span className="text-3xl font-black text-emerald-400">₹{estimatedRevenue.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                    <Activity className="absolute -bottom-10 -right-10 w-64 h-64 text-white/[0.03] rotate-12" />
                  </div>

                  <div className="bg-white p-10 rounded-[48px] pro-shadow border border-gray-100">
                     <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Node Growth (Last 5)</h3>
                     <div className="space-y-2">
                       {users.slice(0, 5).map(u => (
                         <div key={u.uid} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                           <div className="flex items-center gap-4">
                             <img src={u.photoURL || ''} className="w-10 h-10 rounded-xl pro-shadow" alt="" />
                             <div>
                               <p className="text-sm font-bold text-gray-900">{u.displayName}</p>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-black text-indigo-600">{u.postCount || 0} P</p>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>
               </div>

               {/* Global Pricing & Subscription Plan Control */}
               <div className="bg-[#FAF9F6] p-8 rounded-[40px] border border-amber-300 shadow-lg shadow-amber-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                     <Coins className="w-6 h-6 text-amber-600 animate-bounce" />
                     <h3 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900">💰 Plan & Promotion Pricing Control Panel</h3>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest leading-relaxed mb-6 max-w-3xl">
                     Switch between 100% free trial mode versus premium paid gates, and customize precise prices for basic, pro, enterprise subscriptions (USD) and local promo listings (INR).
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                     {/* Subscription Mode Status & Toggle */}
                     <div className="space-y-4 p-6 bg-white rounded-3xl border border-amber-200 shadow-sm flex flex-col justify-between">
                        <div className="space-y-2">
                           <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Pricing Strategy / धोरण</span>
                           <h4 className="text-lg font-black uppercase tracking-tight text-gray-900">Subscription Gates</h4>
                           <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                              Run the network for free to get initial traction and lock Premium AI gates on/off with ease.
                           </p>
                        </div>
                        
                        <div className="space-y-3 mt-4">
                           <div className="flex items-center justify-between bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                              <div>
                                 <p className="text-[10px] font-black uppercase text-gray-900 leading-none mb-1">Fee Model</p>
                                 <p className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded inline-block ${isSubscriptionPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {isSubscriptionPaid ? '🔒 PAID ACTIVE' : '🎁 TRIAL ACTIVE'}
                                 </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsSubscriptionPaid(!isSubscriptionPaid)}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                                  isSubscriptionPaid 
                                    ? 'bg-amber-400 text-black hover:bg-amber-500 shadow-md hover:scale-105' 
                                    : 'bg-emerald-505 text-white hover:bg-emerald-600 shadow-md hover:scale-105'
                                }`}
                              >
                                {isSubscriptionPaid ? 'Set to FREE' : 'Set to PAID'}
                              </button>
                           </div>
                        </div>
                     </div>

                     {/* Plan Pricing Inputs */}
                     <div className="space-y-4 p-6 bg-white rounded-3xl border border-gray-150 shadow-sm col-span-1 lg:col-span-2">
                        <span className="text-[9px] font-black uppercase text-gray-450 tracking-widest block">Configure Plan Prices (Adjust anytime)</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Basic Node Plan</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={basicPlanPrice}
                                   onChange={(e) => setBasicPlanPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-amber-500 outline-none"
                                 />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Pro Core Plan</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={proPlanPrice}
                                   onChange={(e) => setProPlanPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-amber-500 outline-none"
                                 />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Enterprise Plan</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={enterprisePlanPrice}
                                   onChange={(e) => setEnterprisePlanPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-amber-500 outline-none"
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Standard Deal Post Fee (₹)</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={dealPostPrice}
                                   onChange={(e) => setDealPostPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-amber-500 outline-none"
                                 />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Sponsored Pin / Ad Fee (₹)</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={sponsorPinPrice}
                                   onChange={(e) => setSponsorPinPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-amber-500 outline-none"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-amber-200">
                     <button
                       type="button"
                       onClick={savePayoutConfig}
                       className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md hover:scale-105"
                     >
                        <Save className="w-3.5 h-3.5" /> Save Pricing & Configuration Update
                     </button>
                  </div>
               </div>

            {/* Unified Offers & Shop Campaigns Pinning Hub */}
               <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                     <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                        <div>
                           <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" /> 📌 Unified Offers & Deals Campaign Control Hub (सर्व ऑफर्स व जाहिराती)
                           </h3>
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">
                              Keep track of thousands of deals. Search, batch-approve, flag, or pin sponsored campaigns instantly.
                           </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                           <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-xl">
                              <span>Database Load limit:</span>
                              <select 
                                 value={dealsLimitValue} 
                                 onChange={(e) => {
                                    setDealsLimitValue(Number(e.target.value));
                                    setSelectedDeals([]);
                                 }}
                                 className="bg-transparent border-none outline-none font-black text-indigo-600 focus:ring-0 cursor-pointer"
                              >
                                 <option value="100">100 Nodes</option>
                                 <option value="300">300 Nodes</option>
                                 <option value="500">500 Nodes</option>
                                 <option value="1000">1000 Nodes</option>
                              </select>
                           </div>
                           <span className="bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-gray-500">
                              Fetched: {deals.length}
                           </span>
                        </div>
                     </div>

                     {/* Search and Filters Strip */}
                     <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-5 relative">
                           <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                           <input
                              type="text"
                              placeholder="🔍 दुकानदार, ऑफर, पत्ता किंवा UPI आयडीने शोधा..."
                              value={dealSearchQuery}
                              onChange={(e) => setDealSearchQuery(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none text-[#0D1B2A]"
                           />
                           {dealSearchQuery && (
                              <button 
                                 onClick={() => setDealSearchQuery('')}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black font-black text-xs"
                              >
                                 × Clear
                              </button>
                           )}
                        </div>

                        <div className="md:col-span-7 flex flex-wrap items-center gap-1.5">
                           {[
                              { label: 'All Deals (सर्व)', value: 'all' },
                              { label: 'Pending (बाकी)', value: 'pending' },
                              { label: 'Approved (सक्रिय)', value: 'approved' },
                              { label: 'Paid (पेमेंट)', value: 'paid' },
                              { label: 'Free (मोफत)', value: 'free' }
                           ].map(tab => (
                              <button
                                 key={tab.value}
                                 onClick={() => {
                                    setDealFilterType(tab.value as any);
                                    setSelectedDeals([]);
                                 }}
                                 className={`px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all ${
                                    dealFilterType === tab.value
                                       ? 'bg-indigo-600 text-white shadow-sm'
                                       : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
                                 }`}
                              >
                                 {tab.label}
                              </button>
                           ))}

                           <button
                              onClick={handleAutoApprovePaidDeals}
                              className="ml-auto px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-950 rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:scale-105 transition-all shadow-sm"
                           >
                              🪄 Auto-Approve Paid {deals.filter(d => !d.isApproved && d.paymentTxId && d.paymentTxId.trim() !== '' && d.paymentTxId !== 'FREE_PROMOTION_PARTNER').length} Deals
                           </button>
                        </div>
                     </div>

                     {/* Bulk Execution Toolbar */}
                     {selectedDeals.length > 0 && (
                        <div className="mt-4 p-4 bg-[#E0F2FE] border border-sky-200 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in text-[#0284C7]">
                           <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
                              </span>
                              <span className="text-xs font-black uppercase tracking-widest">
                                 Selected {selectedDeals.length} Deal Listings
                              </span>
                           </div>

                           <div className="flex flex-wrap items-center gap-2">
                              <button
                                 onClick={() => handleBulkApproveDeals(selectedDeals, true)}
                                 className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm"
                              >
                                 ✓ Bulk Approve (मंजूर करा)
                              </button>
                              <button
                                 onClick={() => handleBulkApproveDeals(selectedDeals, false)}
                                 className="px-3.5 py-2 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-orange-700 transition-all shadow-sm"
                              >
                                 🛑 Bulk Inactivate (बंद करा)
                              </button>
                              <button
                                 onClick={() => handleBulkPinDeals(selectedDeals, true)}
                                 className="px-3.5 py-2 bg-amber-50 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all shadow-sm"
                              >
                                 🔥 Bulk Pin Top (पिन करा)
                              </button>
                              <button
                                 onClick={() => handleBulkPinDeals(selectedDeals, false)}
                                 className="px-3.5 py-2 bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                              >
                                 ☆ Bulk Unpin (पिन काढा)
                              </button>
                              <button
                                 onClick={() => handleBulkDeleteDeals(selectedDeals)}
                                 className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-700 transition-all shadow-sm flex items-center gap-1"
                              >
                                 <Trash2 className="w-3 h-3" /> Bulk Delete (कायमचे काढा)
                              </button>
                              <button
                                 onClick={() => setSelectedDeals([])}
                                 className="text-[9.5px] font-semibold uppercase text-slate-400 hover:text-red-500 hover:underline px-2 transition-all"
                              >
                                 Cancel
                              </button>
                           </div>
                        </div>
                     )}
                  </div>

                  {(() => {
                     const filteredDeals = deals.filter(deal => {
                        const searchString = `${deal.businessName || ''} ${deal.title || ''} ${deal.offer || ''} ${deal.signerName || ''} ${deal.signerPhone || ''} ${deal.category || ''} ${deal.paymentTxId || ''} ${deal.location?.areaName || ''}`.toLowerCase();
                        if (dealSearchQuery.trim() !== '' && !searchString.includes(dealSearchQuery.toLowerCase())) {
                           return false;
                        }
                        if (dealFilterType === 'pending') return !deal.isApproved;
                        if (dealFilterType === 'approved') return !!deal.isApproved;
                        if (dealFilterType === 'paid') return !deal.isFreePromotion;
                        if (dealFilterType === 'free') return !!deal.isFreePromotion;
                        return true;
                     });

                     const isAllCheckedOnPage = filteredDeals.length > 0 && filteredDeals.every(d => selectedDeals.includes(d.id));
                     const handleSelectAllOnPage = () => {
                        if (isAllCheckedOnPage) {
                           const pageIds = filteredDeals.map(d => d.id);
                           setSelectedDeals(prev => prev.filter(id => !pageIds.includes(id)));
                        } else {
                           const pageIds = filteredDeals.map(d => d.id);
                           setSelectedDeals(prev => Array.from(new Set([...prev, ...pageIds])));
                        }
                     };

                     const handleSelectIndividual = (id: string) => {
                        setSelectedDeals(prev => 
                           prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                        );
                     };

                     if (filteredDeals.length === 0) {
                        return (
                           <div className="py-24 text-center">
                              <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-bounce" />
                              <h4 className="text-sm font-black uppercase text-gray-300 tracking-widest">No matching campaigns found</h4>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Configure search query or switch filters.</p>
                           </div>
                        );
                     }

                     return (
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 select-none">
                                 <tr>
                                    <th className="px-6 py-5 text-center w-12">
                                       <input 
                                          type="checkbox"
                                          checked={isAllCheckedOnPage}
                                          onChange={handleSelectAllOnPage}
                                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                       />
                                    </th>
                                    <th className="px-6 py-5">Merchant Store / Category</th>
                                    <th className="px-6 py-5 text-center">Offer Campaign</th>
                                    <th className="px-6 py-5 text-center">Featured Pin (Sponsor)</th>
                                    <th className="px-6 py-5 text-center">Approval State</th>
                                    <th className="px-6 py-5 text-center">Payment Verification</th>
                                    <th className="px-6 py-5">Contact Node</th>
                                    <th className="px-6 py-5 text-center">Actions</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-xs">
                                 {filteredDeals.map(deal => {
                                    const isRowSelected = selectedDeals.includes(deal.id);
                                    return (
                                       <tr 
                                          key={deal.id} 
                                          className={`hover:bg-gray-50/50 transition-all font-semibold ${
                                             isRowSelected ? 'bg-sky-50/40' : ''
                                          }`}
                                       >
                                          <td className="px-6 py-6 text-center select-none">
                                             <input 
                                                type="checkbox"
                                                checked={isRowSelected}
                                                onChange={() => handleSelectIndividual(deal.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                             />
                                          </td>
                                          <td className="px-6 py-6">
                                             <div>
                                                <p className="font-extrabold text-gray-900 text-sm">{deal.businessName}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                   <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase rounded">
                                                      {deal.category}
                                                   </span>
                                                   {deal.isFreePromotion ? (
                                                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded">🤝 Free Barter Partner</span>
                                                   ) : (
                                                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[8px] font-black uppercase rounded">💳 Paid Campaign</span>
                                                   )}
                                                </div>
                                                <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Area: {deal.location?.areaName}</p>
                                             </div>
                                          </td>
                                          <td className="px-6 py-6 text-center">
                                             <div>
                                                <p className="font-extrabold text-gray-900 text-sm">{deal.title}</p>
                                                <p className="text-orange-600 font-extrabold mt-0.5 bg-orange-50 px-2.5 py-0.5 rounded-full inline-block text-[10px]">{deal.offer}</p>
                                             </div>
                                          </td>
                                          <td className="px-6 py-6 text-center">
                                             <button
                                                onClick={() => handleToggleDealPin(deal.id, !!deal.isPinned)}
                                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 mx-auto ${
                                                   deal.isPinned
                                                      ? 'bg-amber-400 text-gray-950 hover:bg-amber-500 hover:scale-105 shadow-md shadow-amber-200'
                                                      : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-800'
                                                }`}
                                             >
                                                <Sparkles className={`w-3.5 h-3.5 ${deal.isPinned ? 'text-amber-950 fill-amber-950 animate-bounce' : ''}`} />
                                                {deal.isPinned ? '🔥 TOP FEATURED' : '☆ PIN TOP'}
                                             </button>
                                             {deal.isPinned && (
                                                <span className="text-[8px] text-amber-700 font-bold uppercase tracking-wider block mt-1">Sponsored ad active</span>
                                             )}
                                          </td>
                                          <td className="px-6 py-6 text-center">
                                             <button
                                                onClick={() => handleToggleDealApproval(deal.id, !!deal.isApproved)}
                                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                                                   deal.isApproved
                                                      ? 'bg-emerald-600 text-white hover:bg-red-600'
                                                      : 'bg-red-500 text-white hover:bg-emerald-600 hover:scale-105'
                                                }`}
                                             >
                                                {deal.isApproved ? '✓ ACTIVE LINE' : '🤝 APPROVE DEAL'}
                                             </button>
                                          </td>
                                          <td className="px-6 py-6 text-center">
                                             {deal.isFreePromotion ? (
                                                <div className="bg-emerald-50 px-3 py-1.5 rounded-xl inline-block">
                                                   <p className="text-[9px] font-black text-emerald-800 uppercase">Barter Agreement</p>
                                                   <p className="text-[8px] font-bold text-emerald-600 uppercase font-mono">REFERRAL PROMO</p>
                                                </div>
                                             ) : (
                                                <div className="space-y-1 inline-block text-left">
                                                   <p className="text-[10px] font-bold text-[#0D1B2A] font-mono select-all bg-gray-50 border border-gray-100 px-2 py-1 rounded max-w-[140px] truncate" title={deal.paymentTxId}>
                                                      TxID: {deal.paymentTxId || 'No Tx ID'}
                                                   </p>
                                                   <p className="text-[8px] font-bold text-gray-400 uppercase font-mono">Listing fee: ₹{dealPostPrice}</p>
                                                </div>
                                             )}
                                          </td>
                                          <td className="px-6 py-6">
                                             <div>
                                                <p className="font-mono text-[10px] uppercase text-gray-500 font-bold">Signer: {deal.signerName || 'Merchant'}</p>
                                                {deal.signerPhone && (
                                                   <a 
                                                      href={`https://wa.me/${deal.signerPhone.replace(/[^0-9]/g, '')}`}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                                                   >
                                                      <Phone className="w-3.5 h-3.5" /> Chat WA
                                                   </a>
                                                )}
                                             </div>
                                          </td>
                                          <td className="px-6 py-6 text-center">
                                             <button 
                                                onClick={() => handleDeleteDeal(deal.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl border border-transparent hover:border-red-100 mx-auto block cursor-pointer"
                                                title="Delete Campaign"
                                             >
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                          </td>
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                     );
                  })()}
               </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                     <tr>
                       <th className="px-8 py-6">User / Node</th>
                       <th className="px-8 py-6">Email Index</th>
                       <th className="px-8 py-6">Points</th>
                       <th className="px-8 py-6">Contributions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {users.map(u => (
                       <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <img src={u.photoURL || ''} className="w-10 h-10 rounded-xl" alt="" />
                             <div>
                               <p className="text-sm font-bold text-gray-900">{u.displayName}</p>
                               <p className="text-[10px] font-black text-gray-400 uppercase">{u.location?.areaName || 'Remote'}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-6 text-xs text-gray-500 font-medium">{u.email}</td>
                         <td className="px-8 py-6 font-bold text-indigo-600">{(u.engagementPoints || 0) + (u.points || 0)}</td>
                         <td className="px-8 py-6 font-bold text-emerald-600">{u.postCount || 0} Posts</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'content' && (
             <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                       <div>
                          <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                             <Database className="w-5 h-5 text-indigo-500 animate-pulse" /> 📁 Scalable Post & Community Content Moderation Control Hub (सर्व पोस्ट्स व मजकूर)
                          </h3>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">
                             Filter, query, and bulk purge or bulk verify sponsorship stakes across the entire local community database.
                          </p>
                       </div>
                       <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-xl">
                             <span>Fetch Limit (लोड मर्यादा):</span>
                             <select 
                                value={postsLimitValue} 
                                onChange={(e) => {
                                   setPostsLimitValue(Number(e.target.value));
                                   setSelectedPosts([]);
                                }}
                                className="bg-transparent border-none outline-none font-black text-indigo-600 focus:ring-0 cursor-pointer"
                             >
                                <option value="100">100 Posts</option>
                                <option value="300">300 Posts</option>
                                <option value="500">500 Posts</option>
                                <option value="1000">1000 Posts</option>
                             </select>
                          </div>
                          <span className="bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-gray-500">
                             Live Fetched: {allPosts.length}
                          </span>
                       </div>
                    </div>

                    {/* Filter and Search Strip */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                       <div className="md:col-span-5 relative">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                             type="text"
                             placeholder="🔍 पोस्टचा मजकूर किंवा लेखकाच्या नावाने झटपट शोधा..."
                             value={postSearchQuery}
                             onChange={(e) => setPostSearchQuery(e.target.value)}
                             className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none text-[#0D1B2A]"
                          />
                          {postSearchQuery && (
                             <button 
                                onClick={() => setPostSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black font-black text-xs"
                             >
                                × Clear
                             </button>
                          )}
                       </div>

                       <div className="md:col-span-7 flex flex-wrap items-center gap-1.5">
                          {[
                             { label: 'All (सर्व)', value: 'all' },
                             { label: 'Reported (तक्रारी)', value: 'flagged' },
                             { label: 'Sponsored Ads (प्रायोजित)', value: 'sponsored' },
                             { label: 'Unverified Ads (बाकी पेमेंट)', value: 'sponsored-pending' },
                             { label: 'Verified Ads (मंजूर पेमेंट)', value: 'sponsored-verified' }
                          ].map(tab => (
                             <button
                                key={tab.value}
                                onClick={() => {
                                   setPostFilterType(tab.value as any);
                                   setSelectedPosts([]);
                                }}
                                className={`px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all ${
                                   postFilterType === tab.value
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
                                }`}
                             >
                                {tab.label}
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Bulk Action Strip */}
                    {selectedPosts.length > 0 && (
                       <div className="mt-4 p-4 bg-[#FEE2E2] border border-red-200 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in text-red-700">
                          <div className="flex items-center gap-2">
                             <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                             </span>
                             <span className="text-xs font-black uppercase tracking-widest">
                                Selected {selectedPosts.length} Community Posts
                             </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                             <button
                                onClick={() => handleBulkVerifySponsorPosts(selectedPosts, true)}
                                className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm"
                             >
                                ✓ Bulk Verify Payments (पेमेंट मंजूर करा)
                             </button>
                             <button
                                onClick={() => handleBulkVerifySponsorPosts(selectedPosts, false)}
                                className="px-3.5 py-2 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-orange-700 transition-all shadow-sm"
                             >
                                🛑 Revoke Sponsor status (पेड रद्द करा)
                             </button>
                             <button
                                onClick={() => handleBulkDeletePosts(selectedPosts)}
                                className="px-3.5 py-2 bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-800 transition-all shadow-sm flex items-center gap-1"
                             >
                                <Trash2 className="w-3 h-3" /> Bulk Delete Posts (कायमचे डिलीट करा)
                             </button>
                             <button
                                onClick={() => setSelectedPosts([])}
                                className="text-[9.5px] font-semibold uppercase text-slate-400 hover:text-red-500 hover:underline px-2 transition-all"
                             >
                                Cancel
                             </button>
                          </div>
                       </div>
                    )}
                </div>

                {(() => {
                   const filteredPosts = allPosts.filter(post => {
                      // 1. Search Query
                      const searchString = `${post.authorName || ''} ${post.content || ''} ${post.paymentTxId || ''}`.toLowerCase();
                      if (postSearchQuery.trim() !== '' && !searchString.includes(postSearchQuery.toLowerCase())) {
                         return false;
                      }

                      // 2. Filters
                      if (postFilterType === 'flagged') return post.reports && post.reports.length > 0;
                      if (postFilterType === 'sponsored') return !!post.isSponsored;
                      if (postFilterType === 'sponsored-pending') return !!post.isSponsored && post.paymentStatus !== 'verified';
                      if (postFilterType === 'sponsored-verified') return !!post.isSponsored && post.paymentStatus === 'verified';

                      return true;
                   });

                   const isAllCheckedOnPage = filteredPosts.length > 0 && filteredPosts.every(p => selectedPosts.includes(p.id));
                   const handleSelectAllOnPage = () => {
                      if (isAllCheckedOnPage) {
                         const pageIds = filteredPosts.map(p => p.id);
                         setSelectedPosts(prev => prev.filter(id => !pageIds.includes(id)));
                      } else {
                         const pageIds = filteredPosts.map(p => p.id);
                         setSelectedPosts(prev => Array.from(new Set([...prev, ...pageIds])));
                      }
                   };

                   const handleSelectIndividual = (id: string) => {
                      setSelectedPosts(prev => 
                         prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                      );
                   };

                   if (filteredPosts.length === 0) {
                      return (
                         <div className="py-24 text-center">
                            <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-bounce" />
                            <h4 className="text-sm font-black uppercase text-gray-300 tracking-widest">No matching posts found</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Refine your search or filter criteria.</p>
                         </div>
                      );
                   }

                   return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 select-none">
                            <tr>
                              <th className="px-6 py-5 text-center w-12">
                                 <input 
                                    type="checkbox"
                                    checked={isAllCheckedOnPage}
                                    onChange={handleSelectAllOnPage}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                 />
                              </th>
                              <th className="px-6 py-5">Author</th>
                              <th className="px-6 py-5">Content Preview</th>
                              <th className="px-6 py-5 text-center">Metrics</th>
                              <th className="px-6 py-5 text-center">Status Flags</th>
                              <th className="px-6 py-5 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs">
                            {filteredPosts.map(post => {
                              const isRowSelected = selectedPosts.includes(post.id);
                              return (
                                <tr 
                                   key={post.id} 
                                   className={`hover:bg-gray-50/50 transition-colors font-semibold ${
                                      isRowSelected ? 'bg-red-50/30' : ''
                                   }`}
                                >
                                  <td className="px-6 py-6 text-center select-none">
                                     <input 
                                        type="checkbox"
                                        checked={isRowSelected}
                                        onChange={() => handleSelectIndividual(post.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                     />
                                  </td>
                                  <td className="px-6 py-6">
                                    <div className="flex items-center gap-3">
                                      <img src={post.authorPhoto || ''} className="w-8 h-8 rounded-full bg-gray-100" alt="" referrerPolicy="no-referrer" />
                                      <div className="min-w-0">
                                        <p className="font-extrabold text-gray-900 truncate">{post.authorName}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'N/A'}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-6 text-gray-800 font-bold max-w-xs text-gray-800">
                                    <p className="line-clamp-2 md:line-clamp-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                    {post.mediaUrl && post.mediaType === 'image' && (
                                       <span className="text-[9px] text-indigo-500 font-extrabold uppercase mt-1 block">🖼 Has Image Attachment</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-6 text-center">
                                     <div className="flex justify-center gap-4 font-black">
                                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{post.likes?.length || 0} Likes</span>
                                        <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{post.commentCount || 0} Comments</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-6 text-center">
                                     <div className="flex flex-col gap-1.5 items-center">
                                        {post.reports && post.reports.length > 0 ? (
                                          <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100 animate-pulse">
                                             🚨 {post.reports.length} Flagged
                                          </span>
                                        ) : (
                                          <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                             🟢 Clean community
                                          </span>
                                        )}

                                        {post.isSponsored && (
                                          <div className="mt-1 flex flex-col gap-1 items-center">
                                            <span className="bg-indigo-950 text-indigo-200 px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">⚡ Sponsored Ad</span>
                                            <div className="text-[8px] font-mono font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded max-w-[120px] truncate" title={post.paymentTxId}>
                                              Ref: {post.paymentTxId || 'None'}
                                            </div>
                                            <button
                                              onClick={() => handleTogglePostSponsorStatus(post.id, post.paymentStatus)}
                                              className={`px-3 py-1.5 text-[8.5px] font-black uppercase rounded-lg tracking-wider cursor-pointer transition-all ${
                                                post.paymentStatus === 'verified'
                                                  ? 'bg-emerald-600 text-white'
                                                  : 'bg-amber-400 text-gray-950 hover:bg-emerald-600 hover:text-white'
                                              }`}
                                            >
                                              {post.paymentStatus === 'verified' ? '✓ VERIFIED' : '⚠ VERIFY UPI'}
                                            </button>
                                          </div>
                                        )}
                                     </div>
                                  </td>
                                  <td className="px-6 py-6 text-center">
                                     <button 
                                       onClick={() => handleDeletePost(post.id)}
                                       className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl border border-transparent hover:border-red-100"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                   );
                })()}
             </div>
          )}

           {activeTab === 'moderation' && (
              <div className="space-y-6">
                 {/* Global Emergency Alarm Control Hub */}
                 <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-2 max-w-2xl">
                       <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                          </span>
                          <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                             Emergency Safety Alert Alarm (सुरक्षा अलर्ट अलार्म सायरन)
                          </h4>
                       </div>
                       <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                          जेव्हा आपत्कालीन (Emergency Post) सुरक्षितता इशारा प्रसिद्ध केला जाईल, तेव्हा युजर्सच्या मोबाईलवर सायरन आवाज वाजवायचा की नाही हे तुम्ही येथून नियंत्रित करू शकता. 
                          आवाज सुरू करण्यासाठी <b>"Turn ON"</b> निवडा. बंद करण्यासाठी <b>"Turn OFF"</b> निवडा.
                       </p>
                       
                       <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-950 text-[10px] font-extrabold px-3 py-1.5 rounded-xl w-fit border border-indigo-100/50">
                          {emergencyAlarmEnabled ? (
                             <>
                               <Volume2 className="w-3.5 h-3.5 text-indigo-600 animate-bounce" /> 
                               <span>सध्याची स्थिती: 🟢 अलार्म सायरन चालू आहे (ALARM IS LIVE!)</span>
                             </>
                          ) : (
                             <>
                               <VolumeX className="w-3.5 h-3.5 text-gray-400" /> 
                               <span>सध्याची स्थिती: 🔇 अलार्म सायरन बंद आहे (MUTED)</span>
                             </>
                          )}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
                       <button
                         type="button"
                         onClick={() => toggleEmergencyAlarm(true)}
                         className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                           emergencyAlarmEnabled 
                             ? 'bg-red-600 text-white shadow-md shadow-red-200 ring-2 ring-red-300' 
                             : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                         }`}
                       >
                          <Volume2 className="w-4 h-4" /> Switch ON (सुरू करा)
                       </button>
                       <button
                         type="button"
                         onClick={() => toggleEmergencyAlarm(false)}
                         className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                           !emergencyAlarmEnabled 
                             ? 'bg-slate-900 text-white shadow-md shadow-slate-200' 
                             : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                         }`}
                       >
                          <VolumeX className="w-4 h-4" /> Mute OFF (बंद करा)
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportedPosts.length === 0 ? (
                      <div className="col-span-full py-20 text-center bg-white rounded-[40px] pro-shadow border border-gray-100">
                         <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                         <h3 className="text-xl font-black uppercase italic tracking-tighter">Network Clean</h3>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No anomalies detected in community nodes.</p>
                      </div>
                    ) : (
                      reportedPosts.map(post => (
                         <div key={post.id} className="bg-white p-6 rounded-[32px] pro-shadow border-l-4 border-red-500">
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-3">
                                  <img src={post.authorPhoto || ''} className="w-8 h-8 rounded-full" alt="" />
                                  <div>
                                     <p className="text-xs font-bold">{post.authorName}</p>
                                     <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{post.reports?.length} Reports</p>
                                  </div>
                               </div>
                               <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                            <p className="text-sm font-medium text-gray-600 italic bg-gray-50 p-4 rounded-xl border border-gray-100">"{post.content}"</p>
                         </div>
                      ))
                    )}
                 </div>
              </div>
           )}

          {activeTab === 'stateMilestones' && (
             <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 p-8 md:p-10 text-gray-800 space-y-8 animate-fade-in">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                         Owner Administration
                      </span>
                   </div>
                   <h3 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-tight">
                      राज्यस्तरीय पायऱ्या व २४ फिचर्स रचना (State Milestones & 24 Features)
                   </h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5 leading-relaxed max-w-3xl">
                      कोणत्याही राज्याचे प्रगतीचे टक्के ५% किंवा १०% वरून ८०% गाठल्यावर आपोआप कोणती विशेष सेवा सुरू व्हावी हे तुम्ही येथून नियंत्रित करू शकता. २४ हायपर-लोकल फीचर्सचे पर्याय उपलब्ध आहेत!
                   </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                   <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
                         Select State to Configure (राज्य निवडा)
                      </label>
                      <select
                         value={configStateCode}
                         onChange={(e) => setConfigStateCode(e.target.value)}
                         className="w-full bg-white border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                         {INDIAN_STATES.map((st) => (
                            <option key={st.code} value={st.code}>
                               {st.nameEn} - {st.nameMr} ({st.code})
                            </option>
                         ))}
                      </select>
                   </div>
                   <div className="text-xs text-gray-500 space-y-1">
                      <p className="font-extrabold text-indigo-600 uppercase tracking-widest text-[9px] mb-1">PRO-TIP FOR ARYAN:</p>
                      <p className="font-medium leading-relaxed">
                         Each state has a customized sequence. When users register in <span className="font-bold text-slate-900">{INDIAN_STATES.find(s => s.code === configStateCode)?.nameEn}</span>, progress increments automatically. At designated percentages, the selected services automatically go live on their homescreen!
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {STATE_MILESTONE_LEVELS.map((ml) => {
                      const levelKey = `level${ml.level}`;
                      const selectedFeatureId = levelMappings[levelKey] || '';
                      const activeFeature = STATE_FEATURE_TEMPLATES.find(f => f.id === selectedFeatureId);

                      return (
                         <div key={ml.level} className="bg-white p-5 rounded-3xl border border-gray-100 pro-shadow flex flex-col justify-between hover:border-indigo-100 transition-colors">
                            <div className="space-y-4">
                               <div className="flex items-center justify-between">
                                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                     LEVEL {ml.level}
                                  </span>
                                  <span className="text-xs font-black text-indigo-600">
                                     {ml.pct}% Users
                                  </span>
                               </div>

                               <div className="space-y-1">
                                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                     Target Unlock Action:
                                  </label>
                                  <select
                                     value={selectedFeatureId}
                                     onChange={(e) => {
                                        const newVal = e.target.value;
                                        setLevelMappings(prev => ({
                                           ...prev,
                                           [levelKey]: newVal
                                        }));
                                     }}
                                     className="w-full bg-slate-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold text-gray-800 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                  >
                                     <option value="">-- Choose Feature / Service --</option>
                                     {STATE_FEATURE_TEMPLATES.map((tmpl) => (
                                        <option key={tmpl.id} value={tmpl.id}>
                                           {tmpl.titleEn} ({tmpl.titleMr})
                                        </option>
                                     ))}
                                  </select>
                               </div>

                               {activeFeature ? (
                                  <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/50 space-y-1">
                                     <p className="text-[10px] font-extrabold text-indigo-950 uppercase">
                                        👉 {activeFeature.titleEn}
                                     </p>
                                     <p className="text-[9px] font-bold text-indigo-500 leading-snug">
                                        {activeFeature.titleMr}
                                     </p>
                                     <p className="text-[8px] text-gray-400 font-medium leading-relaxed line-clamp-3">
                                        {activeFeature.descMr}
                                     </p>
                                  </div>
                               ) : (
                                  <div className="p-4 text-center border-2 border-dashed border-gray-100 rounded-2xl text-[9px] font-bold text-gray-300 uppercase">
                                     No feature assigned
                                  </div>
                                )}
                            </div>
                         </div>
                      );
                   })}
                </div>

                <div className="flex justify-end pt-4">
                   <button
                      onClick={handleSaveStateConfig}
                      disabled={savingConfig}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                   >
                      {savingConfig ? 'सुरक्षित करत आहे...' : 'फिचर्स रचना सुरक्षित करा (Save Config)'}
                   </button>
                </div>
             </div>
           )}

          {activeTab === 'royalties' && (
            <div className="space-y-8 animate-fade-in text-[#0D1B2A]">
               {/* Payout Details Config */}
               <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-xl font-black italic tracking-tighter uppercase">Aryan's Payout Coordinates</h3>
                     </div>
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-relaxed">
                        These destination accounts are displayed to partner stores during campaign agreement signings.
                     </p>

                     <div className="space-y-3">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-slate-400">Owner GPay / UPI Address</label>
                           <input
                             type="text"
                             value={upiId}
                             onChange={(e) => setUpiId(e.target.value)}
                             placeholder="8600869341@upi"
                             className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-slate-400">Owner Contact Phone (WhatsApp & Partner Inquiries)</label>
                           <input
                             type="text"
                             value={phone}
                             onChange={(e) => setPhone(e.target.value)}
                             placeholder="+918600869341"
                             className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                           />
                        </div>
                        <div className="space-y-1">

                        </div>
                        <button
                          onClick={savePayoutConfig}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all pro-shadow"
                        >
                           <Save className="w-3.5 h-3.5" /> Save Coordinates
                        </button>
                     </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[32px] text-white flex flex-col justify-between">
                     <div>
                        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Revenue Status</span>
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase mt-4 mb-2">Royalty Ledger</h4>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                           All businesses must report their approximate sales volume/net margins. You are legally entitled to receive <b className="text-indigo-400">2%</b> of net campaign revenues derived from customers using local vouchers.
                        </p>
                     </div>
                     <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Expected Payouts In Escrow</p>
                           <p className="text-4xl font-black text-emerald-400">₹{totalRoyaltyDue.toLocaleString()}</p>
                        </div>
                        <Coins className="w-12 h-12 text-white/5" />
                     </div>
                  </div>
               </div>

               {/* Global Pricing & Subscription Plan Control */}
               <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                     <Coins className="w-5 h-5 text-indigo-600" />
                     <h3 className="text-xl font-black italic tracking-tighter uppercase">💰 Global Subscription & Promotion Pricing Console</h3>
                  </div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-relaxed mb-6">
                     Toggle between free mode versus paid mode, and configure exact pricing parameters across plans and promotional campaigns.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Subscription Mode Status & Toggle */}
                     <div className="space-y-4 p-6 bg-gradient-to-br from-indigo-50/50 to-indigo-50/10 rounded-3xl border border-indigo-100 flex flex-col justify-between">
                        <div className="space-y-2">
                           <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">Pricing Strategy</span>
                           <h4 className="text-lg font-black uppercase tracking-tight text-indigo-950">Subscription Access</h4>
                           <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
                              Run the network with completely **FREE** access for the initial 1-2 months, and easily toggle **PAID** subscription gates later when ready.
                           </p>
                        </div>
                        
                        <div className="space-y-3 mt-4">
                           <div className="flex items-center justify-between bg-white px-4 py-3.5 rounded-2xl border border-indigo-100">
                              <div>
                                 <p className="text-[10px] font-black uppercase text-indigo-950 font-black">Subscription Mode</p>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase">
                                    {isSubscriptionPaid ? '🔒 PAID MODE ACTIVE' : '🎉 FREE TRIAL ACTIVE'}
                                 </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsSubscriptionPaid(!isSubscriptionPaid)}
                                className={`px-4 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all duration-300 ${
                                  isSubscriptionPaid 
                                    ? 'bg-amber-400 text-[#000000] hover:bg-amber-500 shadow-sm hover:scale-105' 
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:scale-105'
                                }`}
                              >
                                {isSubscriptionPaid ? 'Set to FREE' : 'Set to PAID'}
                              </button>
                           </div>
                        </div>
                     </div>

                     {/* Plan Pricing Inputs (for users subscribing) */}
                     <div className="space-y-4 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 col-span-1 lg:col-span-2">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Configure Core Plan Pricing (USD / ₹)</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Basic Node Plan</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={basicPlanPrice}
                                   onChange={(e) => setBasicPlanPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-white border border-gray-100 rounded-xl py-2.5 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                                 />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Pro Core Plan</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={proPlanPrice}
                                   onChange={(e) => setProPlanPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-white border border-gray-100 rounded-xl py-2.5 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                                 />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Enterprise Plan</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={enterprisePlanPrice}
                                   onChange={(e) => setEnterprisePlanPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-white border border-gray-100 rounded-xl py-2.5 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Standard Deal Post Fee</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={dealPostPrice}
                                   onChange={(e) => setDealPostPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-white border border-gray-100 rounded-xl py-2.5 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                                 />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">Sponsored Pin / Ad Fee</label>
                              <div className="relative">
                                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={sponsorPinPrice}
                                   onChange={(e) => setSponsorPinPrice(Number(e.target.value) || 0)}
                                   className="w-full bg-white border border-gray-100 rounded-xl py-2.5 pl-7 pr-3 text-xs font-bold focus:ring-1 ring-indigo-500 outline-none"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-50">
                     <button
                       type="button"
                       onClick={savePayoutConfig}
                       className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all pro-shadow"
                     >
                        <Save className="w-3.5 h-3.5" /> Save Pricing & Configuration
                     </button>
                  </div>
               </div>

               {/* Agreements Ledger List */}
               <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                     <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" /> Signed Royalty Portfolios
                     </h3>
                     <span className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[9px] font-black uppercase text-gray-400">
                        {deals.filter(d => d.hasSignedProfitAgreement).length} signed campaigns
                     </span>
                  </div>

                  {deals.filter(d => d.hasSignedProfitAgreement).length === 0 ? (
                    <div className="py-24 text-center">
                       <Percent className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-pulse" />
                       <h4 className="text-sm font-black uppercase text-gray-300 tracking-widest">No Signed Deals Discovered</h4>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Voucher agreements will pop up once stores publish campaign deals.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100">
                             <tr>
                                <th className="px-8 py-5">Merchant / Deal details</th>
                                <th className="px-8 py-5 text-center">Est. Earnings Ledger</th>
                                <th className="px-8 py-5 text-center">2% Royalty Share</th>
                                <th className="px-8 py-5">Digital Signatures</th>
                                <th className="px-8 py-5 text-center">Sponsor Pin</th>
                                <th className="px-8 py-5 text-center">Clearing Status</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {deals.filter(d => d.hasSignedProfitAgreement).map(deal => {
                                const dealProfit = (deal.expectedUnitsPerMonth || 0) * (deal.expectedProfitPerUnit || 0);
                                const royaltyDue = dealProfit * 0.02;
                                
                                return (
                                   <tr key={deal.id} className="hover:bg-gray-50/50 transition-all font-medium text-xs text-gray-700">
                                      <td className="px-8 py-6">
                                         <div>
                                            <p className="font-extrabold text-gray-900 text-sm">{deal.businessName}</p>
                                            <p className="text-[10px] font-bold text-indigo-600 mt-0.5">{deal.title} ({deal.category})</p>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                               <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                               {deal.location?.areaName}
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                         <div className="space-y-0.5">
                                            <p className="font-bold text-gray-900">₹{dealProfit.toLocaleString()}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                               {deal.expectedUnitsPerMonth} units &bull; ₹{deal.expectedProfitPerUnit}/u
                                            </p>
                                         </div>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                         <div className="bg-indigo-50 text-indigo-700 font-extrabold text-sm py-1.5 px-3 rounded-xl inline-block">
                                            ₹{royaltyDue.toLocaleString()}
                                         </div>
                                      </td>
                                      <td className="px-8 py-6">
                                         <div>
                                            <p className="font-mono text-[10px] font-black italic uppercase tracking-wider text-gray-500">
                                               🖋️ SIGNED BY: {deal.signerName}
                                            </p>
                                            {deal.signerPhone && (
                                               <a 
                                                 href={`https://wa.me/${deal.signerPhone.replace(/[^0-9]/g, '')}`}
                                                 target="_blank"
                                                 rel="noreferrer"
                                                 className="mt-1 flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                                               >
                                                  <Phone className="w-3 h-3" /> Chat: {deal.signerPhone}
                                               </a>
                                            )}
                                            {deal.paymentTxId && (
                                               <div className="mt-2 text-[9px] font-mono text-gray-500 bg-gray-50 p-1.5 rounded-xl flex flex-col gap-1 items-start border border-gray-100 max-w-[170px]">
                                                  <span className="font-extrabold text-[#0D1B2A] truncate w-full">UPI Ref: {deal.paymentTxId}</span>
                                                  <button
                                                    onClick={() => handleToggleDealApproval(deal.id, !!deal.isApproved)}
                                                    className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                                                      deal.isApproved
                                                        ? 'bg-emerald-600 text-white hover:bg-red-600'
                                                        : 'bg-amber-400 text-gray-950 hover:bg-emerald-600 hover:text-white'
                                                    }`}
                                                  >
                                                    {deal.isApproved ? '✓ LISTING ACTIVE' : '⚠ APPROVE UPI LISTING'}
                                                  </button>
                                               </div>
                                            )}
                                         </div>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                         <button
                                           onClick={() => handleToggleDealPin(deal.id, !!deal.isPinned)}
                                           className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                             deal.isPinned
                                               ? 'bg-amber-400 text-gray-950 hover:bg-amber-500 hover:scale-105'
                                               : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-800'
                                           }`}
                                         >
                                           {deal.isPinned ? '🔥 TOP FEATURED' : '☆ PIN TO TOP'}
                                         </button>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                         <div className="flex flex-col items-center gap-2">
                                            <select
                                              value={deal.payoutStatus || 'pending'}
                                              onChange={(e) => handleUpdatePayoutStatus(deal.id, e.target.value as any, deal.adminVerifiedAmount || 0)}
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-gray-700 outline-none"
                                            >
                                               <option value="pending">🟡 Pending Payout</option>
                                               <option value="partially_paid">🟠 Partially Paid</option>
                                               <option value="fully_paid">🟢 Cleared & Fully Paid</option>
                                            </select>
                                            <div className="flex items-center gap-1">
                                               <span className="text-[9px] text-gray-400 font-bold uppercase">Paid: ₹</span>
                                               <input 
                                                 type="number"
                                                 value={deal.adminVerifiedAmount || 0}
                                                 onChange={(e) => handleUpdatePayoutStatus(deal.id, deal.payoutStatus || 'pending', parseInt(e.target.value) || 0)}
                                                 className="w-16 bg-gray-50 border border-gray-100 text-center rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-700" 
                                               />
                                            </div>
                                         </div>
                                      </td>
                                   </tr>
                                );
                             })}
                          </tbody>
                       </table>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'freePartners' && (
             <div className="space-y-8 animate-fade-in text-[#0E1F30]">
                {/* Information Header Card */}
                <div className="bg-[#FAF9F6] p-8 border border-amber-100 rounded-[40px] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-3">
                     <span className="bg-amber-100 text-amber-800 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                       🔄 मोफत जाहिरात भागीदारी / App Promotion Barter
                     </span>
                     <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">
                       दुकानदार ॲप प्रमोशन भागीदारी (Free Shopkeepers Promo)
                     </h3>
                     <p className="text-gray-600 text-xs leading-relaxed font-semibold">
                       येथे तुम्हाला अशा दुकानदार-भागीदारांच्या ऑफर्स दिसतील ज्यांनी ₹९९ ऐवजी त्यांच्या दुकानात रोज <b>ॲपचे मोफत ऑफलाइन प्रमोशन</b> करण्याचे मान्य केले आहे. तुम्ही त्यांच्या ऑफर्स व प्लॅन्स वाचून त्यांना सक्रिय (Approve) किंवा निष्क्रिय करू शकता.
                     </p>
                  </div>
                  <div className="bg-slate-900 p-6 text-white rounded-3xl flex flex-col justify-between">
                     <div>
                       <span className="text-indigo-400 text-[8px] font-black uppercase tracking-widest">Active Barter Ratio</span>
                       <h4 className="text-xl font-black italic mt-1 uppercase text-[#F9FAFB]">Barter Deal</h4>
                     </div>
                     <div className="text-xs">
                       <span className="text-slate-300">Offline counter support &bull; </span>
                       <b className="text-emerald-400 font-extrabold text-sm font-sans">₹0 Subscription</b>
                     </div>
                  </div>
                </div>

                {/* Free Deals Ledger Table */}
                <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
                   <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="text-lg font-black italic tracking-tighter uppercase flex items-center gap-2 text-slate-900">
                         <ShieldCheck className="w-5 h-5 text-indigo-500" /> Free Promotion Campaigns List
                      </h3>
                      <span className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[9px] font-black uppercase text-gray-500">
                         {deals.filter(d => d.isFreePromotion || d.paymentTxId === 'FREE_PROMOTION_PARTNER').length} Barter Campaigns
                      </span>
                   </div>

                   {deals.filter(d => d.isFreePromotion || d.paymentTxId === 'FREE_PROMOTION_PARTNER').length === 0 ? (
                     <div className="py-24 text-center">
                        <Percent className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-pulse" />
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">No Free Promotion Requests Yet</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          When retailers submit custom app-promotion deals, they will populate here instantly.
                        </p>
                     </div>
                   ) : (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100">
                              <tr>
                                 <th className="px-8 py-5">Merchant Store Info</th>
                                 <th className="px-8 py-5 text-center">Campaign Offer</th>
                                 <th className="px-8 py-5">🤝 App Promotion Plan</th>
                                 <th className="px-8 py-5">Merchant Phone / Chat</th>
                                 <th className="px-8 py-5 text-center">Sponsor Pin</th>
                                 <th className="px-8 py-5 text-center font-bold">Promotion Status</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50 text-xs">
                              {deals.filter(d => d.isFreePromotion || d.paymentTxId === 'FREE_PROMOTION_PARTNER').map(deal => (
                                 <tr key={deal.id} className="hover:bg-gray-50/50 transition-all font-semibold">
                                    <td className="px-8 py-6">
                                       <div>
                                          <p className="font-black text-gray-900 text-sm uppercase">{deal.businessName}</p>
                                          <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">{deal.category}</p>
                                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{deal.location?.areaName}</p>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                       <div>
                                          <p className="font-extrabold text-indigo-600 text-sm">{deal.title}</p>
                                          <p className="text-orange-600 font-extrabold mt-0.5 bg-orange-50 px-2 py-0.5 rounded-full inline-block text-center">{deal.offer}</p>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6 max-w-sm">
                                       <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 font-sans">
                                          <p className="text-xs font-bold text-indigo-900 leading-relaxed italic animate-pulse">
                                            "{deal.freePromoDetails || 'Counter Banner & Daily User Referral'}"
                                          </p>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6">
                                       <div>
                                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">Signer: {deal.signerName}</p>
                                          {deal.signerPhone && (
                                             <a 
                                               href={`https://wa.me/${deal.signerPhone.replace(/[^0-9]/g, '')}`}
                                               target="_blank"
                                               rel="noreferrer"
                                               className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                                             >
                                                <Phone className="w-3.5 h-3.5" /> WhatsApp {deal.signerPhone}
                                             </a>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                       <button
                                         onClick={() => handleToggleDealPin(deal.id, !!deal.isPinned)}
                                         className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                           deal.isPinned
                                             ? 'bg-amber-400 text-gray-950 hover:bg-amber-500 hover:scale-105'
                                             : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-800'
                                         }`}
                                        >
                                         {deal.isPinned ? '🔥 TOP FEATURED' : '☆ PIN TO TOP'}
                                       </button>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                       <div className="flex flex-col items-center gap-2">
                                          <button
                                            onClick={() => handleToggleDealApproval(deal.id, !!deal.isApproved)}
                                            className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all select-none cursor-pointer ${
                                              deal.isApproved
                                                ? 'bg-emerald-600 text-white hover:bg-red-600'
                                                : "bg-[#EF4444] text-white hover:bg-emerald-600"
                                            }`}
                                          >
                                            {deal.isApproved ? '✓ ACTIVE PROMO' : '🤝 APPROVE PARTNER'}
                                          </button>
                                          <span className="text-[8px] font-sans text-gray-400 uppercase tracking-wider block">
                                            {deal.isApproved ? 'Approved for Free Promotion' : 'Pending Verification'}
                                          </span>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                   )}
                </div>

                {/* Daily Proof Logs Tracker (Visible exclusively to Admin) */}
                <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden mt-8">
                   <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="text-lg font-black italic tracking-tighter uppercase flex items-center gap-2 text-slate-900">
                         <TrendingUp className="w-5 h-5 text-indigo-500 animate-pulse" /> Partner's Daily Video Proof Tracker
                      </h3>
                      <span className="bg-[#FAF9F6] border border-[#F2ECE4] px-3.5 py-1 rounded-full text-[9px] font-black uppercase text-indigo-700">
                         {partnerProofs.length} Cumulative Proofs Submitted
                      </span>
                   </div>

                   {partnerProofs.length === 0 ? (
                     <div className="py-20 text-center text-gray-400">
                        <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h4 className="text-xs font-black uppercase tracking-widest">No promotion proofs recorded yet</h4>
                        <p className="text-[10px] font-semibold mt-1 uppercase text-slate-400">Partners will upload their daily video proof files directly from the local deals card.</p>
                     </div>
                   ) : (
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {partnerProofs.map((proof) => (
                           <div key={proof.id} className="bg-[#FAF9F6] p-6 rounded-3xl border border-gray-100 flex flex-col justify-between font-sans space-y-4">
                              <div className="flex justify-between items-center">
                                 <div>
                                    <h4 className="font-extrabold text-xs text-gray-900 uppercase">{proof.businessName}</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{proof.merchantName}</p>
                                 </div>
                                 <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase">
                                    {proof.uploadedAt ? new Date(proof.uploadedAt).toLocaleDateString() : 'Today'}
                                 </span>
                              </div>

                              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-gray-200">
                                 {proof.videoUrl.startsWith('data:') ? (
                                    proof.videoUrl.includes('video') ? (
                                       <video 
                                          src={proof.videoUrl} 
                                          controls 
                                          className="w-full h-full object-cover" 
                                       />
                                    ) : (
                                       <img 
                                          src={proof.videoUrl} 
                                          alt="Captured Proof Document" 
                                          className="w-full h-full object-cover" 
                                          referrerPolicy="no-referrer"
                                       />
                                    )
                                 ) : (
                                    <video 
                                       src={proof.videoUrl} 
                                       controls 
                                       className="w-full h-full object-cover" 
                                    />
                                 )}
                              </div>

                              <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-gray-50">
                                 <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Remarks / आजची नोंद</span>
                                 <p className="text-xs text-gray-700 italic font-medium leading-relaxed">
                                    "{proof.remarks || 'Daily store counter app promotion counter-checked successfully!'}"
                                 </p>
                              </div>

                              <div className="flex justify-between items-center pt-2">
                                 <span className="text-[8px] font-mono text-gray-400 uppercase">
                                    Time: {proof.uploadedAt ? new Date(proof.uploadedAt).toLocaleTimeString() : ''}
                                 </span>
                                 <button 
                                    onClick={() => {
                                       triggerConfirm(
                                          "प्रूफ डिलीट करायचे का? (Delete Proof?)",
                                          "तुम्ही हे डेली जाहिरात प्रूफ सिस्टीममधून कायमचे काढून टाकू इच्छिता का?",
                                          async () => {
                                             try {
                                                await deleteDoc(doc(db, 'promotion_proofs', proof.id));
                                                triggerAlert("यशस्वी (Success)", "प्रूफ यशस्वीरित्या डिलीट केले गेले आहे.");
                                             } catch (err) {
                                                console.error(err);
                                                triggerAlert("त्रुटी (Error)", "प्रूफ डिलीट करण्यात अडचण आली.");
                                             }
                                          }
                                       );
                                    }}
                                    className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                                 >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove Proof
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
           )}
          {activeTab === 'coupons' && (
             <div className="space-y-8 animate-fade-in text-[#0E1F30] font-sans pb-16">
                {/* Information Header Card */}
                <div className="bg-[#FAF9F6] p-8 border border-[#F2ECE4] rounded-[40px] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <span className="bg-orange-100 text-orange-850 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-block">
                        🏷️ स्पॉन्सरशिप कूपन्स (Sponsor Coupons Setup)
                      </span>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 font-sans">
                        Sponsorship Coupons Manager
                      </h3>
                      <p className="text-gray-600 text-xs leading-relaxed font-semibold">
                        जेव्हा वापरकर्ते ५० लोकांना ॲप रेफर करतील (ज्यामध्ये किमान २५ प्रत्यक्ष इन्स्टॉल असावेत), तेव्हा त्यांना खालीलपैकी सक्रिय स्पॉन्सर्सचे कूपन्स मिळतील. कूपन जोडल्यानंतर ते युझर्सना त्यांच्या 'प्रो' डॅशबोर्डमध्ये दिसतील.
                      </p>
                   </div>
                   <div className="bg-slate-900 p-8 rounded-3xl text-white font-sans flex flex-col justify-between">
                      <div>
                         <span className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">Active Partner Counts</span>
                         <h4 className="text-2xl font-black italic uppercase text-white mt-1">Sponsoring Pipeline</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">
                         Currently managing <b>{coupons.length} Active Coupon Templates</b>.
                      </p>
                   </div>
                </div>

                {/* Create Coupon From */}
                <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100">
                   <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-6 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-orange-500" /> नवीन कूपन जोडा (Add New Coupon)
                   </h3>
                   <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Sponsor Name (उदा. Domino's Pizza, Nike)</label>
                         <input 
                            type="text" 
                            value={newSponsorName}
                            onChange={(e) => setNewSponsorName(e.target.value)}
                            placeholder="Enter Sponsor Name"
                            className="w-full bg-[#F8F9FA] border border-gray-150 rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 text-gray-900 focus:outline-none"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Coupon Code (उदा. BOGO50, FREEMUG)</label>
                         <input 
                            type="text" 
                            value={newCouponCode}
                            onChange={(e) => setNewCouponCode(e.target.value)}
                            placeholder="Enter Coupon Code"
                            className="w-full bg-[#F8F9FA] border border-gray-150 rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 text-gray-900 focus:outline-none"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Offer Details (उदा. Get ₹100 Flat discount on Burgers)</label>
                         <input 
                            type="text" 
                            value={newCouponOffer}
                            onChange={(e) => setNewCouponOffer(e.target.value)}
                            placeholder="Enter Offer Details"
                            className="w-full bg-[#F8F9FA] border border-gray-150 rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 text-gray-900 focus:outline-none mb-2"
                         />
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                         <button 
                            type="submit"
                            className="px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-orange-100"
                         >
                            कूपन सक्रिय करा (Publish Coupon)
                         </button>
                      </div>
                   </form>
                </div>

                {/* Coupons Ledger Table */}
                <div className="bg-white rounded-[40px] pro-shadow border border-gray-100 overflow-hidden">
                   <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="text-lg font-black italic tracking-tighter uppercase flex items-center gap-2 text-slate-900">
                         <Gift className="w-5 h-5 text-indigo-500" /> Active Brand Coupons Status
                      </h3>
                      <span className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[9px] font-black uppercase text-gray-500">
                         {coupons.length} Active Vouchers
                      </span>
                   </div>

                   {coupons.length === 0 ? (
                      <div className="py-20 text-center text-gray-400">
                         <Gift className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                         <h4 className="text-xs font-black uppercase tracking-widest">No active sponsor coupons published</h4>
                         <p className="text-[10px] font-semibold mt-1 uppercase text-slate-400">Add sponsor coupons above to distribute them to referrers.</p>
                      </div>
                   ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-xs">
                           <thead className="bg-[#FAF9F6] text-[9px] font-black uppercase tracking-widest text-[#5C6F84] border-b border-gray-150">
                              <tr>
                                 <th className="px-8 py-5">Sponsor Brand</th>
                                 <th className="px-8 py-5">Offer Details</th>
                                 <th className="px-8 py-5">Generated Code</th>
                                 <th className="px-8 py-5">Status</th>
                                 <th className="px-8 py-5 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 text-gray-700">
                              {coupons.map((coupon) => {
                                 return (
                                    <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                                       <td className="px-8 py-5">
                                          <span className="font-extrabold text-slate-900 uppercase">
                                             {coupon.sponsorName}
                                          </span>
                                       </td>
                                       <td className="px-8 py-5 max-w-[200px]">
                                          <p className="font-semibold text-slate-600 truncate">{coupon.offerDetails}</p>
                                       </td>
                                       <td className="px-8 py-5">
                                          <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg font-mono text-[10px] uppercase font-bold border border-slate-200">
                                             {coupon.code}
                                          </span>
                                       </td>
                                       <td className="px-8 py-5">
                                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[8px] font-black uppercase">
                                             ● Live / Active
                                          </span>
                                       </td>
                                       <td className="px-8 py-5 text-right">
                                          <button 
                                             onClick={() => handleDeleteCoupon(coupon.id)}
                                             className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1 cursor-pointer justify-end ml-auto"
                                          >
                                             <Trash2 className="w-3.5 h-3.5" /> Remove
                                          </button>
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                      </div>
                   )}
                </div>
             </div>
          )}
        </main>
      </div>

      {/* Custom Confirmation / Alert Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-gray-100 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-4 ${confirmDialog.isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {confirmDialog.isDestructive ? (
                  <Trash2 className="w-8 h-8" />
                ) : (
                  <ShieldAlert className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                {confirmDialog.title}
              </h3>
              <p className="mt-2 text-xs text-gray-500 font-semibold leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            
            <div className="mt-6 flex gap-2.5">
              {!confirmDialog.alertOnly && (
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                >
                  {confirmDialog.cancelText || 'रद्द करा (Cancel)'}
                </button>
              )}
              <button
                onClick={async () => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  await confirmDialog.onConfirm();
                }}
                className={`flex-1 px-4 py-2.5 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center ${
                  confirmDialog.isDestructive 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-md' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                }`}
              >
                {confirmDialog.confirmText || 'मंजूर करा (Confirm)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
