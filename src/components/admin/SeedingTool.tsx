import { useState } from 'react';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, Timestamp, getDoc } from 'firebase/firestore';
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAuth } from '../../contexts/AuthContext';

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

const ENGLISH_TEMPLATES = [
  "ENGLISH TIP of the Day: The word '{word}' means {meaning}. Example: '{example}'",
  "GRAMMAR HACK: Always remember to {rule}. It makes your English sound more natural!",
  "PHRASE OF THE DAY: '{phrase}' is used when you want to {usage}."
];

const ENGLISH_WORDS = [
  { word: "Abundant", meaning: "Existing in large quantities; plentiful", example: "There was abundant food at the party." },
  { word: "Benevolent", meaning: "Well meaning and kindly", example: "The benevolent king was loved by all." },
  { word: "Candid", meaning: "Truthful and straightforward; frank", example: "His candid interview shocked the fans." },
  { word: "Diligent", meaning: "Having or showing care and conscientiousness in one's work", example: "She is a diligent student who always finishes her homework." }
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

const DEAL_TEMPLATES = [
  { title: "Buy 1 Get 1 Free on Burgers", shop: "Food Hub", discount: "BOGO" },
  { title: "Flat 20% off on all Grocery", shop: "Super Mart", discount: "20% OFF" },
  { title: "Summer Sale: 50% discount on clothing", shop: "Fashion Point", discount: "50% OFF" },
  { title: "Free Coffee with any Breakfast", shop: "The Cafe", discount: "FREEBIE" },
  { title: "10% off for Students", shop: "Book World", discount: "10% OFF" },
  { title: "Weekend Special: Flat ₹100 off", shop: "Pizza Paradise", discount: "₹100 OFF" },
  { title: "Mega Electronics Sale", shop: "Digital Zone", discount: "UP TO 40%" },
  { title: "Happy Hours: 25% off on beverages", shop: "Lounge Bar", discount: "25% OFF" },
  { title: "Get free home delivery on orders above ₹200", shop: "Daily Needs", discount: "FREE DELIVERY" },
  { title: "Refer a friend and get ₹50 coupon", shop: "Services App", discount: "₹50 REWARD" }
];

export default function SeedingTool() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('IDLE');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(100);

  const seedDataForCurrentArea = async () => {
    if (!auth.currentUser || !user?.location?.areaName) return;
    const city = user.location.areaName;
    const categories = ['news', 'market', 'alert', 'deal'];
    const countPerCategory = 10;
    const totalToCreate = categories.length * countPerCategory;
    
    setTotal(totalToCreate);
    setStatus('SEEDING');
    setProgress(0);

    const postsToCreate = [];

    categories.forEach(cat => {
      for (let i = 0; i < countPerCategory; i++) {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const randomTime = new Date(thirtyDaysAgo + Math.random() * (Date.now() - thirtyDaysAgo));
        
        if (cat !== 'deal') {
          let post: any = {
            authorId: auth.currentUser!.uid,
            authorName: auth.currentUser!.displayName || 'System Admin',
            authorPhoto: auth.currentUser!.photoURL || '',
            language: user.language || 'en',
            location: {
              areaName: city,
              pinCode: user.location?.pinCode || '400001',
              coordinates: {
                lat: user.location?.lat || 18.9226,
                lng: user.location?.lng || 72.8333
              }
            },
            areaName: city,
            likes: [],
            commentCount: 0,
            reports: [],
            createdAt: Timestamp.fromDate(randomTime)
          };

          if (cat === 'news') {
            post.type = 'news';
            post.content = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)].replace('{city}', city);
          } else if (cat === 'market') {
            post.type = 'market';
            const market = MARKET_TEMPLATES[Math.floor(Math.random() * MARKET_TEMPLATES.length)];
            const finalPrice = (parseFloat(market.price) * (0.95 + Math.random() * 0.1)).toFixed(2);
            post.content = `[PRICE UPDATE] ${market.item} in ${city}: ₹${finalPrice} / ${market.unit}.`;
            post.priceData = {
              item: market.item,
              price: finalPrice,
              unit: market.unit
            };
          } else if (cat === 'alert') {
            post.type = 'alert';
            post.content = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)].replace('{city}', city);
            post.isUrgent = Math.random() > 0.5;
          }
          postsToCreate.push({ collection: 'posts', data: post });
        } else {
          const deal = DEAL_TEMPLATES[Math.floor(Math.random() * DEAL_TEMPLATES.length)];
          const dealData: any = {
            authorId: auth.currentUser!.uid,
            authorName: auth.currentUser!.displayName || 'System Admin',
            title: deal.title,
            offer: deal.discount,
            description: `${deal.title} is now active at ${deal.shop}. Exclusive community discount available!`,
            category: ['food', 'retail', 'services'][Math.floor(Math.random() * 3)],
            businessName: deal.shop,
            location: {
              lat: user?.location?.lat || 18.9226,
              lng: user?.location?.lng || 72.8333,
              areaName: city
            },
            validUntil: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
            createdAt: Timestamp.fromDate(randomTime),
            savedBy: []
          };
          postsToCreate.push({ collection: 'deals', data: dealData });
        }
      }
    });

    const chunkSize = 20;
    try {
      for (let i = 0; i < postsToCreate.length; i += chunkSize) {
        const chunk = postsToCreate.slice(i, i + chunkSize);
        await Promise.all(chunk.map(p => addDoc(collection(db, p.collection), p.data)));
        setProgress(i + chunk.length);
      }
      
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      await updateDoc(userRef, {
        postCount: increment(totalToCreate)
      });

      setStatus('COMPLETED');
    } catch (err) {
      console.error("Seeding error:", err);
      setStatus('ERROR');
    }
  };

  const seedData = async (count: number) => {
    if (!auth.currentUser) return;
    setTotal(count);
    setStatus('SEEDING');
    setProgress(0);

    const postsToCreate = [];
    
    // Generate posts
    for (let i = 0; i < count; i++) {
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
        createdAt: Timestamp.fromDate(randomTime)
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
      } else if (typeRoll < 0.8) {
        post.type = 'alert';
        post.content = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)].replace('{city}', city);
        post.isUrgent = Math.random() > 0.7;
      } else if (typeRoll < 0.9) {
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
      } else {
        post.type = 'news';
        const word = ENGLISH_WORDS[Math.floor(Math.random() * ENGLISH_WORDS.length)];
        post.content = `[ENGLISH LAB] Word of the day: ${word.word}. \nMeaning: ${word.meaning}. \nUsage: "${word.example}"`;
      }

      postsToCreate.push(post);
    }

    const chunkSize = 50;
    try {
      for (let i = 0; i < postsToCreate.length; i += chunkSize) {
        const chunk = postsToCreate.slice(i, i + chunkSize);
        await Promise.all(chunk.map(p => addDoc(collection(db, 'posts'), p)));
        setProgress(i + chunk.length);
      }
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        postCount: increment(count)
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
            <h2 className="text-lg font-black uppercase tracking-tighter">Content Core</h2>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Network Simulation Tool</p>
          </div>
        </div>

        <p className="text-xs font-medium text-indigo-100 mb-8 leading-relaxed max-w-sm">
          Generate <span className="font-black text-white">100+</span> records to prime the local network nodes. 
          Populate the news feed and market indicators instantly.
        </p>

        {status === 'IDLE' && (
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => seedDataForCurrentArea()}
              className="bg-emerald-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 pro-shadow"
            >
              Seed 10 Posts per Section
            </button>
            <button 
              onClick={() => seedData(100)}
              className="bg-white text-indigo-900 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              Sync 100 Random Posts
            </button>
          </div>
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
               <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-tighter mt-0.5">{progress} Posts successfully integrated into the mainnet.</p>
            </div>
            <button 
              onClick={() => setStatus('IDLE')}
              className="ml-auto text-[10px] font-black uppercase underline"
            >
              Seed More
            </button>
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
