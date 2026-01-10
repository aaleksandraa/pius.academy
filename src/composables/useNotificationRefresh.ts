import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Composable za automatski refresh kada korisnik klikne na push notifikaciju
 * Sluša za 'refresh-from-notification' event i poziva callback ako je relevantna stranica
 * 
 * @param callback - Funkcija koja se poziva za refresh podataka
 * @param routePath - Putanja rute (npr. '/tests', '/') - opciono, koristi trenutnu rutu ako nije navedeno
 */
export function useNotificationRefresh(callback: () => void, routePath?: string) {
  const route = useRoute()
  const targetPath = routePath || route.path

  function handleNotificationRefresh(event: any) {
    const { link } = event.detail
    
    // Refresh if this notification is for this page
    if (link === targetPath || link === route.path) {
      console.log(`Refreshing ${targetPath} from notification`)
      callback()
    }
  }

  onMounted(() => {
    window.addEventListener('refresh-from-notification', handleNotificationRefresh as EventListener)
  })

  onUnmounted(() => {
    window.removeEventListener('refresh-from-notification', handleNotificationRefresh as EventListener)
  })
}
