import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly TTL = 5 * 60 * 1000;
  private store = new Map<string, CacheEntry<unknown>>();

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    const expired = Date.now() - entry.cachedAt > this.TTL;
    if (expired) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  get<T>(key: string): T | null {
    if (!this.has(key)) return null;
    return (this.store.get(key) as CacheEntry<T>).data;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, cachedAt: Date.now() });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
