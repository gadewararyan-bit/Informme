import React, { useState } from 'react';
import { MapPin, ChevronRight, X, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeLocation } from '../../lib/locationUtils';

const commonCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];

export default function LocationPicker() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCityChange = async (city: string) => {
    if (!user) return;
    try {
      const normalizedCity = normalizeLocation(city);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'location.areaName': normalizedCity
      });
      setIsOpen(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Error updating city:', err);
    }
  };

  const filteredCities = searchQuery 
    ? [...commonCities].filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    : commonCities;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl pro-shadow hover:border-blue-200 transition-all active:scale-95"
      >
        <MapPin className="w-4 h-4 text-india-green" />
        <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">
          {user?.location?.areaName || 'Detecting...'}
        </span>
        <ChevronRight className={`w-4 h-4 text-blue-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/5" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-3 w-72 bg-white rounded-[32px] pro-shadow border border-gray-100 p-5 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Change Area</h4>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-50 rounded-lg text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative mb-4 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:ring-2 ring-blue-100 outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery) {
                      handleCityChange(searchQuery);
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                {filteredCities.map(city => (
                  <button
                    key={city}
                    onClick={() => handleCityChange(city)}
                    className="text-[10px] text-left hover:bg-blue-50 hover:text-blue-600 p-2.5 rounded-xl font-bold text-gray-600 truncate transition-all border border-transparent hover:border-blue-100"
                  >
                    {city}
                  </button>
                ))}
                {searchQuery && !commonCities.includes(searchQuery) && (
                  <button
                    onClick={() => handleCityChange(searchQuery)}
                    className="col-span-2 text-[10px] text-left bg-blue-50 text-blue-600 p-2.5 rounded-xl font-black truncate border border-blue-100 flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3" />
                    Use "{searchQuery}"
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
