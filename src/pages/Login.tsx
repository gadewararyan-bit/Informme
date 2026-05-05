import { useState } from 'react';
import { motion } from 'motion/react';
import { Info, Mail, AlertCircle, MapPin } from 'lucide-react';
import { signInWithPopup, googleProvider, auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [areaName, setAreaName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!areaName.trim()) {
      setError("Please enter your local area name first to see relevant news and weather.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      const locationData = {
        areaName: areaName.trim(),
        lat: 19.076, 
        lng: 72.877
      };

      if (!userDoc.exists()) {
        const newUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || '',
          createdAt: new Date().toISOString(),
          location: locationData,
          language: 'en'
        };
        await setDoc(userRef, newUser);
      } else {
        await updateDoc(userRef, {
          location: locationData
        });
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setError(`Domain Not Authorized: "${currentDomain}" is not in your Firebase allowed list.`);
      } else {
        setError(err.message || "An unexpected error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-8 overflow-hidden bg-white">
      {/* Dynamic Background Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-50/50 rounded-full blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-50/50 rounded-full blur-[100px]" />

      <motion.div 
        className="w-full max-w-sm flex flex-col items-center z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="relative mb-8">
            <h1 className="text-7xl sm:text-8xl leading-none font-black uppercase tracking-tighter italic text-gray-900">
              inform<span className="text-orange-500">m</span><span className="text-emerald-600">e</span>
            </h1>
            <div className="absolute -bottom-4 right-0 flex gap-1">
              <div className="w-6 h-1 bg-orange-500 rounded-full" />
              <div className="w-6 h-1 bg-white border border-gray-100 rounded-full" />
              <div className="w-6 h-1 bg-emerald-600 rounded-full" />
            </div>
          </div>
          <div className="px-5 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full pro-shadow inline-block">
            Live Version v1.0.1
          </div>
        </div>

        <div className="w-full mb-10 space-y-4">
          <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 focus-within:ring-4 focus-within:ring-orange-500/5 transition-all">
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest pl-1">
              Your Location
            </label>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center pro-shadow shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="Enter Area / City"
                className="flex-1 bg-transparent border-none p-0 text-sm font-black uppercase focus:ring-0 placeholder-gray-200 text-gray-900"
              />
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-center px-8 leading-relaxed">
            Enter your area name to see local news and updates.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mb-8 p-6 bg-red-50 rounded-[32px] flex items-center gap-4 border border-red-100 pro-shadow"
          >
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <p className="text-[10px] font-black text-red-600 uppercase leading-relaxed tracking-tight">
              {error}
            </p>
          </motion.div>
        )}

        <div className="w-full space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative flex items-center justify-center gap-4 w-full bg-white border border-gray-100 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs text-gray-900 pro-shadow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {loading ? 'Logging in...' : 'Sign in with Google'}
          </button>
          
          <button
            disabled={loading}
            className="flex items-center justify-center gap-4 w-full bg-gray-900 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs text-white hover:scale-[1.02] active:scale-95 transition-all pro-shadow disabled:opacity-20"
          >
            <Mail className="w-5 h-5" />
            Sign in with Email
          </button>
        </div>

        <div className="mt-16 text-center space-y-4">
           <div className="flex items-center justify-center gap-3 opacity-10">
              <div className="w-8 h-[1px] bg-gray-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              <div className="w-8 h-[1px] bg-gray-900" />
           </div>
           <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.4em] leading-relaxed max-w-[200px] mx-auto">
            India's Local Community <br /> Network
          </p>
        </div>
      </motion.div>
      
      {/* Professional subtle pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10" 
           style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
    </div>
  );
}
