import { useState } from 'react';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
  'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad',
  'Mysore', 'Tiruchirappalli', 'Bareilly', 'Aligarh', 'Moradabad', 'Jalandhar', 'Bhubaneswar', 'Salem', 'Warangal', 'Guntur'
];

const NEWS_TEMPLATES = [
  "New metro line construction approved for {city} central corridor. Work starts next month.",
  "Local community garden initiative starts in {city} next week to improve urban green space.",
  "Public library in {city} to undergo major renovation this month with digital reading zones.",
  "{city} municipal corporation announces new waste management policy for smart segregation.",
  "Tech conference for local developers scheduled in {city} next month at the Tech Park.",
  "New heritage walk route launched in {city} for history buffs focusing on colonial architecture.",
  "Major hospital in {city} to open specialized oncology wing with state-of-the-art equipment.",
  "{city} sports complex to host national level swimming competition with 500+ participants.",
  "Sustainable living workshop organized by local NGO in {city} to promote zero-waste.",
  "New startup incubator launched in {city} to boost local entrepreneurs in the food-tech sector.",
  "Massive plantation drive scheduled for {city} outskirts this Sunday morning.",
  "{city} Traffic Police implements new AI-based signal control for smoother commutes.",
  "Traditional handicraft exhibition opens in {city} today, showcasing local artisans.",
  "New solar farm project in {city} to provide clean energy to 10,000 households.",
  "{city} Education Department announces scholarship program for talented local students."
];

const MARKET_TEMPLATES = [
  { item: 'Gold (24K)', price: '6250', unit: '1g' },
  { item: 'Petrol', price: '106.3', unit: 'Liter' },
  { item: 'Diesel', price: '94.2', unit: 'Liter' },
  { item: 'Onion', price: '45', unit: 'kg' },
  { item: 'Tomato', price: '30', unit: 'kg' },
  { item: 'Rice (Basmati)', price: '130', unit: 'kg' },
  { item: 'Milk', price: '68', unit: 'Liter' },
  { item: 'LPG Cylinder', price: '903', unit: '14.2kg' },
  { item: 'Atta (Wheat)', price: '42', unit: 'kg' },
  { item: 'Sugar', price: '44', unit: 'kg' },
  { item: 'Cooking Oil', price: '155', unit: 'Liter' },
  { item: 'Potato', price: '25', unit: 'kg' },
  { item: 'Moong Dal', price: '115', unit: 'kg' },
  { item: 'Garlic', price: '220', unit: 'kg' },
  { item: 'Ginger', price: '180', unit: 'kg' }
];

const ALERT_TEMPLATES = [
  "Moderate rainfall expected in {city} over the next 24 hours. Carry an umbrella.",
  "Scheduled power maintenance in {city} western areas from 10 AM to 2 PM this Saturday.",
  "Traffic diversion in {city} main square due to local event processing. Use detours.",
  "AQI levels in {city} reported to be in the moderate category today. Minimal risk.",
  "Water supply maintenance in {city} south zone on Wednesday. Store water early.",
  "Public transit strike called in {city} for tomorrow. Expect heavy congestion.",
  "Heatwave warning issued for {city}. Stay hydrated and avoid outdoor activities.",
  "Heavy fog reported in {city} outskirts. Drive with caution and low beam.",
  "Unscheduled maintenance work on {city} flyover. Use alternative routes.",
  "Essential commodities supply normalized in {city} markets after brief disruption."
];

const EVENT_TEMPLATES = [
  { title: "Local Food Festival", venue: "Public Grounds", time: "5 PM onwards" },
  { title: "Education Fair 2024", venue: "Convention Hall", time: "10 AM - 6 PM" },
  { title: "Blood Donation Drive", venue: "Community Centre", time: "9 AM - 4 PM" },
  { title: "Yoga Workshop", venue: "City Park", time: "6 AM - 8 AM" },
  { title: "Live Music Night", venue: "The Hub", time: "8 PM onwards" },
  { title: "Job Mela", venue: "Industrial Estate", time: "10 AM - 5 PM" },
  { title: "Farmers Market", venue: "Station Road", time: "7 AM - 12 PM" },
  { title: "Classical Dance Recital", venue: "Town Hall", time: "6 PM onwards" },
  { title: "Startup Pitch Event", venue: "Co-working Hub", time: "4 PM - 7 PM" },
  { title: "Chess Tournament", venue: "Youth Club", time: "9 AM onwards" }
];

export default function SeedingTool() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>('IDLE');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(500);

  const seedData = async () => {
    if (!auth.currentUser) return;
    setStatus('SEEDING');
    setProgress(0);

    const postsToCreate = [];
    
    // Generate 500 posts
    for (let i = 0; i < total; i++) {
      const city = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
      const typeRoll = Math.random();
      
      // Randomly stagger the creation time over the last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const randomTime = new Date(thirtyDaysAgo + Math.random() * (Date.now() - thirtyDaysAgo));
      
      let post: any = {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'System Admin',
        authorPhoto: auth.currentUser.photoURL || '',
        language: 'en',
        location: {
          areaName: city,
          pinCode: (100000 + Math.floor(Math.random() * 800000)).toString(),
          coordinates: { lat: 20 + Math.random() * 5, lng: 78 + Math.random() * 5 }
        },
        likes: [],
        commentCount: 0,
        reports: [],
        createdAt: Timestamp.fromDate(randomTime) // Use the staggered date
      };

      if (typeRoll < 0.4) {
        post.type = 'news';
        post.content = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)].replace('{city}', city);
      } else if (typeRoll < 0.7) {
        post.type = 'market';
        const market = MARKET_TEMPLATES[Math.floor(Math.random() * MARKET_TEMPLATES.length)];
        const finalPrice = (parseFloat(market.price) * (0.95 + Math.random() * 0.1)).toFixed(2);
        post.content = `[MARKET WATCH] Current rate for ${market.item} in ${city}: ₹${finalPrice} / ${market.unit}. Prices showing ${Math.random() > 0.5 ? 'upward' : 'stable'} trend.`;
        post.priceData = {
          item: market.item,
          price: finalPrice,
          unit: market.unit
        };
      } else if (typeRoll < 0.9) {
        post.type = 'alert';
        post.content = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)].replace('{city}', city);
        post.isUrgent = Math.random() > 0.7;
      } else {
        post.type = 'event';
        const event = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
        post.content = `${event.title} in ${city}! Join us at ${event.venue} - ${event.time}. All community members welcome.`;
        post.eventDetails = {
          title: event.title,
          date: 'Upcoming',
          time: event.time,
          venue: `${event.venue}, ${city}`,
          rsvps: []
        };
      }

      postsToCreate.push(post);
    }

    // Upload in chunks of 50 to avoid overwhelm and handle the 500 total
    const chunkSize = 50;
    try {
      for (let i = 0; i < postsToCreate.length; i += chunkSize) {
        const chunk = postsToCreate.slice(i, i + chunkSize);
        // Batch upload
        await Promise.all(chunk.map(p => addDoc(collection(db, 'posts'), p)));
        setProgress(i + chunk.length);
      }
      
      // Update user post count
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        postCount: increment(total)
      });

      setStatus('COMPLETED');
    } catch (err) {
      console.error("Seeding error:", err);
      setStatus('ERROR');
    }
  };

  return (
    <div className="bg-indigo-900 text-white p-8 rounded-[40px] pro-shadow border border-indigo-500/20 mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Database className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter">{t('growth_seeder')}</h2>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Admin Authorization Required</p>
          </div>
        </div>

        <p className="text-xs font-medium text-indigo-100 mb-8 leading-relaxed max-w-sm">
          Injecting <span className="font-black text-white">{total}</span> authenticated data points across the Indian network nodes. 
          This will populate news, market rates, alerts, and events globally.
        </p>

        {status === 'IDLE' && (
          <button 
            onClick={seedData}
            className="bg-white text-indigo-900 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {t('execute_seeding')}
          </button>
        )}

        {status === 'SEEDING' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span>Synchronizing Packets...</span>
              <span>{Math.round((progress/total)*100)}%</span>
            </div>
            <div className="h-2 bg-indigo-950 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-indigo-400 transition-all duration-300" 
                 style={{ width: `${(progress/total)*100}%` }}
               />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-300">
               <Loader2 className="w-3 h-3 animate-spin" />
               Processed: {progress} / {total}
            </div>
          </div>
        )}

        {status === 'COMPLETED' && (
          <div className="flex items-center gap-3 bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
               <p className="text-xs font-black uppercase tracking-widest">Network Primed</p>
               <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-tighter mt-0.5">{total} Nodes successfully integrated into the mainnet.</p>
            </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="flex items-center gap-3 bg-red-500/20 p-4 rounded-2xl border border-red-500/30">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
               <p className="text-xs font-black uppercase tracking-widest">Sync Failure</p>
               <p className="text-[10px] font-bold text-red-300/80 uppercase tracking-tighter mt-0.5">Permission disruption detected. Verify Admin token status.</p>
            </div>
            <button 
              onClick={() => setStatus('IDLE')}
              className="ml-auto text-[10px] font-black uppercase underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
