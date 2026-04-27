import { formatDistanceToNow, format } from 'date-fns';

export function formatSafeDate(timestamp: any, variant: 'relative' | 'full' = 'relative'): string {
  if (!timestamp) return 'Just now';
  
  let date: Date;
  
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'Just now';
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Just now';
  }

  if (variant === 'relative') {
    try {
      return formatDistanceToNow(date) + ' ago';
    } catch (e) {
      return 'Recently';
    }
  }

  return format(date, 'PPP');
}
