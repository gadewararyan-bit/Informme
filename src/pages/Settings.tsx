import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { MapPin, Globe, Check, ArrowLeft, Loader2, Bell, ShieldCheck, Shield, User as UserIcon, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { ADMIN_EMAILS } from '../constants';
import SeedingTool from '../components/admin/SeedingTool';

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
  const { t, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = !!user?.isAdmin;
  const [areaName, setAreaName] = useState(user?.location?.areaName || '');
  const [pinCode, setPinCode] = useState(user?.location?.pinCode || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [localLanguage, setLocalLanguage] = useState<any>(user?.language || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (user) {
      setAreaName(user.location?.areaName || '');
      setPinCode(user.location?.pinCode || '');
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setLocalLanguage(user.language || 'en');
    }
  }, [user]);

  const handleRequestNotif = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
  };

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
        'location.pinCode': pinCode.trim(),
        language: localLanguage
      });
      setLanguage(localLanguage as any);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Configuration sync error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto p-6 pb-24 bg-[#F8F9FA] min-h-screen">
      <header className="flex items-center gap-6 mb-10 pt-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all pro-shadow border border-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">{t('settings_title')}</h1>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('settings_subtitle')}</p>
        </div>
      </header>



      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity */}
        <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 ring-1 ring-black/[0.02]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center pro-shadow ring-4 ring-indigo-50/50">
              <UserIcon className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Core Identity</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Display Handle</label>
              <input 
                type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 placeholder:text-gray-200"
                required
              />
            </div>

            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Bio Segment</label>
              <textarea 
                value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="Transmission details about yourself..."
                rows={3}
                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 resize-none text-gray-900 placeholder:text-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Geo-Location */}
        <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 ring-1 ring-black/[0.02]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center pro-shadow ring-4 ring-blue-50/50">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Geo Positioning</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Active Node Area</label>
              <input 
                type="text" value={areaName} onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g. South Mumbai"
                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 placeholder:text-gray-200"
              />
            </div>

            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Postal Protocol (PIN)</label>
              <input 
                type="text" value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4000XX"
                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 placeholder:text-gray-200"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
        
        {/* Alerts Protocol */}
        <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 ring-1 ring-black/[0.02]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center pro-shadow ring-4 ring-red-50/50">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Alerts Protocol</h2>
          </div>
          
          <div className="flex items-center justify-between gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1">Push Integration</p>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Real-time network updates</p>
            </div>
            
            {notifPermission === 'granted' ? (
               <div className="flex items-center gap-1.5 text-emerald-600 font-black uppercase text-[10px] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                 <Check className="w-3 h-3" /> Enabled
               </div>
            ) : (
              <button 
                type="button" onClick={handleRequestNotif}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest pro-shadow hover:scale-105 active:scale-95 transition-all"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Security Matrix */}
        <div className="bg-emerald-50/30 p-8 rounded-[40px] border border-emerald-100 ring-4 ring-emerald-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center pro-shadow">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Security Matrix</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Chat Encryption', icon: Shield },
              { label: 'Isolated Node Data', icon: Shield },
              { label: 'Google Auth Secure', icon: Shield }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center pro-shadow">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/60">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Access Section */}
        {isAdmin && (
          <div className="bg-gray-900 p-8 rounded-[40px] pro-shadow relative overflow-hidden group cursor-pointer" onClick={() => navigate('/owner-portal')}>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-emerald-400" />
                 </div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-white">Owner Portal</h2>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Backend Management Terminal</p>
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                Access Node <ArrowLeft className="w-3 h-3 rotate-180" />
              </div>
            </div>
            <Shield className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
          </div>
        )}

        {/* Public Node Address */}
        <div className="bg-white p-6 rounded-[32px] pro-shadow border border-gray-100 text-center">
            <Globe className="w-6 h-6 text-indigo-200 mx-auto mb-4" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Network Entry Point</h3>
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
              <code className="text-[10px] font-bold text-gray-400 overflow-hidden truncate mr-4">{window.location.host}</code>
              <button 
                onClick={() => { navigator.clipboard.writeText(window.location.origin); alert("Link copied!"); }}
                className="text-[9px] font-black uppercase text-indigo-600 hover:scale-105 transition-transform"
              >
                Copy Address
              </button>
            </div>
        </div>

        {/* Language Selection */}
        <div className="bg-white p-8 rounded-[40px] pro-shadow border border-gray-100 ring-1 ring-black/[0.02]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center pro-shadow ring-4 ring-orange-50/50">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Linguistic Framework</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code} type="button" onClick={() => setLocalLanguage(lang.code)}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all ${
                  localLanguage === lang.code 
                    ? 'bg-gray-900 text-white border-gray-900 pro-shadow scale-[1.02]' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-widest mb-1">{lang.name}</span>
                <span className="text-[9px] font-bold opacity-60 uppercase">{lang.native}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={`w-full py-5 rounded-[28px] text-sm font-black uppercase tracking-[0.2em] pro-shadow transition-all ${
            success 
            ? 'bg-emerald-600 text-white shadow-emerald-200' 
            : 'bg-gray-900 text-white hover:scale-[1.02] active:scale-95'
          }`}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : success ? 'Config Updated' : 'Push Changes'}
        </button>
      </form>

      <div className="mt-16 text-center">
        <div className="flex items-center justify-center gap-3 opacity-20 mb-3">
          <div className="h-[1px] w-8 bg-gray-900" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-none">Informer Node</p>
          <div className="h-[1px] w-8 bg-gray-900" />
        </div>
        <p className="text-xl font-black italic uppercase tracking-tighter text-gray-900">InformMe <span className="text-indigo-600">v1.0.1</span></p>
      </div>
    </div>
  );
}
