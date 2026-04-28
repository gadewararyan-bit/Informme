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
        lat: 19.076, // Default to Mumbai lat/long if not provided, can be enhanced with browser geo
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
        setError(`Domain Not Authorized: "${currentDomain}" is not in your Firebase allowed list. To fix this: 
1. Go to Firebase Console 
2. Authentication > Settings > Authorized domains 
3. Click "Add domain" and enter "${currentDomain}"
4. Try logging in again!`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(`Google Sign-In is not enabled. Go to Firebase Console > Authentication > Sign-in method and enable "Google".`);
      } else {
        setError(err.message || "An unexpected error occurred during login.");
      }
    } finally {
      setLoading(false);
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
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="text-6xl sm:text-8xl leading-[0.8] font-black uppercase tracking-tighter italic mb-4">
            inform<span className="text-saffron">m</span><span className="text-india-green">e</span>
          </h1>
          <div className="mt-4 p-2 bg-black text-white text-[10px] font-black uppercase tracking-widest inline-block">
            Connect India Locally
          </div>
        </div>

        <div className="w-full mb-8 space-y-4">
          <div className="bg-white border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
              Enter Your Local Area / City
            </label>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-saffron" />
              <input 
                type="text" 
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g. Bandra, Mumbai or Connaught Place"
                className="flex-1 bg-transparent border-none p-0 text-sm font-black uppercase focus:ring-0 placeholder-gray-300"
              />
            </div>
          </div>
          <p className="text-[9px] font-bold text-gray-400 uppercase italic text-center px-4">
            We use this to show weather and top stories in your region
          </p>
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
            disabled={loading}
            className={`group relative flex items-center justify-center gap-4 w-full bg-white border-4 border-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all brutalist-shadow active:translate-x-[0px] active:translate-y-[0px] active:shadow-none ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:translate-x-[-2px] hover:translate-y-[-2px]'}`}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {loading ? 'Please wait...' : 'Sign in with Google'}
          </button>
          
          <button
            disabled={loading}
            className="flex items-center justify-center gap-4 w-full bg-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-white hover:bg-gray-900 transition-all shadow-[8px_8px_0_0_rgba(255,153,51,0.3)] active:scale-[0.98] disabled:opacity-50"
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
