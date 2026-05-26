import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AlertTriangle, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';

// Native Web Audio API Synthesizer (No host assets required, high accuracy & instantaneous feedback)
let audioCtx: AudioContext | null = null;
let sirenInterval: any = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

function playSirenSound() {
  try {
    if (audioCtx) return; // Already playing

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();
    gainNode = audioCtx.createGain();
    
    oscillator = audioCtx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(650, audioCtx.currentTime);

    // Keep volume at extremely balanced/safe level (7% gain)
    gainNode.gain.setValueAtTime(0.07, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();

    // Alternate frequency to simulate exact emergency bleeping siren ("wee-woo")
    let alternate = true;
    sirenInterval = setInterval(() => {
      if (!audioCtx || !oscillator) return;
      const targetFrequency = alternate ? 850 : 550;
      // Smooth frequency gliding transition
      oscillator.frequency.setTargetAtTime(targetFrequency, audioCtx.currentTime, 0.12);
      alternate = !alternate;
    }, 380);
  } catch (err) {
    console.warn("Audio Context setup declined by browser permissions:", err);
  }
}

function stopSirenSound() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  try {
    if (oscillator) {
      oscillator.stop();
      oscillator = null;
    }
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close();
    }
    audioCtx = null;
  } catch (err) {
    console.warn("Error releasing Web Audio context:", err);
  }
}

export default function EmergencyAlert() {
  const navigate = useNavigate();
  const [latestEmergency, setLatestEmergency] = useState<Post | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [alarmEnabled, setAlarmEnabled] = useState(false); // Controlled from Owner portal
  const [audioActive, setAudioActive] = useState(false);

  // Sync Emergency Alert Post
  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('type', '==', 'alert'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        const post = posts.find(p => p.isUrgent);

        if (post) {
          const postTime = post.createdAt?.toDate?.()?.getTime() || Date.now();
          const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
          
          if (postTime > twelveHoursAgo && post.id !== dismissed) {
            setLatestEmergency(post);
          } else {
            setLatestEmergency(null);
          }
        } else {
          setLatestEmergency(null);
        }
      } else {
        setLatestEmergency(null);
      }
    }, (error) => {
      console.error("Emergency Alert Listener Error:", error);
    });

    return () => unsubscribe();
  }, [dismissed]);

  // Sync Owner Portal Safety Alarm Controller Value
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'system_config', 'owner_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.emergencyAlarmEnabled !== undefined) {
          setAlarmEnabled(data.emergencyAlarmEnabled);
        }
      }
    }, (error) => {
      console.warn("System config load failed, using local storage fallback:", error);
    });
    return () => unsubConfig();
  }, []);

  // Control Audio Play / Pause state
  useEffect(() => {
    if (latestEmergency && alarmEnabled) {
      playSirenSound();
      setAudioActive(true);
    } else {
      stopSirenSound();
      setAudioActive(false);
    }

    return () => {
      stopSirenSound();
    };
  }, [latestEmergency, alarmEnabled]);

  if (!latestEmergency) return null;

  const handleSelfMuteToggle = () => {
    if (audioActive) {
      stopSirenSound();
      setAudioActive(false);
    } else {
      playSirenSound();
      setAudioActive(true);
    }
  };

  const handleClose = () => {
    stopSirenSound();
    setAudioActive(false);
    setDismissed(latestEmergency.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-6 left-0 right-0 z-[60] px-6 pointer-events-none"
      >
        <div className="max-w-[450px] mx-auto bg-red-600/95 backdrop-blur-xl rounded-[32px] text-white p-6 pro-shadow border border-white/20 pointer-events-auto relative overflow-hidden group">
          {/* Animated subtle background wave */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="absolute top-0 right-0 bg-white/20 px-4 py-1.5 rounded-bl-[20px] backdrop-blur-md border-l border-b border-white/10 flex items-center gap-1">
            <span className="text-[8px] font-black uppercase tracking-[0.15em]">
              {alarmEnabled ? '🚨 Alarm Enabled' : '🔇 Alarm Silenced'}
            </span>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 pro-shadow">
               <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black uppercase italic text-xs mb-1 tracking-widest text-white/70">
                LOKAL EMERGENCY SECURITY ALERT
              </h4>
              <p className="text-xs font-bold leading-normal line-clamp-3 mb-4 text-white">
                {latestEmergency.content}
              </p>
              
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => {
                    stopSirenSound();
                    setAudioActive(false);
                    navigate(`/post/${latestEmergency.id}`);
                  }}
                  className="flex items-center gap-1.5 bg-white text-red-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider pro-shadow hover:scale-105 active:scale-95 transition-all"
                >
                  View Emergency <ArrowRight className="w-3.5 h-3.5" />
                </button>
                
                {alarmEnabled && (
                  <button
                    type="button"
                    onClick={handleSelfMuteToggle}
                    className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors"
                  >
                    {audioActive ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 animate-bounce text-emerald-300" /> Mute Audio
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-gray-300" /> Unmute Audio
                      </>
                    )}
                  </button>
                )}

                <button 
                  onClick={handleClose}
                  className="text-[9px] font-black uppercase tracking-wider text-white/50 hover:text-white transition-colors py-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
