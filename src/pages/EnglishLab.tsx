import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, MessageCircle, Star, SpellCheck, Volume2, ArrowRight, Sparkles, Languages, CheckCircle2, RefreshCw, HelpCircle, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import { getLessonContent } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import LocationPicker from '../components/common/LocationPicker';

interface Lesson {
  title: string;
  description: string;
  content: string;
  examples: { original: string; translated: string; explanation: string }[];
  quiz: { question: string; options: string[]; correct: number };
}

const EnglishLab: React.FC = () => {
  const { user } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [learningLanguage, setLearningLanguage] = useState<'English' | 'Hindi' | 'Marathi'>('English');
  const [selectedLevel, setSelectedLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const categories = [
    { id: 'daily', title: 'Daily Phrases', icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'vocabulary', title: 'Power Words', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'grammar', title: 'Grammar Hacks', icon: SpellCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'pronunciation', title: 'Speak Clear', icon: Volume2, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  const fetchLesson = async (category: string) => {
    setIsLoading(true);
    setActiveLesson(null);
    setUserAnswer(null);
    setShowResult(false);
    
    // Map code to full name for the prompt
    const langMap: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'mr': 'Marathi'
    };
    
    const response = await getLessonContent(
      selectedLevel, 
      category, 
      learningLanguage, 
      langMap[language] || 'English'
    );
    
    if (response) {
      setActiveLesson(response);
    } else {
      alert("Lesson generation failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handleLessonComplete = () => {
    if (userAnswer === activeLesson?.quiz.correct) {
      setShowResult(true);
    } else {
      alert("Not quite right. Look at the examples again!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32">
      <header className="bg-white p-8 pt-12 pb-12 border-b border-gray-100 pro-shadow relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar py-1">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center pro-shadow ring-4 ring-indigo-600/10">
                 <GraduationCap className="w-6 h-6" />
               </div>
               <div>
                 <h1 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">Language Hub</h1>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Speak Globally</p>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase ml-1">Learning</span>
                    <select 
                      value={learningLanguage}
                      onChange={(e) => setLearningLanguage(e.target.value as any)}
                      className="bg-transparent text-[10px] font-black uppercase tracking-widest text-indigo-600 focus:outline-none cursor-pointer px-1"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                    </select>
                  </div>
               </div>
               <LocationPicker />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl max-w-sm">
            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level as any)}
                className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  selectedLevel === level 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -mr-32 -mt-32" />
      </header>

      <main className="max-w-4xl mx-auto px-6 -mt-8 space-y-8 relative z-20">
        <AnimatePresence mode="wait">
          {showResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-12 rounded-[40px] pro-shadow border border-emerald-100 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900">Excellent!</h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                You've mastered this {learningLanguage} concept. <br/> Keep practicing to build permanent neural pathways!
              </p>
              <button 
                onClick={() => { setShowResult(false); setActiveLesson(null); }}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all"
              >
                Choose Next Lesson
              </button>
            </motion.div>
          ) : isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white p-12 rounded-[40px] pro-shadow border border-gray-100 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">AI is crafting your lesson...</p>
            </motion.div>
          ) : activeLesson ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[40px] pro-shadow border border-indigo-100 space-y-8"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{activeLesson.title}</h2>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{activeLesson.description}</p>
                </div>
                <button onClick={() => setActiveLesson(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="prose prose-sm prose-indigo max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed font-medium">{activeLesson.content}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLesson.examples.map((ex, idx) => (
                  <div key={idx} className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <p className="text-xl font-black text-indigo-700 mb-1">{ex.original}</p>
                    <p className="text-sm font-bold text-indigo-400 mb-3">{ex.translated}</p>
                    <p className="text-xs text-indigo-900/60 leading-relaxed">{ex.explanation}</p>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Quick Check
                </h3>
                <p className="text-lg font-black text-gray-900 mb-6">{activeLesson.quiz.question}</p>
                <div className="grid grid-cols-1 gap-3">
                  {activeLesson.quiz.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setUserAnswer(idx)}
                      className={`p-5 rounded-2xl border-2 text-left font-black uppercase tracking-widest transition-all
                        ${userAnswer === idx 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                          : 'border-gray-100 hover:border-indigo-200 text-gray-600'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {userAnswer !== null && (
                  <button 
                    onClick={handleLessonComplete}
                    className="w-full mt-6 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm pro-shadow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Check Answer <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Promo Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-600 p-10 rounded-[48px] text-white pro-shadow relative overflow-hidden group mb-8"
              >
                <div className="relative z-10">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">NEW FEATURE</span>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4 leading-none">AI Magic Lesson</h2>
                  <p className="text-white/60 font-bold text-sm max-w-sm mb-8">Choose a category below and let our AI build a custom {learningLanguage} lesson just for you.</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Powered by Gemini 1.5</p>
                </div>
                <Sparkles className="absolute -bottom-6 -right-6 w-48 h-48 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
              </motion.div>

              {/* Categories Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => fetchLesson(cat.title)}
                    className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:border-indigo-600 transition-all group"
                  >
                    <div className={`w-16 h-16 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-1">{cat.title}</h3>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Start Learning</p>
                  </motion.div>
                ))}
              </div>

              {/* AI Tutor Card */}
              <motion.div 
                onClick={() => navigate('/ai-chat')}
                whileHover={{ scale: 0.98 }}
                className="bg-[#0A1128] p-10 rounded-[48px] text-white flex flex-col md:flex-row items-center gap-10 cursor-pointer relative overflow-hidden group shadow-2xl"
              >
                <div className="relative z-10 flex-1 text-center md:text-left">
                  <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">AI TUTOR LIVE</span>
                  </div>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Practice With Assistant</h2>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Type anything in {learningLanguage} to get real-time fixes</p>
                  <button className="bg-white text-[#0A1128] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 mx-auto md:mx-0 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-xl">
                    Open Lab Chat <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-40 h-40 bg-white/5 rounded-[40px] flex items-center justify-center relative z-10 border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                   <MessageCircle className="w-20 h-20 opacity-20" />
                </div>
                {/* Decorative background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-transparent pointer-events-none" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default EnglishLab;
