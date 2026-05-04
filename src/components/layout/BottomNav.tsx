import React from 'react';
import { Home, Calendar, PlusSquare, User, MessageSquare, BookOpen, Tag } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../../contexts/TranslationContext';

import { useAuth } from '../../contexts/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const navItems = user ? [
    { icon: Home, label: t('nav_feed'), path: '/' },
    { icon: Tag, label: 'Deals', path: '/deals' },
    { icon: User, label: t('nav_profile'), path: '/profile' },
    { icon: MessageSquare, label: 'Chat', path: '/ai-chat' },
    { icon: PlusSquare, label: t('nav_share'), path: '/add' },
  ] : [
    { icon: Home, label: t('nav_feed'), path: '/' },
    { icon: Tag, label: 'Deals', path: '/deals' },
    { icon: Calendar, label: t('nav_events'), path: '/events' },
    { icon: User, label: 'Login', path: '/login' },
  ];

  const gridCols = user ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[500px] z-[100]">
      <nav className={`bg-white/80 backdrop-blur-xl border border-white/20 rounded-[32px] p-2 grid ${gridCols} items-center justify-items-center h-20 pro-shadow ring-1 ring-black/[0.05]`}>
        {navItems.map((item, idx) => {
          const isAdd = user && idx === 4;
          const isChat = user && idx === 3;
          const Icon = item.icon;

          if (isAdd) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `relative flex flex-col items-center justify-center w-full h-full group ${
                    isActive ? 'text-blue-600' : 'text-gray-900'
                  }`
                }
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110 active:scale-95">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[7px] font-black uppercase tracking-tight mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          if (isChat) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex flex-col items-center justify-center gap-1 transition-all w-full h-full rounded-2xl ${
                    isActive ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                       <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-tighter text-center">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center gap-1 transition-all w-full h-full rounded-2xl ${
                  isActive ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-tighter text-center">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
