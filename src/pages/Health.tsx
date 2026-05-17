import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Apple, Dumbbell, Flame, TrendingUp, Quote, RefreshCw, Loader2, ChevronLeft } from 'lucide-react';
import { getHealthAdvice } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/common/LocationPicker';

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
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 p-6 flex items-center justify-between pro-shadow">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all border border-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">
              Wellness <span className="text-emerald-600">Protocol</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LocationPicker />
          <button 
            onClick={fetchAdvice}
            disabled={loading}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center pro-shadow border border-gray-100 text-gray-400 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-[500px] mx-auto">
        {/* Goal Selector */}
        <div className="grid grid-cols-3 gap-3">
          {(['loss', 'maintenance', 'gain'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`py-4 px-2 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all pro-shadow border ${
                goal === g 
                  ? 'bg-gray-900 text-white border-gray-900 ring-4 ring-black/5' 
                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
              }`}
            >
              {g === 'loss' ? 'Optimization' : g === 'gain' ? 'Ascension' : 'Homeostasis'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center pro-shadow animate-pulse">
               <Activity className="w-8 h-8 animate-spin-slow" />
            </div>
            <p className="font-black uppercase tracking-widest text-[10px] text-gray-400 animate-pulse">Synthesizing Bio-Plan...</p>
          </div>
        ) : data ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Daily Tip */}
            <div className="bg-white rounded-[32px] p-6 pro-shadow border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-amber-50 text-amber-600 px-4 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-bl-3xl border-l border-b border-amber-100">
                Primary Insight
              </div>
              <div className="flex gap-5 items-start mt-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <p className="text-base font-bold leading-relaxed text-gray-900 pt-1">{data.dailyTip}</p>
              </div>
            </div>

            {/* Diet Section */}
            <div className="bg-white rounded-[32px] overflow-hidden pro-shadow border border-gray-100">
              <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="w-4 h-4 text-emerald-400" />
                  <span className="font-black uppercase tracking-widest text-[10px]">Nutritional Protocol</span>
                </div>
                <TrendingUp className="w-4 h-4 text-white/40" />
              </div>
              <div className="p-6 space-y-4">
                {data.dietAdvice.map((advice, i) => (
                  <div key={i} className="flex gap-4 items-center group">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 group-hover:scale-150 transition-transform" />
                    <p className="text-sm font-bold text-gray-600">{advice}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercises Section */}
            <div className="bg-white rounded-[32px] overflow-hidden pro-shadow border border-gray-100">
              <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-indigo-200" />
                  <span className="font-black uppercase tracking-widest text-[10px]">Kinetical Workflow</span>
                </div>
                <Activity className="w-4 h-4 text-white/40" />
              </div>
              <div className="divide-y border-t border-gray-50">
                {data.exercises.map((ex, i) => (
                  <div key={i} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                    <div>
                      <h3 className="font-black uppercase text-xs tracking-widest text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{ex.name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase italic">{ex.benefit}</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 text-[9px] font-black rounded-xl uppercase tracking-tighter border border-indigo-100">{ex.sets}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivation */}
            <div className="bg-white rounded-[40px] p-8 text-center relative pro-shadow border border-gray-100 overflow-hidden">
              <Quote className="w-16 h-16 text-gray-50 absolute -top-2 -left-2 -z-0 rotate-12" />
              <p className="relative z-10 text-lg font-black italic leading-snug text-gray-900 tracking-tighter">
                "{data.motivation}"
              </p>
              <div className="mt-6 flex justify-center gap-1.5 opacity-20">
                <div className="w-1 h-1 rounded-full bg-black" />
                <div className="w-1 h-1 rounded-full bg-black" />
                <div className="w-1 h-1 rounded-full bg-black" />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[40px] pro-shadow border border-gray-100 border-dashed">
            <p className="font-black uppercase text-[10px] text-gray-300 tracking-widest">Protocol Retrieval Failed</p>
          </div>
        )}
      </div>
    </div>
  );
}
