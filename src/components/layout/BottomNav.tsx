import React from 'react';
import { Home, Calendar, PlusSquare, MessageCircle, User, Bot, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { icon: <Home />, label: 'Home', path: '/' },
    { icon: <Calendar />, label: 'Events', path: '/events' },
    { icon: <PlusSquare />, label: 'Post', path: '/add' },
    { icon: <Sparkles />, label: 'AI', path: '/ai-chat' },
    { icon: <MessageCircle />, label: 'Chat', path: '/chat' },
    { icon: <User />, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black grid grid-cols-6 items-center justify-items-center py-2 px-1 shadow-[0_-4px_10px_0_rgba(0,0,0,0.1)] z-40 pb-safe">
      {navItems.map((item, idx) => {
        const isMiddle = idx === 2;
        const isAI = idx === 3;

        if (isMiddle) {
          return (
            <div key={item.path} className="relative flex flex-col items-center">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex flex-col items-center gap-0.5 transition-all ${
                    isActive ? 'text-saffron' : 'text-black'
                  }`
                }
              >
                <div className="w-12 h-12 bg-black text-white rounded-2xl border-2 border-black flex items-center justify-center brutalist-shadow transition-transform hover:scale-110 active:scale-95 mb-0.5">
                  <PlusSquare className="w-6 h-6" />
                </div>
                <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-tighter text-center">{item.label}</span>
              </NavLink>
            </div>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center gap-0.5 transition-all w-full py-1 ${
                isActive ? 'text-black scale-110' : 'text-gray-400'
              }`
            }
          >
            <div className={`p-1 rounded-xl ${isAI ? (item.path === window.location.pathname ? 'bg-purple-100' : 'bg-purple-50') : ''}`}>
              {React.cloneElement(item.icon as React.ReactElement, { 
                className: `w-5 h-5 sm:w-6 sm:h-6 ${isAI ? 'text-purple-600' : ''}` 
              })}
            </div>
            <span className={`text-[6px] sm:text-[8px] font-black uppercase tracking-tighter text-center ${isAI ? 'text-purple-600' : ''}`}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
