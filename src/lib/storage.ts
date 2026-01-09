import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// Storage helper that uses Capacitor Preferences on native and localStorage on web
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key })
      return value
    }
    return localStorage.getItem(key)
  },

  async set(key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value })
    } else {
      localStorage.setItem(key, value)
    }
  },

  async remove(key: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key })
    } else {
      localStorage.removeItem(key)
    }
  },

  // Sync version for immediate access (uses localStorage as fallback)
  getSync(key: string): string | null {
    return localStorage.getItem(key)
  },

  setSync(key: string, value: string): void {
    localStorage.setItem(key, value)
    // Also save to Preferences on native
    if (Capacitor.isNativePlatform()) {
      Preferences.set({ key, value })
    }
  },

  removeSync(key: string): void {
    localStorage.removeItem(key)
    if (Capacitor.isNativePlatform()) {
      Preferences.remove({ key })
    }
  }
}
