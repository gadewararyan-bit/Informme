import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Phone, KeyRound, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { User } from '../types';

interface OnboardingModalProps {
  user: User;
  onComplete?: () => void;
}

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showOtpBanner, setShowOtpBanner] = useState(false);

  const checkNameAvailability = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Please enter your name.");
      return false;
    }
    if (trimmed.length < 3) {
      setNameError("Name must be at least 3 characters long.");
      return false;
    }
    
    setIsCheckingName(true);
    setNameError(null);
    setNameSuccess(false);

    const cleanString = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const cleanedTarget = cleanString(trimmed);

    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const exists = querySnapshot.docs.some(docSnap => {
        if (docSnap.id === user.uid) return false;
        const data = docSnap.data();
        const existingName = data.displayName || '';
        return cleanString(existingName) === cleanedTarget;
      });

      if (exists) {
        setNameError("This name is already registered by another user. Please choose a different unique name.");
        return false;
      }

      setNameSuccess(true);
      return true;
    } catch (err) {
      console.error("Error checking name uniqueness:", err);
      setNameError("Connection secure check failed. Please try again.");
      return false;
    } finally {
      setIsCheckingName(false);
    }
  };

  const handleNextStep = async () => {
    const isAvailable = await checkNameAvailability(displayName);
    if (isAvailable) {
      setStep(2);
    }
  };

  const handleSendOtp = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    setTimeout(() => {
      // Simulate OTP generation
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      setOtpSent(true);
      setIsSendingOtp(false);
      setShowOtpBanner(true);
      
      // Auto-hide the simulated SMS push notification after 8 seconds
      setTimeout(() => {
        setShowOtpBanner(false);
      }, 8000);
    }, 1200);
  };

  const handleVerifyOtpAndFinish = async () => {
    if (otpCode !== generatedOtp) {
      setOtpError("Invalid verification code. Please check and try again.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        phoneVerified: true,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString()
      });

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setOtpError("Failed to save changes. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md overflow-y-auto">
      {/* Top Banner Simulation (SMS Alert Box) */}
      <AnimatePresence>
        {showOtpBanner && generatedOtp && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 24, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-sm bg-gray-900 text-white rounded-3xl p-5 pro-shadow border border-gray-800 flex flex-col gap-1 cursor-pointer"
            onClick={() => setShowOtpBanner(false)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3_5 h-3_5" /> Secure SMS Protocol
              </span>
              <span className="text-[9px] font-bold text-gray-500">JUST NOW</span>
            </div>
            <p className="text-xs font-bold leading-relaxed mt-1 text-gray-200">
              Your InformMe verification OTP is <span className="font-black text-white text-sm tracking-widest underline decoration-orange-500 px-1 py-0.5 bg-white/10 rounded">{generatedOtp}</span>. Do not share this secure key with anyone.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-[40px] pro-shadow p-8 border border-gray-100 flex flex-col relative overflow-hidden"
      >
        {/* Progress header */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-3/5 py-1.5 rounded-full">
            Security Verification
          </span>
          <div className="flex gap-1.5">
            <div className={`w-6 h-1.5 rounded-full transition-all ${step === 1 ? 'bg-orange-500 w-10' : 'bg-emerald-100'}`} />
            <div className={`w-6 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-orange-500 w-10' : 'bg-gray-100'}`} />
          </div>
        </div>

        {step === 1 ? (
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight italic text-gray-900 leading-tight mb-2">
              Setup Your handle
            </h1>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight leading-relaxed mb-8">
              Choose your profile handle. This must be completely unique and cannot be cloned by other accounts.
            </p>

            <div className="space-y-6">
              <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-105 focus-within:border-orange-500/40 transition-all">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest pl-0.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400" /> Full Display Name
                </label>
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setNameError(null);
                    setNameSuccess(false);
                  }}
                  placeholder="e.g. Aryan Gadewar"
                  className="w-full bg-transparent border-none p-0 text-sm font-black uppercase focus:ring-0 text-gray-900 placeholder:text-gray-200"
                  required
                />
              </div>

              {isCheckingName && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" /> Check Database Node for Duplicates...
                </div>
              )}

              {nameError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 text-[10px] font-bold uppercase leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{nameError}</span>
                </div>
              )}

              {nameSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 text-emerald-600 text-[10px] font-bold uppercase leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Name verification check passed successfully. Unique Node.</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!displayName.trim() || isCheckingName}
                className="w-full py-5 bg-gray-900 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] pro-shadow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
              >
                Verify & Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight italic text-gray-900 leading-tight mb-2">
              Mobile OTP Protocol
            </h1>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight leading-relaxed mb-8">
              Verify your genuine mobile number using a dynamic secure verification OTP.
            </p>

            <div className="space-y-6">
              <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-105 transition-all">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest pl-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Mobile Coordinates
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-gray-400">+91</span>
                  <input 
                    type="tel"
                    value={phoneNumber}
                    disabled={otpSent}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setOtpError(null);
                    }}
                    placeholder="Enter 10-Digit Mobile"
                    className="flex-1 bg-transparent border-none p-0 text-sm font-black uppercase focus:ring-0 text-gray-900 placeholder:text-gray-200"
                    required
                  />
                </div>
              </div>

              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={phoneNumber.replace(/\D/g, '').length !== 10 || isSendingOtp}
                  className="w-full py-5 bg-gray-950 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] pro-shadow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Dispatching SMS...
                    </>
                  ) : (
                    <>
                      Send Verify Code <KeyRound className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {otpSent && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-105 transition-all">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest pl-0.5 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-gray-400" /> Entering Secure OTP
                    </label>
                    <input 
                      type="text"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setOtpError(null);
                      }}
                      placeholder="ENTER 6-DIGIT OTP"
                      inputMode="numeric"
                      className="w-full bg-transparent border-none p-0 text-base font-black tracking-[0.3em] text-center focus:ring-0 text-gray-900 placeholder:text-gray-200"
                    />
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-emerald-600 uppercase">OTP SENT TO +91 {phoneNumber}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }} 
                      className="text-[9px] font-black text-gray-400 hover:text-orange-500 uppercase tracking-wider"
                    >
                      Change Number
                    </button>
                  </div>

                  {otpError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 text-[10px] font-bold uppercase leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerifyOtpAndFinish}
                    disabled={otpCode.length !== 6 || isVerifyingOtp}
                    className="w-full py-5 bg-orange-500 text-white rounded-3xl text-xs font-black uppercase tracking-[0.16em] pro-shadow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying Node OTP...
                      </>
                    ) : (
                      <>
                        Authorize & Complete Verified Access
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
