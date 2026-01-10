import { onMounted, onUnmounted } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/**
 * Composable za detekciju kada se aplikacija vrati iz pozadine
 * Koristi se za refresh podataka kada korisnik ponovo otvori aplikaciju
 */
export function useAppResume(callback: () => void) {
  let listener: any = null

  onMounted(async () => {
    // Samo na native platformama (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      // Slušaj kada se aplikacija vrati u foreground
      listener = await App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          // Aplikacija je ponovo aktivna - učitaj nove podatke
          console.log('App resumed - refreshing data...')
          callback()
        }
      })
    }
  })

  onUnmounted(() => {
    // Cleanup listener kada se komponenta unmount-uje
    if (listener) {
      listener.remove()
    }
  })
}
