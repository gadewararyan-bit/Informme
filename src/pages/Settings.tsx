import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { MapPin, Globe, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
];

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [areaName, setAreaName] = useState(user?.location?.areaName || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setAreaName(user.location?.areaName || '');
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setLanguage(user.language || 'en');
    }
  }, [user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        'location.areaName': areaName.trim(),
        language
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-10 pb-24">
      <header className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white border-4 border-black rounded-xl hover:translate-y-[-2px] transition-all brutalist-shadow active:shadow-none"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter">Settings</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Info */}
        <div className="bg-white border-4 border-black p-6 rounded-3xl brutalist-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500 rounded-lg border-2 border-black">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">Profile Info</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Display Name
              </label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-gray-50 border-4 border-black rounded-2xl p-4 text-sm font-bold focus:ring-0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">
                About You (Bio)
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a bit about yourself..."
                rows={3}
                className="w-full bg-gray-50 border-4 border-black rounded-2xl p-4 text-sm font-bold focus:ring-0 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white border-4 border-black p-6 rounded-3xl brutalist-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-saffron rounded-lg border-2 border-black">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">Your Location</h2>
          </div>
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">
              Area or City Name
            </label>
            <input 
              type="text" 
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="e.g. Bandra, Mumbai"
              className="w-full bg-gray-50 border-4 border-black rounded-2xl p-4 text-sm font-bold focus:ring-0"
            />
            <p className="text-[10px] font-bold text-gray-400 italic">
              Weather and local news will be updated based on this location.
            </p>
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-white border-4 border-black p-6 rounded-3xl brutalist-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-india-green rounded-lg border-2 border-black">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">Preferred Language</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all ${
                  language === lang.code 
                    ? 'bg-black text-white border-black scale-[0.98]' 
                    : 'bg-white border-gray-100 hover:border-black'
                }`}
              >
                <span className="text-sm font-black uppercase tracking-widest">{lang.name}</span>
                <span className="text-[10px] opacity-60 mt-1 font-bold">{lang.native}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={`w-full py-5 rounded-2xl text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all brutalist-shadow active:shadow-none hover:translate-y-[-4px] active:translate-y-[0px] ${
            success 
            ? 'bg-india-green text-white border-4 border-black' 
            : 'bg-[#FF9933] text-white border-4 border-black'
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : success ? (
            <>
              <Check className="w-6 h-6" />
              Settings Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>

      <div className="mt-12 p-6 bg-black text-white rounded-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Developed for India</p>
        <p className="text-xl font-black italic uppercase tracking-tighter">inform<span className="text-saffron">m</span><span className="text-india-green">e</span> v1.0.0</p>
      </div>
    </div>
  );
}
