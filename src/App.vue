<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { usePushNotifications } from '@/composables/usePushNotifications'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import ConfirmProvider from '@/components/ConfirmProvider.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const { registerPushNotifications } = usePushNotifications()

function addPlatformClasses() {
  // Add platform classes to html element for CSS targeting
  if (Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('plt-capacitor')
    document.documentElement.classList.add(`plt-${Capacitor.getPlatform()}`)
  }
}

async function configureStatusBar() {
  if (!Capacitor.isNativePlatform()) return
  
  try {
    // IMPORTANT: overlay must be false so content stays below status bar
    await StatusBar.setOverlaysWebView({ overlay: false })
    
    // Dark style = light icons (for dark background)
    await StatusBar.setStyle({ style: Style.Dark })
    
    // Set dark background color
    await StatusBar.setBackgroundColor({ color: '#0a0a0a' })
    
    console.log('Status bar configured successfully')
  } catch (e) {
    console.log('Status bar configuration error:', e)
  }
}

onMounted(async () => {
  // Add platform classes for CSS
  addPlatformClasses()
  
  // Configure status bar first
  await configureStatusBar()
  
  // Initialize theme
  await themeStore.initTheme()
  
  // Check authentication
  await authStore.checkAuth()
  
  // Register push notifications after auth (so we have user context)
  if (authStore.isAuthenticated) {
    await registerPushNotifications()
  }
})

// Register push when user logs in
watch(() => authStore.isAuthenticated, async (isAuth) => {
  if (isAuth) {
    await registerPushNotifications()
  }
})

// Update status bar when theme changes
watch(() => themeStore.isDark, async () => {
  await configureStatusBar()
})
</script>

<template>
  <router-view />
  <ConfirmProvider />
</template>
