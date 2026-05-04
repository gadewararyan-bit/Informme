import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, HelpCircle, MessageCircle, Star, SpellCheck, Volume2, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EnglishLab: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

  const categories = [
    { id: 'daily', title: 'Daily Phrases', icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'vocabulary', title: 'Power Words', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'grammar', title: 'Grammar Hacks', icon: SpellCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'pronunciation', title: 'Speak Clear', icon: Volume2, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  const wordOfTheDay = {
    word: "Resilient",
    phonetic: "/rɪˈzɪl.jənt/",
    meaning: "Able to withstand or recover quickly from difficult conditions.",
    example: "She is a resilient woman who never gives up."
  };

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32">
      <header className="bg-white p-8 pt-12 pb-12 border-b border-gray-100 pro-shadow relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center pro-shadow ring-4 ring-indigo-600/10">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">English Lab</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Language Masterclass for Everyone</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl max-w-sm">
            {levels.map((level) => (
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
        {/* Word of the Day */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[40px] pro-shadow border border-indigo-100 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Word of the Day</span>
             </div>
             <button className="text-gray-300 hover:text-indigo-600 transition-colors">
                <Volume2 className="w-5 h-5" />
             </button>
          </div>
          
          <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{wordOfTheDay.word}</h2>
          <p className="font-mono text-gray-400 text-sm mb-6">{wordOfTheDay.phonetic}</p>
          
          <div className="space-y-4 prose prose-indigo max-w-none">
            <p className="text-lg text-gray-600 font-medium leading-relaxed italic">
              "{wordOfTheDay.meaning}"
            </p>
            <div className="p-4 bg-gray-50 rounded-2xl border-l-4 border-indigo-600">
               <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">Example</span>
               <p className="text-sm font-bold text-gray-700">"{wordOfTheDay.example}"</p>
            </div>
          </div>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:border-indigo-200 transition-all group"
            >
              <div className={`w-12 h-12 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900">{cat.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* AI Tutor Card */}
        <motion.div 
          onClick={() => navigate('/ai-chat')}
          whileHover={{ scale: 0.98 }}
          className="bg-gray-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center gap-8 cursor-pointer relative overflow-hidden group"
        >
          <div className="relative z-10 flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Practice with AI Tutor</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-6">Real-time corrections & deep learning</p>
            <button className="bg-white text-gray-900 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mx-auto md:mx-0 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              Start Conversation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-32 h-32 bg-white/10 rounded-[32px] flex items-center justify-center relative z-10">
             <HelpCircle className="w-16 h-16 opacity-20" />
          </div>
          {/* Decorative background circle */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent pointer-none" />
        </motion.div>

        {/* Level Based Lessons */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Current {selectedLevel} Focus</h3>
           </div>
           
           {[1, 2, 3].map((lesson) => (
             <div key={lesson} className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {lesson}
                   </div>
                   <div>
                      <h4 className="font-black text-gray-900 uppercase tracking-tight">Lesson {lesson}: {selectedLevel === 'Beginner' ? 'Greeting Basics' : selectedLevel === 'Intermediate' ? 'Business Idioms' : 'Abstract Nuance'}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Estimated 5 Minutes</p>
                   </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-200 group-hover:text-indigo-600 transition-colors" />
             </div>
           ))}
        </div>
      </main>
    </div>
  );
};

export default EnglishLab;
