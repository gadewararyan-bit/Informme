import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TranslationProvider } from './contexts/TranslationContext';
import SplashScreen from './components/layout/SplashScreen';
import BottomNav from './components/layout/BottomNav';
import EmergencyAlert from './components/EmergencyAlert';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PlatformPulse from './pages/PlatformPulse';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Login from './pages/Login';
import PostDetails from './pages/PostDetails';
import CreatePost from './pages/CreatePost';
import Events from './pages/Events';
import Health from './pages/Health';
import OwnerPortal from './pages/OwnerPortal';
import AIChat from './pages/AIChat';
import EnglishLab from './pages/EnglishLab';
import LocalDeals from './pages/LocalDeals';
import PostDeal from './pages/PostDeal';
import SectionView from './pages/SectionView';
import Pricing from './pages/Pricing';
import NotificationSystem from './components/NotificationSystem';
import AdminFooter from './components/layout/AdminFooter';

import { ADMIN_EMAILS, APP_CONFIG } from './constants';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Splash screen timer
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 max-w-full md:max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg 2xl:max-w-screen-xl mx-auto relative overflow-x-hidden shadow-2xl bg-white">
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[500px] bg-red-600 text-white text-center py-2 text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            SYNCHRONIZING NETWORK
          </motion.div>
        )}
      </AnimatePresence>
      {user && <EmergencyAlert />}
      {user && <NotificationSystem />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Home /> : <Home />} />
        <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/owner-portal" element={(user && (user.isAdmin || (user.email && ADMIN_EMAILS.includes(user.email.trim().toLowerCase())) || (user.displayName && user.displayName.toLowerCase().trim() === 'aryan gadewar'))) ? <OwnerPortal /> : <Navigate to="/" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/add" element={user ? <CreatePost /> : <Navigate to="/login" />} />
        <Route path="/post/:id" element={<PostDetails />} />
        <Route path="/health" element={user ? <Health /> : <Navigate to="/login" />} />
        <Route path="/ai-chat" element={user ? <AIChat /> : <Navigate to="/login" />} />
        <Route path="/learn" element={user ? <EnglishLab /> : <Navigate to="/login" />} />
        <Route path="/deals" element={user ? <LocalDeals /> : <Navigate to="/login" />} />
        <Route path="/post-deal" element={user ? <PostDeal /> : <Navigate to="/login" />} />
        <Route path="/section/:type" element={user ? <SectionView /> : <Navigate to="/login" />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <footer className="py-12 px-4 text-center mt-auto w-full border-t border-gray-50 bg-gray-50/50">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          INFORM ME &bull; {APP_CONFIG.year}
        </p>
        <div className="h-4" /> {/* 2-line spacing */}
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
          Created &amp; Owned by Aryan Gadewar
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TranslationProvider>
          <AppContent />
        </TranslationProvider>
      </AuthProvider>
    </Router>
  );
}
