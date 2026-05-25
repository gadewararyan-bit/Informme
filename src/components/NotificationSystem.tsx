import { useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, messaging } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import { differenceInHours, parseISO, isValid } from 'date-fns';

export default function NotificationSystem() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !messaging) return;

    // 1. Request Permission & Setup FCM
    const setupFCM = async () => {
      try {
        if (typeof window !== "undefined" && "Notification" in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            
            // Get token
            const vapidKey = (import.meta as any).env?.VITE_FCM_VAPID_KEY || 'BPrH-vVq6w9_Hw_K6-gXwR_R_Q_P_Z_Y_X_W_V_U_T_S_R_Q_P_O_N_M_L_K_J_I_H_G_F_E_D_C_B_A';
            const isPlaceholder = vapidKey === 'BPrH-vVq6w9_Hw_K6-gXwR_R_Q_P_Z_Y_X_W_V_U_T_S_R_Q_P_O_N_M_L_K_J_I_H_G_F_E_D_C_B_A' || !/^[A-Za-z0-9\-_]{50,}$/.test(vapidKey);

            if (isPlaceholder) {
              console.warn(
                'FCM Info: VAPID key is a placeholder or invalid. Push notifications are disabled. ' +
                'To enable real-time push notifications, configure VITE_FCM_VAPID_KEY with a valid Key Pair ' +
                'from Firebase Console > Project Settings > Cloud Messaging > Web Push Certificates.'
              );
              return;
            }

            const token = await getToken(messaging, { vapidKey });

            if (token) {
              console.log('FCM Token:', token);
              // Save token to user profile
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token)
              });
            }
          }
        }
      } catch (err) {
        console.error('FCM Setup error:', err);
      }
    };

    setupFCM();

    // 2. Handle Foreground Messages
    const unsubFCM = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      if (payload.notification) {
        sendBrowserNotification(
          payload.notification.title || 'New Notification',
          payload.notification.body || ''
        );
      }
    });

    // 3. Setup Listener for User's RSVPs
    const q = query(
      collection(db, 'posts'),
      where('type', '==', 'event'),
      where('eventDetails.rsvps', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      const now = new Date();

      events.forEach(event => {
        if (!event.eventDetails || !event.eventDetails.date) return;
        
        try {
          // Construct full date object from event.date (YYYY-MM-DD) and event.time (HH:mm)
          const datePart = event.eventDetails.date; // e.g. "2026-04-29"
          const timePart = event.eventDetails.time || '00:00'; // e.g. "14:30"
          const eventDateTimeStr = `${datePart}T${timePart}`;
          const eventDate = parseISO(eventDateTimeStr);
          
          if (!isValid(eventDate)) return;

          const hoursUntilEvent = differenceInHours(eventDate, now);
          
          // Logic: If event is roughly 24 hours away (between 23 and 25 hours to catch it)
          if (hoursUntilEvent >= 23 && hoursUntilEvent <= 25) {
            const notifiedKey = `notified_24h_${event.id}_${user.uid}`;
            const alreadyNotified = localStorage.getItem(notifiedKey);
            
            if (!alreadyNotified) {
              sendBrowserNotification(
                "Event Reminder! 🕒",
                `"${event.content.substring(0, 40)}${event.content.length > 40 ? '...' : ''}" is starting in 24 hours at ${event.eventDetails.venue || 'the scheduled location'}.`
              );
              localStorage.setItem(notifiedKey, new Date().toISOString());
            }
          }
        } catch (err) {
          console.error("Error parsing event date for notification:", err);
        }
      });
    }, (error) => {
        console.error("Firestore notification listener error:", error);
    });

    return () => {
      unsubscribe();
      unsubFCM();
    };
  }, [user]);

  const sendBrowserNotification = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const n = new Notification(title, { 
          body, 
          icon: '/favicon.ico',
          tag: 'event-reminder',
          badge: '/favicon.ico'
        });
        
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (err) {
        console.error("Error showing browser notification:", err);
      }
    }
  };

  return null; 
}
