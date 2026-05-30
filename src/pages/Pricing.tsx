import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Crown, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pricingConfig, setPricingConfig] = useState({
    isSubscriptionPaid: false, // Default is FREE trial
    basicPlanPrice: 9,
    proPlanPrice: 19,
    enterprisePlanPrice: 49
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'owner_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPricingConfig({
          isSubscriptionPaid: data.isSubscriptionPaid !== undefined ? !!data.isSubscriptionPaid : false,
          basicPlanPrice: data.basicPlanPrice !== undefined ? Number(data.basicPlanPrice) : 9,
          proPlanPrice: data.proPlanPrice !== undefined ? Number(data.proPlanPrice) : 19,
          enterprisePlanPrice: data.enterprisePlanPrice !== undefined ? Number(data.enterprisePlanPrice) : 49
        });
      }
    });
    return () => unsub();
  }, []);

  const handleSubscribe = async (plan: string, priceDisplay: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isPremium: true,
        subscriptionPlan: plan.toLowerCase(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      if (!pricingConfig.isSubscriptionPaid) {
        alert(`🎁 SUCCESS / यशस्वी झालं! You have activated the ${plan} plan for FREE! (पुढील १ ते २ महिने मोफत योजना सक्रिय झाली आहे)`);
      } else {
        alert(`Success! You have subscribed to the ${plan} plan for ${priceDisplay}.`);
      }
      navigate('/ai-chat');
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  const plans = [
    {
      name: 'Basic Node',
      price: pricingConfig.isSubscriptionPaid ? `$${pricingConfig.basicPlanPrice}` : 'FREE',
      originalPrice: pricingConfig.isSubscriptionPaid ? null : `$${pricingConfig.basicPlanPrice}`,
      duration: 'month',
      icon: Zap,
      color: 'blue',
      features: ['Basic AI Chat', 'Community Feed', 'Event Access', 'Ad-free Experience']
    },
    {
      name: 'Pro Core',
      price: pricingConfig.isSubscriptionPaid ? `$${pricingConfig.proPlanPrice}` : 'FREE',
      originalPrice: pricingConfig.isSubscriptionPaid ? null : `$${pricingConfig.proPlanPrice}`,
      duration: 'month',
      icon: Crown,
      color: 'indigo',
      features: ['Advanced AI Intelligence', 'Voice Interaction', 'Owner Portal Access', 'Priority Support', 'Exclusive Events'],
      recommended: true
    },
    {
      name: 'Enterprise',
      price: pricingConfig.isSubscriptionPaid ? `$${pricingConfig.enterprisePlanPrice}` : 'FREE',
      originalPrice: pricingConfig.isSubscriptionPaid ? null : `$${pricingConfig.enterprisePlanPrice}`,
      duration: 'month',
      icon: ShieldCheck,
      color: 'emerald',
      features: ['Full System Control', 'Global Analytics', 'Custom API Access', 'Verified Badge', 'Direct Management']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-gray-900 pt-20 pb-40 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 block">Access Protocols</span>
          <h1 className="text-4xl font-black uppercase text-white tracking-tighter italic mb-4">Choose Your Node</h1>
          <p className="text-gray-400 text-sm font-medium max-w-md mx-auto">Select a subscription plan to unlock full terminal capabilities and premium networking features.</p>
          
          {!pricingConfig.isSubscriptionPaid && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 bg-amber-400 text-[#0c0a09] px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 relative"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-950"></span>
              </span>
              <span>🔥 Limited Free Promo active! / मर्यादित मोफत योजना सुरू आहे!</span>
              <span className="bg-[#0c0a09] text-amber-400 px-3 py-1 rounded-full text-[9px] font-bold">1-2 MONTHS FREE</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-[40px] p-8 pro-shadow relative flex flex-col ${plan.recommended ? 'ring-4 ring-indigo-600 ring-offset-4 ring-offset-gray-50' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Recommended Core
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl bg-${plan.color}-50 flex items-center justify-center mb-8`}>
                <plan.icon className={`w-8 h-8 text-${plan.color}-600`} />
              </div>

              <h3 className="text-xl font-black uppercase tracking-tighter italic text-gray-900 mb-2">{plan.name}</h3>
              <div className="flex flex-col mb-8">
                <div className="flex items-baseline gap-2">
                  {plan.originalPrice && (
                    <span className="text-xl font-black text-gray-400 line-through tracking-tight">{plan.originalPrice}</span>
                  )}
                  <span className="text-4xl font-black italic text-gray-900 tracking-tight">{plan.price}</span>
                </div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mt-1">
                  {!pricingConfig.isSubscriptionPaid ? '🎁 FREE TRIAL / मोफत योजना' : `/ ${plan.duration}`}
                </span>
              </div>

              <div className="space-y-4 mb-12 flex-1">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan.name, plan.price)}
                className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 group ${
                  plan.recommended 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200' 
                    : 'bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200'
                }`}
              >
                Initialize Plan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 max-w-2xl mx-auto bg-white rounded-[40px] p-10 pro-shadow border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Supported Payment Methods</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Secure infrastructure provided by Google Cloud</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Cards</p>
              <p className="text-xs font-bold text-gray-600">Credit & Debit Cards (Visa, Mastercard, Amex)</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Indian Accounts</p>
              <p className="text-xs font-bold text-gray-600">Net Banking & UPI (via Google Cloud Billing)</p>
            </div>
          </div>

          <p className="mt-6 text-[10px] text-gray-400 font-medium leading-relaxed">
            Note: For international transactions, please ensure your debit/credit card has "International Usage" enabled. If you are having trouble with a debit card, try Net Banking or a Credit Card.
          </p>
        </div>

        <div className="mt-16 text-center">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-8">Secure Crypto-Encrypted Payments</p>
            <div className="flex justify-center gap-12 opacity-30">
                <ShieldCheck className="w-8 h-8" />
                <Zap className="w-8 h-8" />
                <Crown className="w-8 h-8" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
