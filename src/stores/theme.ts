import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/lib/storage'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true) // Default to dark theme

  async function initTheme() {
    const saved = await storage.get('theme')
    
    // Default to dark if no preference saved
    if (saved === 'light') {
      isDark.value = false
      document.documentElement.classList.remove('dark')
    } else {
      // Dark is default
      isDark.value = true
      document.documentElement.classList.add('dark')
      if (!saved) {
        await storage.set('theme', 'dark')
      }
    }
  }

  async function toggleTheme() {
    isDark.value = !isDark.value
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      await storage.set('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      await storage.set('theme', 'light')
    }
  }

  return { isDark, initTheme, toggleTheme }
})
