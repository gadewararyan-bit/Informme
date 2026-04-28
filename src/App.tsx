import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SplashScreen from './components/layout/SplashScreen';
import BottomNav from './components/layout/BottomNav';
import EmergencyAlert from './components/EmergencyAlert';
import Home from './pages/Home';
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
import NotificationSystem from './components/NotificationSystem';

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
    <div className="min-h-screen bg-gray-50 pb-20 max-w-[500px] mx-auto shadow-2xl relative overflow-x-hidden">
      {user && <EmergencyAlert />}
      {user && <NotificationSystem />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/login" />}
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
      <footer className="py-6 px-4 pb-28 text-center border-t-2 border-dashed border-gray-200 mt-auto w-full">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
          Founded and developed by <span className="text-black">Aryan</span>
        </p>
        <div className="flex items-center justify-center gap-4">
          <a 
            href="https://informme.co.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-india-green font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            informme.co.in
          </a>
          <p className="text-[9px] font-bold text-gray-300 uppercase">© 2024 India Informer. All Rights Reserved.</p>
        </div>
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
