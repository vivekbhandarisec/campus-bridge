const OFFLINE_CACHE_KEY = 'campusbridge-offline-cache';
const OFFLINE_QUEUE_KEY = 'campusbridge-offline-queue';

interface OfflineCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

interface OfflineAction {
  id: string;
  type: 'POST' | 'PUT' | 'DELETE';
  url: string;
  payload?: any;
  timestamp: number;
}

class OfflineStorage {
  // Cache data with TTL
  static setCache(key: string, data: any, ttl: number = 5 * 60 * 1000) { // Default 5 minutes
    if (typeof window === 'undefined') return;
    
    const cache = this.getAllCache();
    cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
  }

  // Get cached data if not expired
  static getCache(key: string): any | null {
    if (typeof window === 'undefined') return null;
    
    const cache = this.getAllCache();
    const item = cache[key];
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      delete cache[key];
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    
    return item.data;
  }

  // Get entire cache
  static getAllCache(): OfflineCache {
    if (typeof window === 'undefined') return {};
    
    try {
      const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  // Add action to offline queue
  static queueAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): string {
    if (typeof window === 'undefined') return '';
    
    const queue = this.getQueue();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullAction: OfflineAction = {
      ...action,
      id,
      timestamp: Date.now()
    };
    
    queue.push(fullAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    
    return id;
  }

  // Get offline queue
  static getQueue(): OfflineAction[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const queued = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return queued ? JSON.parse(queued) : [];
    } catch {
      return [];
    }
  }

  // Remove action from queue
  static removeAction(id: string): void {
    if (typeof window === 'undefined') return;
    
    const queue = this.getQueue();
    const filtered = queue.filter(action => action.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  }

  // Clear all offline data
  static clear(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(OFFLINE_CACHE_KEY);
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  // Check if online
  static isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  }
}

export default OfflineStorage;
