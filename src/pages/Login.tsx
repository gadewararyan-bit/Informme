import { useState } from 'react';
import { motion } from 'motion/react';
import { Info, Mail, AlertCircle } from 'lucide-react';
import { signInWithPopup, googleProvider, auth } from '../services/firebase';

export default function Login() {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setError(`Unauthorized Domain. Please add "${currentDomain}" to your Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(`Google Sign-In is not enabled. Go to Firebase Console > Authentication > Sign-in method and enable "Google".`);
      } else {
        setError(err.message || "An unexpected error occurred during login.");
      }
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-[#FDFDFD]">
      {/* Decorative colored bars in corners like the design */}
      <div className="absolute top-0 left-0 w-32 h-2 bg-saffron" />
      <div className="absolute top-0 right-0 w-32 h-2 bg-india-green" />

      <motion.div 
        className="w-full max-w-sm flex flex-col items-center z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex flex-col items-center mb-12 text-center">
          <h1 className="text-7xl sm:text-[100px] leading-[0.8] font-black uppercase tracking-tighter italic mb-4">
            inform<span className="text-saffron">m</span><span className="text-india-green">e</span>
          </h1>
          <div className="mt-4 p-2 bg-black text-white text-[10px] font-black uppercase tracking-widest inline-block">
            Connect India Locally
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mb-6 p-4 bg-red-50 border-4 border-red-600 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-600 uppercase leading-tight tracking-tight">
              {error}
            </p>
          </motion.div>
        )}

        <div className="w-full space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="group relative flex items-center justify-center gap-4 w-full bg-white border-4 border-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all brutalist-shadow active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Sign in with Google
          </button>
          
          <button
            className="flex items-center justify-center gap-4 w-full bg-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-white hover:bg-gray-900 transition-all shadow-[8px_8px_0_0_rgba(255,153,51,0.3)] active:scale-[0.98]"
          >
            <Mail className="w-5 h-5" />
            Continue with Email
          </button>
        </div>

        <p className="text-center text-[10px] font-black uppercase text-gray-400 mt-12 tracking-widest leading-relaxed">
          Select choice / Enter community / <br />
          Experience local news instantly
        </p>
      </motion.div>
      
      {/* Subtle Ashoka Chakra in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-5">
        <div className="w-[600px] h-[600px] border-4 border-blue-900 rounded-full border-dashed animate-spin-slow" />
      </div>
    </div>
  );
}
