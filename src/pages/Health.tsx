import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Apple, Dumbbell, Flame, TrendingUp, Quote, RefreshCw, Loader2, ChevronLeft } from 'lucide-react';
import { getHealthAdvice } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HealthData {
  dailyTip: string;
  dietAdvice: string[];
  exercises: { name: string; sets: string; benefit: string }[];
  motivation: string;
}

export default function Health() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<'gain' | 'loss' | 'maintenance'>('maintenance');
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdvice = async () => {
    setLoading(true);
    const advice = await getHealthAdvice(goal, user?.language || 'en');
    if (advice) setData(advice);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvice();
  }, [goal]);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-4 border-black p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">
            Health & <span className="text-india-green">Fitness</span>
          </h1>
        </div>
        <button 
          onClick={fetchAdvice}
          disabled={loading}
          className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Goal Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['loss', 'maintenance', 'gain'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`py-3 px-2 border-4 font-black uppercase text-[10px] sm:text-xs tracking-widest transition-all ${
                goal === g 
                  ? 'bg-black text-white border-black shadow-[4px_4px_0_0_rgba(255,153,51,1)]' 
                  : 'bg-white text-black border-black hover:bg-gray-50'
              }`}
            >
              {g === 'loss' ? 'Weight Loss' : g === 'gain' ? 'Weight Gain' : 'Stay Fit'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-india-green" />
            <p className="font-black uppercase tracking-widest text-xs animate-pulse">Generating your plan...</p>
          </div>
        ) : data ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Daily Tip */}
            <div className="bg-saffron/10 border-4 border-black p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-saffron text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest border-l-4 border-b-4 border-black">
                Daily Tip
              </div>
              <div className="flex gap-4 items-start">
                <Flame className="w-8 h-8 text-saffron shrink-0" />
                <p className="text-lg font-bold leading-tight">{data.dailyTip}</p>
              </div>
            </div>

            {/* Diet Section */}
            <div className="border-4 border-black">
              <div className="bg-black text-white p-2 flex items-center gap-2">
                <Apple className="w-4 h-4" />
                <span className="font-black uppercase tracking-widest text-xs">Diet & Nutrition</span>
              </div>
              <div className="p-4 space-y-3">
                {data.dietAdvice.map((advice, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-india-green rounded-full shrink-0" />
                    <p className="text-sm font-medium">{advice}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercises Section */}
            <div className="border-4 border-black">
              <div className="bg-india-green text-white p-2 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                <span className="font-black uppercase tracking-widest text-xs">Recommended Routine</span>
              </div>
              <div className="divide-y-2 divide-gray-100">
                {data.exercises.map((ex, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-black uppercase text-sm tracking-tight">{ex.name}</h3>
                      <span className="bg-black text-white px-2 py-0.5 text-[8px] font-bold rounded uppercase">{ex.sets}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{ex.benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivation */}
            <div className="bg-gray-50 border-4 border-black p-6 italic text-center relative">
              <Quote className="w-10 h-10 text-gray-200 absolute top-2 left-2 -z-0" />
              <p className="relative z-10 text-xl font-bold leading-tight text-gray-800">
                "{data.motivation}"
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 border-4 border-black border-dashed">
            <p className="font-bold text-gray-500">Failed to load health advice. Try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
