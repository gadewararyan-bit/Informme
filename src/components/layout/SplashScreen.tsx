import { motion } from 'motion/react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#FDFDFD]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.5, duration: 0.5 }}
      onAnimationComplete={onComplete}
    >
      {/* Decorative colored bars in corners */}
      <div className="absolute top-0 left-0 w-64 h-4 bg-saffron" />
      <div className="absolute top-0 right-0 w-64 h-4 bg-india-green" />
      <div className="absolute bottom-0 left-0 w-64 h-4 bg-india-green" />
      <div className="absolute bottom-0 right-0 w-64 h-4 bg-saffron" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1 
          className="text-7xl sm:text-[120px] leading-[0.8] font-black uppercase tracking-tighter italic"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          inform<span className="text-saffron">m</span><span className="text-india-green">e</span>
        </motion.h1>
        
        <motion.div
          className="mt-8 flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {['HI', 'EN', 'TA', 'BN', 'MR', 'GU'].map((lang, idx) => (
            <span key={lang} className={`text-xs font-black px-2 py-1 border-2 border-black ${idx % 2 === 0 ? 'bg-black text-white' : 'bg-white text-black'}`}>
              {lang}
            </span>
          ))}
        </motion.div>
        
        <motion.p
          className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Connecting India Locally
        </motion.p>
        
        <motion.p
          className="mt-2 text-[10px] font-black text-india-green uppercase tracking-[0.3em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          informme.co.in
        </motion.p>
      </motion.div>
      
      {/* Ashoka Chakra background detail */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
        <div className="w-[800px] h-[800px] border-[10px] border-blue-900 rounded-full border-dashed animate-spin-slow" />
      </div>
    </motion.div>
  );
}
