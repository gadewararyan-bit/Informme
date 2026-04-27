import { Home, Calendar, PlusSquare, MessageCircle, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { icon: <Home className="w-7 h-7" />, label: 'Home', path: '/' },
    { icon: <Calendar className="w-7 h-7" />, label: 'Events', path: '/events' },
    { icon: <PlusSquare className="w-7 h-7" />, label: 'Add', path: '/add' },
    { icon: <MessageCircle className="w-7 h-7" />, label: 'Chat', path: '/chat' },
    { icon: <User className="w-7 h-7" />, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black flex justify-around items-center py-4 px-4 shadow-[0_-4px_0_0_rgba(0,0,0,0.05)] z-40 pb-safe">
      <div className="absolute left-1/2 -translate-x-1/2 -top-10 sm:hidden">
        <NavLink to="/add">
          <button className="w-20 h-20 bg-saffron rounded-full border-4 border-black flex items-center justify-center text-3xl shadow-xl active:scale-95 transition-transform">
            <PlusSquare className="w-10 h-10 text-black" />
          </button>
        </NavLink>
      </div>

      {navItems.map((item, idx) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            `flex flex-col items-center gap-1.5 transition-all ${
              idx === 2 ? 'sm:flex hidden' : ''
            } ${
              isActive ? 'text-black scale-110' : 'text-gray-400 hover:text-black'
            }`
          }
        >
          <span>{item.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
