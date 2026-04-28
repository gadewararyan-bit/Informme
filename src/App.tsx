import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SplashScreen from './components/layout/SplashScreen';
import BottomNav from './components/layout/BottomNav';
import EmergencyAlert from './components/EmergencyAlert';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Login from './pages/Login';
import PostDetails from './pages/PostDetails';
import CreatePost from './pages/CreatePost';
import Events from './pages/Events';
import Health from './pages/Health';
import AIChat from './pages/AIChat';

import { ADMIN_EMAIL } from './constants';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {user && <EmergencyAlert />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/explore"
          element={user ? <Explore /> : <Navigate to="/login" />}
        />
        <Route
          path="/events"
          element={user ? <Events /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user && user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? <AdminDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat"
          element={user ? <Chat /> : <Navigate to="/login" />}
        />
        <Route
          path="/add"
          element={user ? <CreatePost /> : <Navigate to="/login" />}
        />
        <Route
          path="/post/:id"
          element={user ? <PostDetails /> : <Navigate to="/login" />}
        />
        <Route
          path="/health"
          element={user ? <Health /> : <Navigate to="/login" />}
        />
        <Route
          path="/ai-chat"
          element={user ? <AIChat /> : <Navigate to="/login" />}
        />
      </Routes>
      {user && <BottomNav />}
      <footer className="py-12 px-4 pb-32 text-center bg-gray-100 border-t-4 border-black mt-auto">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
          Founded and developed by <span className="text-black">Aryan</span>
        </p>
        <a 
          href="https://informme.co.in" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-india-green font-black text-sm uppercase tracking-widest hover:underline block mb-4"
        >
          informme.co.in
        </a>
        <p className="text-[10px] font-bold text-gray-400 uppercase">© 2024 India Informer. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
