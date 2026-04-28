export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  language?: string;
  bio?: string;
  postCount?: number;
  earnings?: number;
  location?: {
    lat: number;
    lng: number;
    areaName: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  type: 'general' | 'news' | 'event' | 'weather' | 'alert';
  language: string;
  location?: {
    lat: number;
    lng: number;
    areaName: string;
    locationType?: 'home' | 'work' | 'public' | 'market' | 'other';
  };
  likes: string[];
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
