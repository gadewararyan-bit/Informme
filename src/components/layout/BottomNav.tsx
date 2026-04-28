import React from 'react';
import { Home, Calendar, PlusSquare, MessageCircle, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: PlusSquare, label: 'Post', path: '/add' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] bg-white border-t-4 border-black grid grid-cols-5 items-center justify-items-center h-16 shadow-[0_-4px_10px_0_rgba(0,0,0,0.1)] z-40 pb-safe">
      {navItems.map((item, idx) => {
        const isMiddle = idx === 2;
        const Icon = item.icon;

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
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black text-white rounded-xl sm:rounded-2xl border-2 border-black flex items-center justify-center brutalist-shadow transition-transform hover:scale-110 active:scale-95 mb-0.5">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[5px] sm:text-[8px] font-black uppercase tracking-tighter text-center">{item.label}</span>
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
                isActive ? 'text-black scale-105' : 'text-gray-400'
              }`
            }
          >
            <div className={`p-1 rounded-xl`}>
              <Icon className={`w-5 h-5`} />
            </div>
            <span className={`text-[6px] sm:text-[8px] font-black uppercase tracking-tighter text-center`}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
