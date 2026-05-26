export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  language?: string;
  bio?: string;
  postCount?: number;
  earnings?: number;
  points?: number;
  isAdmin?: boolean;
  location?: {
    lat: number;
    lng: number;
    areaName: string;
    pinCode?: string;
  };
  fcmTokens?: string[];
  createdAt?: any;
  updatedAt?: any;
  isPremium?: boolean;
  subscriptionPlan?: 'basic' | 'pro' | 'enterprise';
  subscriptionEndDate?: string;
  walletBalance?: number;
  engagementPoints?: number;
  referralCode?: string;
  referredBy?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  type: 'general' | 'news' | 'event' | 'weather' | 'alert' | 'market';
  language: string;
  priceData?: {
    item: string;
    price: string;
    unit: string;
  };
  location?: {
    lat: number;
    lng: number;
    areaName: string;
    pinCode?: string;
    locationType?: 'home' | 'work' | 'public' | 'market' | 'other';
  };
  likes: string[];
  reports?: string[];
  commentCount: number;
  createdAt: any;
  // Event specific
  eventDetails?: {
    date: string;
    time: string;
    venue: string;
    rsvps: string[]; // Array of user UIDs
  };
  // Alert specific
  isUrgent?: boolean;
  // Sponsored specific
  isSponsored?: boolean;
  paymentTxId?: string;
  paymentStatus?: 'pending' | 'verified' | 'failed';
  campaignDurationDays?: number;
  expiresAt?: any;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  likes: string[];
  createdAt: any;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  createdAt: any;
  read: boolean;
}

export interface Deal {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  offer: string;
  description?: string;
  category: 'food' | 'retail' | 'services' | 'other';
  businessName: string;
  location: {
    lat: number;
    lng: number;
    areaName: string;
  };
  validUntil: any;
  createdAt: any;
  mediaUrl?: string;
  savedBy: string[];
  // Profit Share & Agreement Data
  hasSignedProfitAgreement?: boolean;
  signerName?: string;
  signerPhone?: string;
  expectedUnitsPerMonth?: number;
  expectedProfitPerUnit?: number;
  selfReportedProfit?: number; 
  payoutStatus?: 'pending' | 'partially_paid' | 'fully_paid';
  adminVerifiedAmount?: number;
  paymentTxId?: string;
  isApproved?: boolean;
  isFreePromotion?: boolean;
  freePromoDetails?: string;
}

export interface DailyPromoProof {
  id: string;
  dealId: string;
  merchantId: string;
  merchantName: string;
  businessName: string;
  videoUrl: string;
  uploadedAt: any;
  remarks?: string;
}
