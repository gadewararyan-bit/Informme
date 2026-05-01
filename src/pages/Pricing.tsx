import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Crown, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // SIMULATED PAYMENT: In a real app, this would redirect to Stripe
    // For now, let's simulate a successful upgrade
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isPremium: true,
        subscriptionPlan: plan,
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert(`Success! You have subscribed to the ${plan} plan.`);
      navigate('/ai-chat');
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  const plans = [
    {
      name: 'Basic Node',
      price: '$9',
      duration: 'month',
      icon: Zap,
      color: 'blue',
      features: ['Basic AI Chat', 'Community Feed', 'Event Access', 'Ad-free Experience']
    },
    {
      name: 'Pro Core',
      price: '$19',
      duration: 'month',
      icon: Crown,
      color: 'indigo',
      features: ['Advanced AI Intelligence', 'Voice Interaction', 'Owner Portal Access', 'Priority Support', 'Exclusive Events'],
      recommended: true
    },
    {
      name: 'Enterprise',
      price: '$49',
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
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black italic text-gray-900">{plan.price}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">/ {plan.duration}</span>
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
                onClick={() => handleSubscribe(plan.name)}
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
