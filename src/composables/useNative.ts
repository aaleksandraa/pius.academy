import { ref, onMounted, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App, type URLOpenListenerEvent } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export function useNative() {
  const isNative = ref(Capacitor.isNativePlatform())
  const platform = ref(Capacitor.getPlatform())
  const keyboardVisible = ref(false)
  const keyboardHeight = ref(0)

  onMounted(async () => {
    if (!isNative.value) return

    // Hide splash screen after app is ready
    await SplashScreen.hide()

    // Setup status bar
    await setupStatusBar()

    // Setup keyboard listeners
    setupKeyboardListeners()

    // Setup deep link handling
    setupDeepLinks()

    // Setup back button handling (Android)
    setupBackButton()
  })

  onUnmounted(() => {
    if (!isNative.value) return
    
    // Remove listeners
    Keyboard.removeAllListeners()
    App.removeAllListeners()
  })

  async function setupStatusBar() {
    try {
      // Set status bar style based on theme
      const isDark = document.documentElement.classList.contains('dark')
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
      
      if (platform.value === 'android') {
        await StatusBar.setBackgroundColor({ color: isDark ? '#0a0a0a' : '#ffffff' })
      }
    } catch (error) {
      console.error('Error setting up status bar:', error)
    }
  }

  function setupKeyboardListeners() {
    Keyboard.addListener('keyboardWillShow', (info) => {
      keyboardVisible.value = true
      keyboardHeight.value = info.keyboardHeight
    })

    Keyboard.addListener('keyboardWillHide', () => {
      keyboardVisible.value = false
      keyboardHeight.value = 0
    })
  }

  function setupDeepLinks() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('Deep link opened:', event.url)
      // Handle deep links here
      // Example: pmuacademy://course/123
      const url = new URL(event.url)
      const path = url.pathname
      if (path) {
        // Navigate to the path
        window.location.href = path
      }
    })
  }

  function setupBackButton() {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        // Optionally minimize app or show exit confirmation
        App.minimizeApp()
      }
    })
  }

  // Haptic feedback functions
  async function hapticLight() {
    if (!isNative.value) return
    await Haptics.impact({ style: ImpactStyle.Light })
  }

  async function hapticMedium() {
    if (!isNative.value) return
    await Haptics.impact({ style: ImpactStyle.Medium })
  }

  async function hapticHeavy() {
    if (!isNative.value) return
    await Haptics.impact({ style: ImpactStyle.Heavy })
  }

  // Update status bar when theme changes
  async function updateStatusBarTheme(isDark: boolean) {
    if (!isNative.value) return
    
    try {
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
      
      if (platform.value === 'android') {
        await StatusBar.setBackgroundColor({ color: isDark ? '#0a0a0a' : '#ffffff' })
      }
    } catch (error) {
      console.error('Error updating status bar:', error)
    }
  }

  return {
    isNative,
    platform,
    keyboardVisible,
    keyboardHeight,
    hapticLight,
    hapticMedium,
    hapticHeavy,
    updateStatusBarTheme,
  }
}
