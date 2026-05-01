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
